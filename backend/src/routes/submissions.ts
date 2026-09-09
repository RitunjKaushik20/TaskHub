import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { getIO } from '../lib/socket';

const router = Router();
const prisma = new PrismaClient();

// POST /api/submissions
router.post('/', requireAuth, requireRoles(['WORKER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId, proofType, proofContent, fileUrl, linkUrl } = req.body;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return sendError(res, 'Task not found', undefined, 404);
    }

    const worker = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    const submission = await prisma.submission.create({
      data: {
        taskId,
        workerId: req.user!.userId,
        proofType: proofType || 'LINK',
        proofContent,
        fileUrl,
        linkUrl,
        rewardAmount: task.reward,
        status: 'UNDER_REVIEW',
      },
      include: {
        task: { select: { title: true } },
        worker: { select: { name: true } },
      },
    });

    // Update task status to SUBMITTED
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'SUBMITTED' },
    });

    return sendSuccess(res, 'Proof submitted successfully', {
      ...submission,
      taskTitle: submission.task.title,
      workerName: submission.worker.name,
    }, 201);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to submit proof', undefined, 500);
  }
});

// GET /api/submissions
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        task: { select: { title: true } },
        worker: { select: { name: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const formatted = submissions.map((s) => ({
      ...s,
      taskTitle: s.task.title,
      workerName: s.worker.name,
    }));

    return sendSuccess(res, 'Submissions retrieved', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch submissions', undefined, 500);
  }
});

// POST /api/submissions/:id/review
router.post('/:id/review', requireAuth, requireRoles(['BUSINESS', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, qualityScore, feedback, rejectionReason } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        task: true,
        worker: true,
      },
    });

    if (!submission) {
      return sendError(res, 'Submission not found', undefined, 404);
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status,
        qualityScore: qualityScore ? Number(qualityScore) : undefined,
        feedback,
        rejectionReason,
        reviewedAt: new Date(),
      },
      include: {
        task: { select: { title: true } },
        worker: { select: { name: true } },
      },
    });

    // If APPROVED, release reward payout to worker wallet
    if (status === 'APPROVED') {
      const wallet = await prisma.wallet.findUnique({ where: { userId: submission.workerId } });
      if (wallet) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: wallet.availableBalance + submission.rewardAmount,
            totalEarned: wallet.totalEarned + submission.rewardAmount,
          },
        });

        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'TASK_PAYOUT',
            amount: submission.rewardAmount,
            status: 'COMPLETED',
            description: `Payout for task: ${submission.task.title}`,
            referenceId: submission.taskId,
          },
        });
      }

      await prisma.task.update({
        where: { id: submission.taskId },
        data: { status: 'APPROVED' },
      });
    }

    const io = getIO();
    if (io) {
      io.emit('submission-updated', {
        id: updated.id,
        taskId: updated.taskId,
        workerId: updated.workerId,
        status: updated.status,
        qualityScore: updated.qualityScore,
        feedback: updated.feedback,
        rejectionReason: updated.rejectionReason,
        reviewedAt: updated.reviewedAt,
        taskTitle: updated.task.title,
        workerName: updated.worker.name,
        rewardAmount: updated.rewardAmount,
      });
    }

    return sendSuccess(res, `Submission review status updated to ${status}`, {
      ...updated,
      taskTitle: updated.task.title,
      workerName: updated.worker.name,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to review submission', undefined, 500);
  }
});

export default router;

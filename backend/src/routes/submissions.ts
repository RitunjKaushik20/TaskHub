import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { requireBusinessSubmissionOwner } from '../middleware/taskOwnership';
import { requireEmailVerified } from '../middleware/emailVerified';
import { getIO, emitDashboardUpdate } from '../lib/socket';

const router = Router();
const prisma = new PrismaClient();

const submitProofSchema = z.object({
  taskId: z.string().min(1).max(80),
  proofType: z.enum(['FILE', 'LINK', 'TEXT', 'HYBRID']).default('LINK'),
  proofContent: z.string().trim().min(1, 'Proof details are required').max(10000, 'Proof details must be 10000 characters or fewer'),
  fileUrl: z.string().trim().max(2000).nullable().optional(),
  linkUrl: z.string().trim().max(2000).nullable().optional(),
});

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'PENDING']),
  qualityScore: z.coerce.number().int().min(1).max(5).optional().nullable(),
  feedback: z.string().trim().max(2000).optional().nullable(),
  rejectionReason: z.string().trim().max(2000).optional().nullable(),
});

// POST /api/submissions
// Part B: submitting proof requires a verified email.
router.post('/', requireAuth, requireRoles(['WORKER', 'ADMIN']), requireEmailVerified, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = submitProofSchema.safeParse(req.body);
    if (!parsed.success) {
      const formattedErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        formattedErrors[field] = [issue.message];
      });
      return sendError(res, 'Validation failed', formattedErrors, 400);
    }

    const { taskId, proofType, proofContent, fileUrl, linkUrl } = parsed.data;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return sendError(res, 'Task not found', undefined, 404);
    }

    const submission = await prisma.submission.create({
      data: {
        taskId,
        workerId: req.user!.userId,
        proofType,
        proofContent,
        fileUrl: fileUrl || undefined,
        linkUrl: linkUrl || undefined,
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
// Part A (data isolation): results are scoped to the calling account so a
// business only ever sees submissions for ITS OWN task batches, a worker only
// their own work, and admins see everything. 404/403 on foreign resources.
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user!.role;
    let where: any = {};

    if (role === 'BUSINESS') {
      where.task = { businessId: req.user!.userId };
    } else if (role === 'WORKER') {
      where.workerId = req.user!.userId;
    } else if (role !== 'ADMIN') {
      return sendError(res, 'Forbidden. You do not have permission to view submissions.', undefined, 403);
    }

    const submissions = await prisma.submission.findMany({
      where,
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
// Part A (data isolation): the reviewing account must own the task batch the
// submission belongs to (ADMIN bypass). Direct calls on a foreign submission
// return 403.
router.post('/:id/review', requireAuth, requireRoles(['BUSINESS', 'ADMIN']), requireBusinessSubmissionOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      const formattedErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        formattedErrors[field] = [issue.message];
      });
      return sendError(res, 'Validation failed', formattedErrors, 400);
    }
    const { status, qualityScore, feedback, rejectionReason } = parsed.data;

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
        feedback: feedback || undefined,
        rejectionReason: rejectionReason || undefined,
        reviewedAt: new Date(),
      },
      include: {
        task: { select: { title: true } },
        worker: { select: { name: true } },
      },
    });

    if (status === 'APPROVED') {
      await prisma.task.update({
        where: { id: submission.taskId },
        data: { status: 'APPROVED' },
      });
    }

    const io = getIO();
    if (io) {
      emitDashboardUpdate();
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
        paymentStatus: updated.paymentStatus,
        markedPaidAt: updated.markedPaidAt,
        markedPaidBy: updated.markedPaidBy,
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

// POST /api/submissions/:id/mark-paid
// Manual payment confirmation — TaskHub never moves money. Either the WORKER who
// did the task or the BUSINESS that owns the task batch may confirm the manual
// off-platform settlement. The endpoint is idempotent: a second "Mark as Paid"
// from either side is an acknowledged no-op (returns existing state, never a
// duplicate ledger row) so earnings/spending can never double-count.
router.post('/:id/mark-paid', requireAuth, requireRoles(['WORKER', 'BUSINESS', 'ADMIN']), requireEmailVerified, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

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

    // Access control: the worker owns the work, the business owns the batch.
    const role = req.user!.role;
    const canMark =
      role === 'ADMIN' ||
      (role === 'WORKER' && submission.workerId === req.user!.userId) ||
      (role === 'BUSINESS' && submission.task.businessId === req.user!.userId);
    if (!canMark) {
      return sendError(res, 'Forbidden. You do not have permission to mark this submission as paid.', undefined, 403);
    }

    if (submission.status !== 'APPROVED') {
      return sendError(res, 'Only APPROVED submissions can be marked as paid', undefined, 400);
    }

    // Idempotent guard: already settled from either side -> acknowledged no-op.
    if (submission.paymentStatus === 'MARKED_PAID') {
      const current = await prisma.submission.findUnique({
        where: { id },
        include: {
          task: { select: { title: true } },
          worker: { select: { name: true } },
        },
      });
      return sendSuccess(res, 'Submission was already marked as paid', {
        ...current,
        taskTitle: current!.task.title,
        workerName: current!.worker.name,
        alreadyPaid: true,
      });
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        paymentStatus: 'MARKED_PAID',
        markedPaidAt: new Date(),
        markedPaidBy: req.user!.userId,
      },
      include: {
        task: { select: { title: true } },
        worker: { select: { name: true } },
      },
    });

    await prisma.task.update({
      where: { id: submission.taskId },
      data: { status: 'PAID' },
    });

    // Audit ledger (repurposed Transaction model): one TASK_PAYOUT row per settled
    // submission — the source of truth for worker earnings / business spending.
    let wallet = await prisma.wallet.findUnique({ where: { userId: submission.workerId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: submission.workerId,
          availableBalance: 0.0,
          pendingBalance: 0.0,
          totalEarned: 0.0,
          totalWithdrawn: 0.0,
        },
      });
    }
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'TASK_PAYOUT',
        amount: submission.rewardAmount,
        status: 'COMPLETED',
        description: `Manual payment confirmed for task: ${submission.task.title}`,
        referenceId: submission.id,
      },
    });

    const io = getIO();
    if (io) {
      emitDashboardUpdate();
      io.emit('submission-updated', {
        id: updated.id,
        taskId: updated.taskId,
        workerId: updated.workerId,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        markedPaidAt: updated.markedPaidAt,
        markedPaidBy: updated.markedPaidBy,
        taskTitle: updated.task.title,
        workerName: updated.worker.name,
        rewardAmount: updated.rewardAmount,
      });
    }

    return sendSuccess(res, 'Submission marked as paid', {
      ...updated,
      taskTitle: updated.task.title,
      workerName: updated.worker.name,
      alreadyPaid: false,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to mark submission as paid', undefined, 500);
  }
});

export default router;

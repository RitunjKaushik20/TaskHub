import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Require ADMIN role for all routes in this router
router.use(requireAuth, requireRoles(['ADMIN']));

// GET /api/admin/users
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { postedTasks: true, submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      kycStatus: u.kycStatus,
      joinedDate: u.createdAt.toISOString().split('T')[0],
      tasksCount: u.role === 'BUSINESS' ? u._count.postedTasks : u._count.submissions,
    }));

    return sendSuccess(res, 'Admin users list fetched', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch users', undefined, 500);
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });

    return sendSuccess(res, `User status updated to ${status}`, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      kycStatus: user.kycStatus,
      joinedDate: user.createdAt.toISOString().split('T')[0],
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to update user status', undefined, 500);
  }
});

// GET /api/admin/tasks
router.get('/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { business: { select: { name: true, companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tasks.map((t) => ({
      ...t,
      requiredSkills: t.requiredSkills ? JSON.parse(t.requiredSkills) : [],
      businessName: t.business.name,
      businessCompany: t.business.companyName || t.business.name,
    }));

    return sendSuccess(res, 'Admin tasks fetched', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch admin tasks', undefined, 500);
  }
});

// GET /api/admin/submissions
router.get('/submissions', async (req: AuthenticatedRequest, res: Response) => {
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

    return sendSuccess(res, 'Admin submissions fetched', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch admin submissions', undefined, 500);
  }
});

// GET /api/admin/verification
router.get('/verification', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await prisma.user.findMany({
      where: { kycStatus: 'PENDING' },
    });

    return sendSuccess(res, 'Verification queue fetched', queue);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch verification queue', undefined, 500);
  }
});

// GET /api/admin/withdrawals
router.get('/withdrawals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawalRequest.findMany({
      include: { worker: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = withdrawals.map((w) => ({
      ...w,
      workerName: w.worker.name,
      workerEmail: w.worker.email,
    }));

    return sendSuccess(res, 'Withdrawal processing queue fetched', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch withdrawal queue', undefined, 500);
  }
});

// POST /api/admin/withdrawals/:id/process
router.post('/withdrawals/:id/process', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'APPROVE' | 'REJECT'

    const withdrawal = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
        processedAt: new Date(),
      },
      include: { worker: { select: { name: true, email: true } } },
    });

    // Update associated transaction
    const tx = await prisma.transaction.findFirst({
      where: { referenceId: id, type: 'WITHDRAWAL' },
    });

    if (tx) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: action === 'APPROVE' ? 'COMPLETED' : 'FAILED',
        },
      });
    }

    // If REJECTED, refund the worker's wallet
    if (action === 'REJECT') {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: withdrawal.workerId },
      });
      if (wallet) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: wallet.availableBalance + withdrawal.amount,
            totalWithdrawn: Math.max(0, wallet.totalWithdrawn - withdrawal.amount),
          },
        });
      }
    }

    return sendSuccess(res, `Withdrawal ${action === 'APPROVE' ? 'approved' : 'rejected'}`, {
      ...withdrawal,
      workerName: withdrawal.worker.name,
      workerEmail: withdrawal.worker.email,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to process withdrawal', undefined, 500);
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
    });

    return sendSuccess(res, 'Audit logs fetched', logs);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch audit logs', undefined, 500);
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    return sendSuccess(res, 'Admin analytics fetched', {
      totalGmv: 42850.0,
      platformRevenue: 2142.5,
      activeTasksCount: 38,
      activeWorkersCount: 1420,
      activeBusinessesCount: 185,
      monthlyGrowth: [
        { month: 'May', volume: 12000, revenue: 600 },
        { month: 'Jun', volume: 18500, revenue: 925 },
        { month: 'Jul', volume: 27000, revenue: 1350 },
        { month: 'Aug', volume: 34500, revenue: 1725 },
        { month: 'Sep', volume: 42850, revenue: 2142.5 },
      ],
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch analytics', undefined, 500);
  }
});

export default router;

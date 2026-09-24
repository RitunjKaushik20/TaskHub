import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Require ADMIN role for all routes in this router
router.use(requireAuth, requireRoles(['ADMIN']));

const APPROVAL_STATUS = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;

const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'FROZEN']),
});

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
      approvalStatus: u.approvalStatus,
      companyName: u.companyName,
      companyProfile: u.companyProfile,
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
    const parsed = userStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Invalid user status', undefined, 400);
    }
    const { status } = parsed.data;

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

// ---------------------------------------------------------------------------
// Feature 2 — Business Approvals
// ---------------------------------------------------------------------------

// GET /api/admin/businesses
// Lists business accounts for review. Pending accounts are listed first,
// then approved/rejected/suspended in created order.
router.get('/businesses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filter } = req.query as { filter?: string };

    const businesses = await prisma.user.findMany({
      where: {
        role: 'BUSINESS',
        ...(filter && APPROVAL_STATUS.includes(filter as any)
          ? { approvalStatus: filter as any }
          : {}),
      },
      include: {
        _count: { select: { postedTasks: true } },
      },
      orderBy: [
        // Secondary ordering only (created desc). Pending-first ordering is done
        // in-process below so PENDING always floats to the top of the queue.
        { createdAt: 'desc' },
      ],
    });

    // Move PENDING to the front regardless of enum order.
    const priority = (status: string) =>
      status === 'PENDING' ? 0 : status === 'SUSPENDED' ? 3 : status === 'REJECTED' ? 2 : 1;
    const sorted = [...businesses].sort((a, b) => priority(a.approvalStatus) - priority(b.approvalStatus));

    const formatted = sorted.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      companyName: b.companyName,
      companyProfile: b.companyProfile,
      approvalStatus: b.approvalStatus,
      kycStatus: b.kycStatus,
      status: b.status,
      createdAt: b.createdAt,
      tasksCount: b._count.postedTasks,
      joinedDate: b.createdAt.toISOString().split('T')[0],
    }));

    return sendSuccess(res, 'Business accounts fetched', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch business accounts', undefined, 500);
  }
});

// POST /api/admin/businesses/:id/approval
// action: 'APPROVE' | 'REJECT' | 'SUSPEND'  (reason optional, recommended)
// Logged to AdminApprovalLog + AuditLog. Email/notification is stubbed (TODO).
router.post('/businesses/:id/approval', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!action || !['APPROVE', 'REJECT', 'SUSPEND'].includes(action)) {
      return sendError(res, 'Invalid approval action. Use APPROVE, REJECT or SUSPEND.', undefined, 400);
    }

    const business = await prisma.user.findUnique({ where: { id } });
    if (!business || business.role !== 'BUSINESS') {
      return sendError(res, 'Business account not found', undefined, 404);
    }

    const approvalStatus =
      action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'SUSPENDED';

    const updated = await prisma.user.update({
      where: { id },
      data: { approvalStatus },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        companyProfile: true,
        approvalStatus: true,
        kycStatus: true,
        status: true,
        createdAt: true,
      },
    });

    const admin = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { name: true, email: true },
    });

    // Audit trail: dedicated approval log + generic audit log entry
    await prisma.adminApprovalLog.create({
      data: {
        adminId: req.user!.userId,
        adminName: admin?.name || req.user!.email || 'Admin',
        businessId: business.id,
        businessEmail: business.email,
        action: `${approvalStatus}`,
        reason: reason || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorName: admin?.name || req.user!.email || 'Admin',
        actorRole: 'ADMIN',
        action: `BUSINESS_${approvalStatus}`,
        target: `${business.email} (${business.name})`,
        ipAddress: req.ip || 'unknown',
      },
    });

    // TODO(notification): send email / in-app notification to the business owner
    // when their approval status changes. No email/notification service exists in
    // this codebase yet, so this is intentionally stubbed — wire it here later.
    // await notifications.send({ to: business.email, template: `business_${approvalStatus.toLowerCase()}`, reason });

    return sendSuccess(res, `Business account ${approvalStatus === 'APPROVED' ? 'approved' : approvalStatus === 'REJECTED' ? 'rejected' : 'suspended'}`, {
      ...updated,
      companyProfile: updated.companyProfile,
      notificationSent: false,
      notificationNote: 'TODO: email/notification not wired — see /api/admin/businesses/:id/approval',
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to update business approval status', undefined, 500);
  }
});

// GET /api/admin/businesses/:id/approval-history
// Returns the audit trail for a single business account.
router.get('/businesses/:id/approval-history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await prisma.adminApprovalLog.findMany({
      where: { businessId: id },
      orderBy: { timestamp: 'desc' },
    });
    return sendSuccess(res, 'Business approval history fetched', logs);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch approval history', undefined, 500);
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

// ---------------------------------------------------------------------------
// Part B — Live SuperAdmin dashboard stats
// ---------------------------------------------------------------------------
// These are real, aggregated directly from the database at request time (no
// cache, no hardcoded figures). The Overview page consumes this and refreshes
// via Socket.IO (`dashboard:update`) whenever an event moves a number:
//   • workers/businesses register            -> auth register
//   • a submission is marked as paid         -> submissions mark-paid
// No money moves through the platform: totalGmv and payoutsSettled are both
// computed live from MARKED_PAID submissions, so they can never drift.
// Empty-platform reads return a true zero-state ($0 / 0 / 0 registered / no
// activity) rather than fabricated growth numbers.
router.get('/dashboard-stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Settled GMV = every submission confirmed as paid (reward delivered to the
    // worker). Approvals alone don't count — only MARKED_PAID does.
    const settledAgg = await prisma.submission.aggregate({
      where: { paymentStatus: 'MARKED_PAID' },
      _sum: { rewardAmount: true },
    });
    const gmv = settledAgg._sum.rewardAmount || 0;

    const [activeWorkers, activeBusinesses, usersForGrowth] = await Promise.all([
      prisma.user.count({ where: { role: 'WORKER', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'BUSINESS', status: 'ACTIVE' } }),
      prisma.user.findMany({
        select: { role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Real platform health signal: the most recent DB write across the
    // transactional tables (payments, tasks, registrations). A null value
    // (nothing has ever been written) renders as "No activity yet".
    const lastSettled = await prisma.submission.aggregate({
      _max: { markedPaidAt: true },
    });
    const lastSubmission = await prisma.submission.aggregate({
      _max: { submittedAt: true },
    });
    const lastTask = await prisma.task.aggregate({
      _max: { createdAt: true },
    });
    const lastUser = await prisma.user.aggregate({
      _max: { createdAt: true },
    });
    const lastDbWriteAt = [
      lastSettled._max.markedPaidAt,
      lastSubmission._max.submittedAt,
      lastTask._max.createdAt,
      lastUser._max.createdAt,
    ]
      .filter((d): d is Date => Boolean(d))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    // Real registration growth: workers vs businesses bucketed by month over
    // the trailing 6 months (empty when there is no data yet).
    const now = new Date();
    const buckets: { key: string; label: string; workers: number; businesses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en-US', { month: 'short' }),
        workers: 0,
        businesses: 0,
      });
    }
    for (const u of usersForGrowth) {
      const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.find((b) => b.key === key);
      if (!bucket) continue; // outside trailing window
      if (u.role === 'WORKER') bucket.workers += 1;
      else if (u.role === 'BUSINESS') bucket.businesses += 1;
    }
    const monthlyGrowth = buckets
      .filter((b) => b.workers > 0 || b.businesses > 0)
      .map((b) => ({ month: b.label, workers: b.workers, businesses: b.businesses }));

    return sendSuccess(res, 'Admin dashboard stats fetched', {
      totalGmv: gmv,
      payoutsSettled: gmv,
      activeWorkersCount: activeWorkers,
      activeBusinessesCount: activeBusinesses,
      platformHealth: {
        dbOnline: true,
        lastDbWriteAt: lastDbWriteAt ? lastDbWriteAt.toISOString() : null,
      },
      monthlyGrowth,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch dashboard stats', undefined, 500);
  }
});

export default router;

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { requireApprovedBusiness } from '../middleware/businessApproval';
import { requireBusinessTaskOwner } from '../middleware/taskOwnership';
import { requireEmailVerified } from '../middleware/emailVerified';

const router = Router();
const prisma = new PrismaClient();

// GET /api/tasks
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, difficulty } = req.query;

    const where: any = {
      // Feature 2: only surface tasks published by APPROVED businesses in the
      // public marketplace. Rejected/suspended/pending businesses' tasks are
      // hidden from discovery.
      business: { approvalStatus: 'APPROVED' },
    };

    if (category && category !== 'ALL') {
      where.category = String(category);
    }
    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = String(difficulty);
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        business: {
          select: { name: true, companyName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tasks.map((t) => ({
      ...t,
      requiredSkills: t.requiredSkills ? JSON.parse(t.requiredSkills) : [],
      businessName: t.business.name,
      businessCompany: t.business.companyName || t.business.name,
    }));

    return sendSuccess(res, 'Tasks fetched successfully', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch tasks', undefined, 500);
  }
});

// GET /api/tasks/mine
// Part A (data isolation): business dashboard views MUST only ever list the
// calling business's OWN task batches. Public marketplace data is never used
// for the dashboard. This route must stay defined BEFORE /:id.
router.get('/mine', requireAuth, requireRoles(['BUSINESS', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, difficulty, status } = req.query;

    const where: any = {
      businessId: req.user!.userId,
    };

    if (category && category !== 'ALL') {
      where.category = String(category);
    }
    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = String(difficulty);
    }
    if (status && status !== 'ALL') {
      where.status = String(status);
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        business: {
          select: { name: true, companyName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tasks.map((t) => ({
      ...t,
      requiredSkills: t.requiredSkills ? JSON.parse(t.requiredSkills) : [],
      businessName: t.business.name,
      businessCompany: t.business.companyName || t.business.name,
    }));

    return sendSuccess(res, 'Your tasks fetched successfully', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch your tasks', undefined, 500);
  }
});

// GET /api/tasks/:id
// Public marketplace detail endpoint (not used by the business dashboard).
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        business: { select: { name: true, companyName: true } },
      },
    });

    if (!task) {
      return sendError(res, 'Task not found', undefined, 404);
    }

    return sendSuccess(res, 'Task details fetched', {
      ...task,
      requiredSkills: task.requiredSkills ? JSON.parse(task.requiredSkills) : [],
      businessName: task.business.name,
      businessCompany: task.business.companyName || task.business.name,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch task', undefined, 500);
  }
});

// POST /api/tasks
// Feature 2: task publishing is gated on the business account being approved.
// Part B: publishing also requires a verified email.
router.post('/', requireAuth, requireRoles(['BUSINESS', 'ADMIN']), requireApprovedBusiness, requireEmailVerified, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      instructions,
      category,
      difficulty,
      reward,
      currency,
      workerLimit,
      deadline,
      requiredSkills,
      proofRequirements,
    } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        instructions,
        category,
        difficulty: difficulty || 'BEGINNER',
        reward: Number(reward),
        currency: currency === 'INR' ? 'INR' : 'USD',
        workerLimit: Number(workerLimit) || 1,
        deadline: new Date(deadline),
        requiredSkills: Array.isArray(requiredSkills) ? JSON.stringify(requiredSkills) : JSON.stringify([requiredSkills]),
        proofRequirements,
        businessId: req.user!.userId,
        status: 'AVAILABLE',
      },
      include: {
        business: { select: { name: true, companyName: true } },
      },
    });

    return sendSuccess(res, 'Task created successfully', {
      ...task,
      requiredSkills: JSON.parse(task.requiredSkills),
      businessName: task.business.name,
      businessCompany: task.business.companyName || task.business.name,
    }, 201);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to create task', undefined, 500);
  }
});

// POST /api/tasks/:id/accept
// Part B: claiming a seat requires a verified email.
router.post('/:id/accept', requireAuth, requireRoles(['WORKER', 'ADMIN']), requireEmailVerified, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return sendError(res, 'Task not found', undefined, 404);
    }

    if (task.assignedWorkersCount >= task.workerLimit) {
      return sendError(res, 'Task seat limit has been reached', undefined, 400);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        assignedWorkersCount: task.assignedWorkersCount + 1,
        status: 'IN_PROGRESS',
      },
      include: {
        business: { select: { name: true, companyName: true } },
      },
    });

    return sendSuccess(res, 'Task seat locked & accepted', {
      ...updated,
      requiredSkills: JSON.parse(updated.requiredSkills),
      businessName: updated.business.name,
      businessCompany: updated.business.companyName || updated.business.name,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to accept task', undefined, 500);
  }
});

// PATCH /api/tasks/:id/status
// Feature 2: status changes that move a task toward publication are also gated.
// Part A (data isolation): business may only update status of their OWN tasks.
router.patch('/:id/status', requireAuth, requireApprovedBusiness, requireBusinessTaskOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        business: { select: { name: true, companyName: true } },
      },
    });

    return sendSuccess(res, 'Task status updated', {
      ...updated,
      requiredSkills: JSON.parse(updated.requiredSkills),
      businessName: updated.business.name,
      businessCompany: updated.business.companyName || updated.business.name,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to update task status', undefined, 500);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, requireRoles(['BUSINESS', 'ADMIN']), requireBusinessTaskOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Clean up related records
    await prisma.chatMessage.deleteMany({ where: { taskId: id } });
    await prisma.submission.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });

    return sendSuccess(res, 'Task batch deleted successfully', { id });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to delete task', undefined, 500);
  }
});

export default router;

import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/tasks
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, difficulty } = req.query;

    const where: any = {};

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

// GET /api/tasks/:id
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
router.post('/', requireAuth, requireRoles(['BUSINESS', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/:id/accept', requireAuth, requireRoles(['WORKER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
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
router.patch('/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
router.delete('/:id', requireAuth, requireRoles(['BUSINESS', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return sendError(res, 'Task not found', undefined, 404);
    }

    if (req.user!.role !== 'ADMIN' && task.businessId !== req.user!.userId) {
      return sendError(res, 'Forbidden: You do not have permission to delete this task batch', undefined, 403);
    }

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

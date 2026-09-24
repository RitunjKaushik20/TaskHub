import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { requireApprovedBusiness } from '../middleware/businessApproval';
import { requireBusinessTaskOwner } from '../middleware/taskOwnership';
import { requireEmailVerified } from '../middleware/emailVerified';

const router = Router();
const prisma = new PrismaClient();

// Server-side validation for published task batches. Limits keep stored content
// bounded and drop malformed payloads with a clean 400 (never a 500).
const createTaskSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150, 'Title must be 150 characters or fewer'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be 5000 characters or fewer'),
  instructions: z.string().trim().min(5, 'Instructions must be at least 5 characters').max(10000, 'Instructions must be 10000 characters or fewer'),
  category: z.string().trim().min(2, 'Category is required').max(80),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
  reward: z.number().min(0.5, 'Reward must be at least $0.50').max(100000, 'Reward is unreasonably high').or(z.coerce.number().min(0.5).max(100000)),
  currency: z.enum(['USD', 'INR']).default('USD'),
  workerLimit: z.coerce.number().int('Worker limit must be a whole number').min(1, 'Worker limit must be at least 1').max(1000, 'Worker limit too high'),
  deadline: z.string().refine((v) => !Number.isNaN(new Date(v).getTime()) && new Date(v).getTime() > Date.now(), {
    message: 'Deadline must be a valid future date',
  }),
  requiredSkills: z.array(z.string().trim().min(1).max(40)).min(1, 'Add at least one required skill').max(30),
  proofRequirements: z.string().trim().min(1, 'Proof requirements are required').max(2000, 'Proof requirements must be 2000 characters or fewer'),
});

// Status updates must be a valid TaskStatus enum value. Arbitrary strings
// previously slipped through to Prisma and surfaced as a generic 500.
const taskStatusSchema = z.object({
  status: z.enum([
    'AVAILABLE',
    'ASSIGNED',
    'IN_PROGRESS',
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'PAID',
    'COMPLETED',
    'CANCELLED',
  ]),
});

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
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      const formattedErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        formattedErrors[field] = [issue.message];
      });
      return sendError(res, 'Validation failed', formattedErrors, 400);
    }

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
    } = parsed.data;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        instructions,
        category,
        difficulty,
        reward,
        currency: currency === 'INR' ? 'INR' : 'USD',
        workerLimit,
        deadline: new Date(deadline),
        requiredSkills: JSON.stringify(requiredSkills),
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
    const parsed = taskStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Invalid task status', undefined, 400);
    }
    const { status } = parsed.data;

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

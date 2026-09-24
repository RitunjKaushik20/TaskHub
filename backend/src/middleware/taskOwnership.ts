import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './auth';
import { sendError } from '../utils/response';

const prisma = new PrismaClient();

// Part A — Business data isolation (CRITICAL).
//
// Every business-scoped write/read on a task or submission must verify that the
// resource actually belongs to the calling business account. Admin accounts
// bypass the ownership check (they have global visibility).

export async function requireBusinessTaskOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return sendError(res, 'Task not found', undefined, 404);
    }

    if (req.user!.role !== 'ADMIN' && task.businessId !== req.user!.userId) {
      return sendError(
        res,
        'Forbidden: This task does not belong to your business account. Access denied.',
        undefined,
        403
      );
    }

    next();
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to verify task ownership', undefined, 500);
  }
}

export async function requireBusinessSubmissionOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!submission || !submission.task) {
      return sendError(res, 'Submission not found', undefined, 404);
    }

    if (req.user!.role !== 'ADMIN' && submission.task.businessId !== req.user!.userId) {
      return sendError(
        res,
        'Forbidden: This submission does not belong to one of your task batches. Access denied.',
        undefined,
        403
      );
    }

    next();
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to verify submission ownership', undefined, 500);
  }
}

// Chat access rule: the owning business (or ADMIN) may open their own task
// rooms; a WORKER may only access chat for tasks they are actually engaged in —
// i.e. they hold a submission on that task. This closes the data-isolation gap
// where any worker could read/post in ANY task's conversation.
export async function requireChatTaskAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { taskId } = req.params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      return sendError(res, 'Task not found', undefined, 404);
    }

    if (req.user!.role === 'BUSINESS' && task.businessId !== req.user!.userId) {
      return sendError(
        res,
        'Forbidden: This chat room belongs to another business. Access denied.',
        undefined,
        403
      );
    }

    if (req.user!.role === 'WORKER') {
      const submission = await prisma.submission.findFirst({
        where: { taskId, workerId: req.user!.userId },
        select: { id: true },
      });
      if (!submission) {
        return sendError(
          res,
          'Forbidden: You are not assigned to this task. Access denied.',
          undefined,
          403
        );
      }
    }

    next();
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to verify chat access', undefined, 500);
  }
}
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendError } from '../utils/response';
import { AuthenticatedRequest } from './auth';

const prisma = new PrismaClient();

// Feature 2 — Super Admin approval gate.
//
// Any route that creates/publishes a Task Batch must run this middleware. It
// reads a FRESH approvalStatus from the database (never from stale JWT claims)
// so an admin suspension/rejection takes effect immediately.
export async function requireApprovedBusiness(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', undefined, 401);
    }

    // Super admins bypass the business approval gate.
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, approvalStatus: true, status: true },
    });

    if (!user) {
      return sendError(res, 'User not found', undefined, 404);
    }

    if (user.role !== 'BUSINESS') {
      return sendError(
        res,
        'Forbidden. Only business accounts can create task batches.',
        undefined,
        403
      );
    }

    const statusMessages: Record<string, string> = {
      PENDING: 'Your business account is pending admin approval. Your task batch could not be published.',
      REJECTED:
        'Your business account was rejected by the platform administrators. Please contact support for more information.',
      SUSPENDED:
        'Your business account has been suspended by the platform administrators. Please contact support for more information.',
    };

    if (user.approvalStatus !== 'APPROVED') {
      return sendError(
        res,
        statusMessages[user.approvalStatus] ||
          'Your business account is pending admin approval. Your task batch could not be published.',
        undefined,
        403
      );
    }

    return next();
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to verify business approval status', undefined, 500);
  }
}
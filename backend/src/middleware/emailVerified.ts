import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './auth';
import { sendError } from '../utils/response';

const prisma = new PrismaClient();

// Part B — email verification gate.
//
// Blocks money / work / interaction actions for accounts that have not
// completed email verification (emailVerified: false). It reads a FRESH
// emailVerified from the database (never from JWT claims) so a newly-verified
// account is unblocked immediately without re-issuing tokens.
export async function requireEmailVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', undefined, 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, emailVerified: true, status: true },
    });

    if (!user) {
      return sendError(res, 'User not found', undefined, 404);
    }

    if (!user.emailVerified) {
      return sendError(
        res,
        'Your email address is not verified. Please verify your email to use this feature.',
        { email: ['EMAIL_NOT_VERIFIED'] },
        403
      );
    }

    next();
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to verify email status', undefined, 500);
  }
}
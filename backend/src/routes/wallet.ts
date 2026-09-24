import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireEmailVerified } from '../middleware/emailVerified';

const router = Router();
const prisma = new PrismaClient();

// GET /api/wallet or /api/wallet/summary
// Manual-payment aggregates — TaskHub never moves money; the wallet is a ledger,
// not a balance. Values are computed live from submission payment state so they
// can never drift from the ground truth:
//   WORKER  -> totalEarned (marked paid) + pendingBalance (approved, unpaid)
//   BUSINESS-> totalSpending (marked paid) + pendingPayout (approved, unpaid)
//   ADMIN   -> all-zero operational no-op.
// Part B: access requires a verified email.
router.get(['/', '/summary'], requireAuth, requireEmailVerified, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const base = { availableBalance: 0, totalEarned: 0, totalWithdrawn: 0 };

    if (role === 'WORKER') {
      const [earnedAgg, pendingAgg] = await Promise.all([
        prisma.submission.aggregate({
          _sum: { rewardAmount: true },
          where: { workerId: req.user!.userId, paymentStatus: 'MARKED_PAID' },
        }),
        prisma.submission.aggregate({
          _sum: { rewardAmount: true },
          where: { workerId: req.user!.userId, status: 'APPROVED', paymentStatus: 'PENDING' },
        }),
      ]);
      return sendSuccess(res, 'Wallet summary fetched', {
        ...base,
        pendingBalance: pendingAgg._sum.rewardAmount || 0,
        totalEarned: earnedAgg._sum.rewardAmount || 0,
        totalSpending: 0,
        pendingPayout: 0,
      });
    }

    if (role === 'BUSINESS') {
      const [spentAgg, pendingAgg] = await Promise.all([
        prisma.submission.aggregate({
          _sum: { rewardAmount: true },
          where: { task: { businessId: req.user!.userId }, paymentStatus: 'MARKED_PAID' },
        }),
        prisma.submission.aggregate({
          _sum: { rewardAmount: true },
          where: { task: { businessId: req.user!.userId }, status: 'APPROVED', paymentStatus: 'PENDING' },
        }),
      ]);
      return sendSuccess(res, 'Wallet summary fetched', {
        ...base,
        pendingBalance: 0,
        totalEarned: 0,
        totalSpending: spentAgg._sum.rewardAmount || 0,
        pendingPayout: pendingAgg._sum.rewardAmount || 0,
      });
    }

    return sendSuccess(res, 'Wallet summary fetched', {
      ...base,
      pendingBalance: 0,
      totalSpending: 0,
      pendingPayout: 0,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch wallet summary', undefined, 500);
  }
});

// GET /api/wallet/transactions
// Part B: transaction ledger access requires a verified email.
router.get('/transactions', requireAuth, requireEmailVerified, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.userId } });
    if (!wallet) {
      return sendSuccess(res, 'Transactions fetched', []);
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'Transactions fetched', transactions);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch transactions', undefined, 500);
  }
});

export default router;

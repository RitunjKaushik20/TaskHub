import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/wallet or /api/wallet/summary
router.get(['/', '/summary'], requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: req.user!.userId,
          availableBalance: 0.0,
          pendingBalance: 0.0,
          totalEarned: 0.0,
          totalWithdrawn: 0.0,
        },
      });
    }

    return sendSuccess(res, 'Wallet summary fetched', {
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch wallet summary', undefined, 500);
  }
});

// GET /api/wallet/transactions
router.get('/transactions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

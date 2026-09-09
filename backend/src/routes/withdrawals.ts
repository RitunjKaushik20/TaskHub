import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/withdrawals
router.post('/', requireAuth, requireRoles(['WORKER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, method, accountDetails } = req.body;
    const worker = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!worker) {
      return sendError(res, 'User not found', undefined, 404);
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: worker.id } });
    if (!wallet || wallet.availableBalance < Number(amount)) {
      return sendError(res, 'Insufficient available balance for withdrawal', undefined, 400);
    }

    // Deduct available balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance - Number(amount),
        totalWithdrawn: wallet.totalWithdrawn + Number(amount),
      },
    });

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        workerId: worker.id,
        amount: Number(amount),
        method,
        accountDetails,
        status: 'PENDING',
      },
      include: {
        worker: { select: { name: true, email: true } },
      },
    });

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: Number(amount),
        status: 'PENDING',
        description: `Withdrawal request to ${method} (${accountDetails})`,
        referenceId: withdrawal.id,
      },
    });

    return sendSuccess(res, 'Withdrawal request created', {
      ...withdrawal,
      workerName: withdrawal.worker.name,
      workerEmail: withdrawal.worker.email,
    }, 201);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to request withdrawal', undefined, 500);
  }
});

// GET /api/withdrawals
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: req.user!.role === 'ADMIN' ? undefined : { workerId: req.user!.userId },
      include: {
        worker: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = withdrawals.map((w) => ({
      ...w,
      workerName: w.worker.name,
      workerEmail: w.worker.email,
    }));

    return sendSuccess(res, 'Withdrawals fetched', formatted);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch withdrawals', undefined, 500);
  }
});

export default router;

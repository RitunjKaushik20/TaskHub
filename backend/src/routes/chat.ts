import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { requireChatTaskAccess } from '../middleware/taskOwnership';
import { requireEmailVerified } from '../middleware/emailVerified';
import { getIO } from '../lib/socket';

const router = Router();
const prisma = new PrismaClient();

const sendMessageSchema = z.object({
  message: z.string().trim().max(4000, 'Message must be 4000 characters or fewer').optional(),
  fileUrl: z.string().trim().max(2000).nullable().optional(),
  fileName: z.string().trim().max(255).nullable().optional(),
});

// GET /api/chat/tasks/:taskId
// Part A (data isolation): business accounts may only read chat rooms for their
// own task batches.
router.get('/tasks/:taskId', requireAuth, requireChatTaskAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { taskId },
      orderBy: { timestamp: 'asc' },
    });

    return sendSuccess(res, 'Task chat messages fetched', messages);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch chat messages', undefined, 500);
  }
});

// POST /api/chat/tasks/:taskId
// Part A (data isolation): business accounts may only post in chat rooms for
// their own task batches. Part B: posting requires a verified email.
router.post('/tasks/:taskId', requireAuth, requireChatTaskAccess, requireEmailVerified, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      const formattedErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path.join('.');
        formattedErrors[field] = [issue.message];
      });
      return sendError(res, 'Validation failed', formattedErrors, 400);
    }
    const { message, fileUrl, fileName } = parsed.data;

    if (!message && !fileUrl) {
      return sendError(res, 'Message text or attachment is required', undefined, 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      return sendError(res, 'User not found', undefined, 404);
    }

    const chatMsg = await prisma.chatMessage.create({
      data: {
        taskId,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message: message || (fileUrl ? 'Sent an attachment' : ''),
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      },
    });

    const io = getIO();
    if (io) {
      io.to(`task:${taskId}`).emit('new-message', chatMsg);
    }

    return sendSuccess(res, 'Message sent successfully', chatMsg, 201);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to send message', undefined, 500);
  }
});

export default router;

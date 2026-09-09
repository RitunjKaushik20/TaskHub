import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getIO } from '../lib/socket';

const router = Router();
const prisma = new PrismaClient();

// GET /api/chat/tasks/:taskId
router.get('/tasks/:taskId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
router.post('/tasks/:taskId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { message, fileUrl, fileName } = req.body;

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

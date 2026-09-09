import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let io: SocketIOServer | null = null;

export const initSocketIO = (server: HttpServer, allowedOrigins: string[]): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Join task conversation room
    socket.on('join-task', (taskId: string) => {
      socket.join(`task:${taskId}`);
    });

    // Leave task conversation room
    socket.on('leave-task', (taskId: string) => {
      socket.leave(`task:${taskId}`);
    });

    // Real-time chat message sending
    socket.on('send-message', async (data: {
      taskId: string;
      senderId: string;
      senderName: string;
      senderRole: 'WORKER' | 'BUSINESS' | 'ADMIN';
      message: string;
      fileUrl?: string;
      fileName?: string;
    }) => {
      try {
        const { taskId, senderId, senderName, senderRole, message, fileUrl, fileName } = data;
        if (!taskId || (!message && !fileUrl)) return;

        const chatMsg = await prisma.chatMessage.create({
          data: {
            taskId,
            senderId,
            senderName,
            senderRole,
            message: message || (fileUrl ? 'Sent an attachment' : ''),
            fileUrl: fileUrl || null,
            fileName: fileName || null,
          },
        });

        // Broadcast to task room including sender
        io?.to(`task:${taskId}`).emit('new-message', chatMsg);
      } catch (err) {
        console.error('Socket message save error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => io;

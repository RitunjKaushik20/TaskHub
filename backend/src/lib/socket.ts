import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

const prisma = new PrismaClient();
let io: SocketIOServer | null = null;

// SECURITY: every socket connection must present a valid access token. Without
// it, anonymous clients could join task rooms and observe/interact with chat
// traffic. The token is sent as Socket.IO `auth.token` (or an Authorization
// header) by the frontend, and verified server-side with the same JWT secret
// used for the REST API.
const requireSocketAuth = (socket: Socket, next: (err?: Error) => void) => {
  const handlers = [
    typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null,
    typeof socket.handshake.query?.token === 'string' ? socket.handshake.query.token : null,
    typeof socket.handshake.headers?.authorization === 'string'
      ? socket.handshake.headers.authorization
      : null,
  ];

  let token = handlers.find((t): t is string => !!t) || null;
  if (token && token.startsWith('Bearer ')) token = token.slice(7);

  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) {
    return next(new Error('unauthorized'));
  }
  socket.data.user = payload;
  return next();
};

export const initSocketIO = (server: HttpServer, allowedOrigins: string[]): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(requireSocketAuth);

  io.on('connection', (socket) => {
    const user = socket.data.user as TokenPayload | undefined;

    // Join task conversation room. Members are checked server-side so a user can
    // only join rooms they are actually part of: the owning business, an ADMIN,
    // or a WORKER who has a submission on the task. The result is acknowledged
    // so clients (and the E2E harness) can await confirmation of membership.
    socket.on('join-task', async (taskId: unknown, ack?: (result: boolean) => void) => {
      if (typeof taskId !== 'string' || !taskId) {
        if (typeof ack === 'function') ack(false);
        return;
      }
      let allowed = false;
      try {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { businessId: true },
        });
        if (task) {
          if (user?.role === 'ADMIN') {
            allowed = true;
          } else if (user?.role === 'BUSINESS' && task.businessId === user.userId) {
            allowed = true;
          } else if (user?.role === 'WORKER') {
            const submission = await prisma.submission.findFirst({
              where: { taskId, workerId: user.userId },
              select: { id: true },
            });
            allowed = !!submission;
          }
        }
        if (allowed) await socket.join(`task:${taskId}`);
      } catch (err) {
        console.error('Socket join-task error:', err);
      }
      if (typeof ack === 'function') ack(allowed);
    });

    // Leave task conversation room
    socket.on('leave-task', (taskId: unknown) => {
      if (typeof taskId !== 'string' || !taskId) return;
      socket.leave(`task:${taskId}`);
    });

    // Chat messages are written ONLY through the REST API
    // (POST /api/chat/tasks/:taskId) which is protected by JWT auth and the
    // chat-task-access rule. A socket-level send-message handler was removed
    // because it accepted arbitrary senderId/senderName and could not be
    // safely attributed to the authenticated connection.

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => io;

// Real-time push for the SuperAdmin dashboard. Emitted whenever a live
// platform event affects a stat card: escrow funded, payout settled, or a new
// user (worker/business/admin) registered. The admin Overview subscribes and
// refetches aggregated stats instead of trusting stale client-side mocks.
export const emitDashboardUpdate = (): void => {
  if (!io) return;
  io.emit('dashboard:update');
};
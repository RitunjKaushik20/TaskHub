import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

import http from 'http';
import path from 'path';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import submissionRoutes from './routes/submissions';
import chatRoutes from './routes/chat';
import walletRoutes from './routes/wallet';
import withdrawalRoutes from './routes/withdrawals';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payments';
import uploadRoutes from './routes/uploads';
import { errorHandler } from './middleware/errorHandler';
import { initSocketIO } from './lib/socket';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];

// CORS configuration for credentials & HTTPOnly cookies
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file serving for uploads (/uploads/...)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'online',
    service: 'TaskHub REST API Backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);

import { PrismaClient } from '@prisma/client';
import { signAccessToken, signRefreshToken, setAuthCookies } from './utils/jwt';

const prisma = new PrismaClient();

import bcrypt from 'bcryptjs';

// Direct Google OAuth route matching GET /api/google/connect
app.get('/api/google/connect', async (req, res) => {
  const email = req.query.email as string;
  const name = req.query.name as string;
  const requestedRole = req.query.role as string;
  const avatar = req.query.avatarUrl as string;

  // If no email provided, redirect to frontend to open the Google Account Chooser
  if (!email || !email.includes('@')) {
    return res.redirect(`${FRONTEND_URL}/login?prompt_google=true`);
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const assignedRole = requestedRole === 'BUSINESS' ? 'BUSINESS' : 'WORKER';
      const passwordHash = await bcrypt.hash(`google_oauth_${Date.now()}`, 10);
      user = await prisma.user.create({
        data: {
          name: name?.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          passwordHash,
          role: assignedRole,
          companyName: assignedRole === 'BUSINESS' ? (name ? `${name}'s Organization` : 'Business Inc') : null,
          avatarUrl: avatar?.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          wallet: {
            create: {
              availableBalance: 0.0,
              pendingBalance: 0.0,
              totalEarned: 0.0,
              totalWithdrawn: 0.0,
            },
          },
        },
      });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);

    return res.redirect(`${FRONTEND_URL}/login?oauth=google_success&token=${accessToken}&role=${user.role}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.redirect(`${FRONTEND_URL}/login?prompt_google=true`);
  }
});

// Global Error Handler
app.use(errorHandler);

// Initialize Socket.IO
initSocketIO(server, allowedOrigins);

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 TaskHub Backend REST API & Socket.IO running on port ${PORT}`);
  console.log(`🌐 CORS allowed origin: ${FRONTEND_URL}`);
  console.log(`=================================================`);
});

export default app;
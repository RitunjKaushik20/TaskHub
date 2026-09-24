// Load environment FIRST — before any other import, so every module (jwt,
// socket, routes) reads real secrets/config instead of builtin fallbacks.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

import http from 'http';
import path from 'path';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import submissionRoutes from './routes/submissions';
import chatRoutes from './routes/chat';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/uploads';
import { errorHandler } from './middleware/errorHandler';
import { initSocketIO } from './lib/socket';
import { verifyGoogleIdToken } from './lib/googleAuth';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_URL = rawFrontendUrl.trim().replace(/\/+$/, '');
const allowedOrigins = [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];

// Basic security headers (X-Frame-Options, no-sniff, etc.). CSP is intentionally
// left unset because this is a pure JSON API; the React SPA is served separately.
app.use(helmet({ contentSecurityPolicy: false }));

// Dynamic CORS configuration allowing Vercel, localhost, and custom frontend
// domains with credentials. Origins are strictly allowlisted — any request with
// an Origin header outside the allowlist is rejected (never reflected).
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static file serving for uploads (/uploads/...)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Check (available at /api/health and /health)
const healthHandler = (req: express.Request, res: express.Response) => {
  return res.json({
    status: 'online',
    service: 'TaskHub REST API Backend',
    timestamp: new Date().toISOString(),
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// API Routes - Mounted at both /api/* and root /* for seamless compatibility
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/tasks', taskRoutes);

app.use('/api/submissions', submissionRoutes);
app.use('/submissions', submissionRoutes);

app.use('/api/chat', chatRoutes);
app.use('/chat', chatRoutes);

app.use('/api/wallet', walletRoutes);
app.use('/wallet', walletRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/uploads', uploadRoutes);

import { PrismaClient } from '@prisma/client';
import { signAccessToken, signRefreshToken, setAuthCookies } from './utils/jwt';
import { sendVerificationOtp } from './routes/auth';

const prisma = new PrismaClient();

import bcrypt from 'bcryptjs';

// Direct Google OAuth redirect handler matching both GET /api/google/connect and
// /google/connect. This is the callback target for the Google Identity Services
// "sign in with Google" redirect from a real Google OAuth authorization code.
//
// SECURITY: this handler never trusts email/email_verified query parameters
// (those are fully attacker-controllable). It only proceeds when a real Google
// ID token is present in the `credential` query param, and that token is
// verified server-side via Google's tokeninfo endpoint (signature, issuer,
// audience, expiry) before any account is looked up or created.
const googleConnectHandler = async (req: express.Request, res: express.Response) => {
  const credential = req.query.credential as string;
  const requestedRole = req.query.role as string;

  // If no credential provided, redirect to the frontend which opens the Google
  // Account Chooser (client-side GIS flow) and never issues a session.
  if (!credential || typeof credential !== 'string') {
    return res.redirect(`${FRONTEND_URL}/login?prompt_google=true`);
  }

  const identity = await verifyGoogleIdToken(credential);
  if (!identity || !identity.emailVerified) {
    return res.redirect(`${FRONTEND_URL}/login?google_error=verification`);
  }

  const cleanEmail = identity.email;
  const name = identity.name;
  const avatar = identity.picture;

  try {
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      const assignedRole = requestedRole === 'BUSINESS' ? 'BUSINESS' : 'WORKER';
      const passwordHash = await bcrypt.hash(`google_oauth_${Date.now()}`, 10);
      const displayName = name?.trim() || cleanEmail.split('@')[0];
      user = await prisma.user.create({
        data: {
          name: displayName,
          email: cleanEmail,
          passwordHash,
          role: assignedRole,
          companyName: assignedRole === 'BUSINESS' ? (name ? `${name}'s Organization` : 'Business Inc') : null,
          companyProfile:
            assignedRole === 'BUSINESS'
              ? {
                  companyName: displayName ? `${displayName}'s Organization` : 'Business Inc',
                  industryType: 'Other',
                  websiteUrl: null,
                  companySize: '1-10',
                  servicesNeeded: ['Other'],
                }
              : undefined,
          avatarUrl: avatar?.trim() || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          // Google verified the domain, but TaskHub still owns activation: the
          // user must verify this inbox with a TaskHub OTP before logging in.
          emailVerified: false,
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
      await sendVerificationOtp(res, req.ip || 'unknown', { id: user.id, email: user.email });
      return res.redirect(`${FRONTEND_URL}/verify-email?email=${encodeURIComponent(cleanEmail)}&role=${assignedRole}`);
    }

    // Existing account: full login only after TaskHub verification was completed.
    if (user.emailVerified === false) {
      await sendVerificationOtp(res, req.ip || 'unknown', { id: user.id, email: user.email });
      return res.redirect(`${FRONTEND_URL}/verify-email?email=${encodeURIComponent(cleanEmail)}&role=${user.role}`);
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
};

app.get('/api/google/connect', googleConnectHandler);
app.get('/google/connect', googleConnectHandler);

// Global Error Handler
app.use(errorHandler);

// Initialize Socket.IO
initSocketIO(server, allowedOrigins);

// Part B — housekeeping: purge abandoned, unverified placeholder accounts so
// they cannot accumulate/be reused later. Runs hourly; accounts older than 48h
// and never verified are removed along with their (empty) wallet.
const PURGE_UNVERIFIED_AFTER_MS = 48 * 60 * 60 * 1000;
const purgeStaleUnverified = async () => {
  try {
    const cutoff = new Date(Date.now() - PURGE_UNVERIFIED_AFTER_MS);
    const stale = await prisma.user.findMany({
      where: {
        emailVerified: false,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });
    if (stale.length === 0) return;
    await prisma.user.deleteMany({ where: { id: { in: stale.map((u) => u.id) } } });
    console.log(`[housekeeping] Purged ${stale.length} unverified account(s) older than 48h.`);
  } catch (err) {
    console.error('[housekeeping] Unverified-account purge failed:', err);
  }
};
setInterval(purgeStaleUnverified, 60 * 60 * 1000);
purgeStaleUnverified();

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 TaskHub Backend REST API & Socket.IO running on port ${PORT}`);
  console.log(`🌐 CORS allowed origin: ${FRONTEND_URL}`);
  console.log(`=================================================`);
});

export default app;
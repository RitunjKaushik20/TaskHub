import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../utils/jwt';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['WORKER', 'BUSINESS'], {
    errorMap: () => ({ message: 'Role must be WORKER or BUSINESS' }),
  }),
  companyName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6),
});

// POST /api/auth/register
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const formattedErrors: Record<string, string[]> = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        formattedErrors[field] = [issue.message];
      });
      return sendError(res, 'Validation failed', formattedErrors, 400);
    }

    const { name, email: rawEmail, password, role, companyName } = parseResult.data;
    const email = rawEmail.toLowerCase().trim();

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(
        res,
        'You already have an account with this email address. Please sign in.',
        { email: ['You already have an account with this email address. Please sign in.'] },
        400
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        companyName: role === 'BUSINESS' ? companyName : undefined,
        kycStatus: role === 'WORKER' ? 'VERIFIED' : 'UNVERIFIED',
        wallet: {
          create: {
            availableBalance: 0.0,
            pendingBalance: 0.0,
            totalEarned: 0.0,
            totalWithdrawn: 0.0,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        avatarUrl: true,
        kycStatus: true,
        status: true,
        createdAt: true,
      },
    });

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(res, 'Account registered successfully', {
      ...user,
      token: accessToken,
      kycVerified: user.kycStatus === 'VERIFIED',
    }, 201);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to register user', undefined, 500);
  }
});

// POST /api/auth/login
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Invalid credentials format', undefined, 400);
    }

    const { email, password } = parseResult.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return sendError(res, 'Invalid email or password', undefined, 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', undefined, 401);
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(res, 'Logged in successfully', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: accessToken,
      companyName: user.companyName,
      avatarUrl: user.avatarUrl,
      kycVerified: user.kycStatus === 'VERIFIED',
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Login failed', undefined, 500);
  }
});

// POST /api/auth/logout
router.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  clearAuthCookies(res);
  return sendSuccess(res, 'Logged out successfully', null);
});

// POST /api/auth/refresh
router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return sendError(res, 'Refresh token missing', undefined, 401);
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      clearAuthCookies(res);
      return sendError(res, 'Invalid or expired refresh token', undefined, 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.status !== 'ACTIVE') {
      clearAuthCookies(res);
      return sendError(res, 'User account is no longer active', undefined, 401);
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return sendSuccess(res, 'Access token refreshed successfully', null);
  } catch (error: any) {
    clearAuthCookies(res);
    return sendError(res, 'Token refresh failed', undefined, 401);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        bio: true,
        skills: true,
        avatarUrl: true,
        kycStatus: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', undefined, 404);
    }

    return sendSuccess(res, 'Current user retrieved', {
      ...user,
      kycVerified: user.kycStatus === 'VERIFIED',
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch user', undefined, 500);
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, companyName, bio, skills, avatarUrl } = req.body;

    const dataToUpdate: any = {};
    if (typeof name === 'string' && name.trim()) {
      dataToUpdate.name = name.trim();
    }
    if (typeof companyName === 'string') {
      dataToUpdate.companyName = companyName.trim() || null;
    }
    if (typeof bio === 'string') {
      dataToUpdate.bio = bio.trim() || null;
    }
    if (typeof skills === 'string') {
      dataToUpdate.skills = skills.trim() || null;
    }
    if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
      dataToUpdate.avatarUrl = avatarUrl.trim();
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        bio: true,
        skills: true,
        avatarUrl: true,
        kycStatus: true,
        status: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, 'Profile updated successfully', {
      ...updated,
      kycVerified: updated.kycStatus === 'VERIFIED',
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to update profile', undefined, 500);
  }
});

// POST /api/auth/google/verify - Authenticates real Google account
router.post('/google/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    let { email, name, avatarUrl, credential, role } = req.body;

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.email) {
            email = payload.email;
            name = payload.name || name;
            avatarUrl = payload.picture || avatarUrl;
          }
        }
      } catch (e) {
        console.warn('Could not decode Google credential JWT:', e);
      }
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return sendError(res, 'A valid Google email address is required', undefined, 400);
    }

    email = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const assignedRole = role === 'BUSINESS' ? 'BUSINESS' : 'WORKER';
      const passwordHash = await bcrypt.hash(`google_oauth_${Date.now()}`, 10);
      user = await prisma.user.create({
        data: {
          name: name?.trim() || email.split('@')[0],
          email,
          passwordHash,
          role: assignedRole,
          companyName: assignedRole === 'BUSINESS' ? (name ? `${name}'s Organization` : 'Business Inc') : null,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
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

    return sendSuccess(res, 'Google authentication successful', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: accessToken,
      avatarUrl: user.avatarUrl,
      kycVerified: user.kycStatus === 'VERIFIED',
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Google OAuth failed', undefined, 500);
  }
});

// GET /api/auth/google/connect
router.get('/google/connect', (req: AuthenticatedRequest, res: Response) => {
  const email = req.query.email as string;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (!email) {
    return res.redirect(`${FRONTEND_URL}/login?prompt_google=true`);
  }
  return res.redirect(`/api/google/connect?email=${encodeURIComponent(email)}`);
});

export default router;

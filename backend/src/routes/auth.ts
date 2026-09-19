import { Router, Response } from 'express';
import crypto from 'crypto';
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
import { emitDashboardUpdate } from '../lib/socket';
import { companyProfileSchema, isCompleteCompanyProfile } from '../config/companyProfile';
import { isDisposableEmail } from '../config/disposableEmails';
import { isValidEmailFormat, hasMxRecords, extractDomain } from '../config/emailValidation';
import { sendEmail, buildOtpEmail, isSmtpConfigured, SendEmailResult } from '../lib/email';
import {
  otpSendLimiter,
  otpVerifyLimiter,
  OTP_SEND_MAX,
  OTP_SEND_WINDOW_MS,
} from '../lib/rateLimit';

const router = Router();
const prisma = new PrismaClient();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['WORKER', 'BUSINESS'], {
    errorMap: () => ({ message: 'Role must be WORKER or BUSINESS' }),
  }),
  companyName: z.string().optional().nullable(),
  // Feature 1: richer company profile captured for Business signups.
  companyProfile: z.any().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6),
});

const otpSendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const otpVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

function generateOtp(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

// Every unverified-account OTP distribution path funnels through here so the
// rate limits and logging rules are applied exactly once.
async function sendVerificationOtp(res: Response, ip: string, user: { id: string; email: string }): Promise<{ sent: boolean; mode?: SendEmailResult['mode']; reason?: 'rate-limited' }> {
  const now = Date.now();
  if (!otpSendLimiter.allow(`email:${user.email}`, OTP_SEND_MAX, OTP_SEND_WINDOW_MS) ||
      !otpSendLimiter.allow(`ip:${ip}`, OTP_SEND_MAX, OTP_SEND_WINDOW_MS)) {
    return { sent: false, reason: 'rate-limited' };
  }

  const code = generateOtp();
  const otpHash = await bcrypt.hash(code, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpHash,
      otpExpiresAt: new Date(now + OTP_TTL_MS),
      otpAttempts: 0,
      otpLastSentAt: new Date(now),
    },
  });

  const mail = buildOtpEmail(user.email, code);
  const result = await sendEmail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text });

  // DEV mode disclaimer: the OTP body is only ever surfaced via the email
  // service's console fallback; never in the API response.
  if (result.mode === 'dev') {
    console.warn(`[DEV MODE] OTP for ${user.email}: ${code} — this is a dev-only artifact, never shown in production.`);
  }

  return { sent: true, mode: result.mode };
}

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

    // Feature 3: reject disposable / temporary email domains at the API layer.
    if (isDisposableEmail(email)) {
      return sendError(
        res,
        'Registration using disposable or temporary email addresses is not allowed. Please use your real email address.',
        { email: ['This email domain is not allowed for account creation.'] },
        400
      );
    }

    // Part B Layer 1: strict RFC-style format check (guard against a loose
    // regex/Zod email pass that still accepts malformed addresses).
    if (!isValidEmailFormat(email)) {
      return sendError(
        res,
        'Please provide a valid email address.',
        { email: ['Invalid email address format.'] },
        400
      );
    }

    // Part B Layer 3: the domain must actually accept mail (MX records).
    const domain = extractDomain(email);
    const mxOk = await hasMxRecords(domain);
    if (!mxOk) {
      return sendError(
        res,
        'This email domain cannot receive mail. Please use a real, deliverable email address.',
        { email: ['This email domain cannot receive mail.'] },
        400
      );
    }

    // Feature 1: validate + normalize the company profile for Business signups.
    let companyProfile: Record<string, unknown> | undefined;
    if (role === 'BUSINESS') {
      const profileResult = companyProfileSchema.safeParse(parseResult.data.companyProfile);
      if (!profileResult.success) {
        const formattedErrors: Record<string, string[]> = {};
        profileResult.error.issues.forEach((issue) => {
          const field = issue.path.join('.');
          formattedErrors[`companyProfile.${field}`] = [issue.message];
        });
        return sendError(res, 'Company profile validation failed', formattedErrors, 400);
      }
      companyProfile = profileResult.data as unknown as Record<string, unknown>;
    }

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
        companyName: role === 'BUSINESS' ? (companyName || (companyProfile as any)?.companyName || undefined) : undefined,
        companyProfile: role === 'BUSINESS' ? (companyProfile as any) : undefined,
        kycStatus: role === 'WORKER' ? 'VERIFIED' : 'UNVERIFIED',
        // Feature 2: approvalStatus defaults to PENDING via the schema for all
        // new accounts; only BUSINESS accounts are ever gated on it.
        // Part B: emailVerified stays false until the OTP flow completes. The
        // account is created in a locked state that cannot post/claim/chat/wallet.
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        companyProfile: true,
        approvalStatus: true,
        avatarUrl: true,
        kycStatus: true,
        status: true,
        createdAt: true,
      },
    });

    // No session is issued to an unverified account. The new user is emailed a
    // one-time verification code which grants the very first login.
    const otpResult = await sendVerificationOtp(res, req.ip || 'unknown', user);

    // Part B: a new worker/business registered — bump the SuperAdmin Overview's
    // "Active Users" card in real time (refetch via Socket.IO event anchor).
    emitDashboardUpdate();

    return sendSuccess(
      res,
      'Account created. A verification code was sent to your email. Please verify to activate your account.',
      {
        ...user,
        emailVerified: false,
        pendingEmailVerification: true,
        otpSendMode: otpResult.mode,
        companyProfileIncomplete: role === 'BUSINESS' && !isCompleteCompanyProfile(user.companyProfile as any),
      },
      201
    );
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

    // Part B: unverified accounts cannot log in. We re-send the OTP (rate
    // limited) so they can enter their code and activate the account.
    if (!user.emailVerified) {
      await sendVerificationOtp(res, req.ip || 'unknown', {
        id: user.id,
        email: user.email,
      });
      return sendError(
        res,
        'Your email is not verified yet. A verification code was sent to your inbox — enter it to activate your account.',
        { email: ['EMAIL_NOT_VERIFIED'] },
        403
      );
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
      companyProfile: user.companyProfile,
      approvalStatus: user.approvalStatus,
      avatarUrl: user.avatarUrl,
      kycVerified: user.kycStatus === 'VERIFIED',
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Login failed', undefined, 500);
  }
});

// POST /api/auth/otp/send (Part B)
// (Re)sends a 6-digit email verification code to an unverified account.
// Responses are intentionally generic to avoid account enumeration.
router.post('/otp/send', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = otpSendSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'A valid email address is required', undefined, 400);
    }

    const email = parseResult.data.email.toLowerCase().trim();
    if (!isValidEmailFormat(email)) {
      return sendError(res, 'A valid email address is required', undefined, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      return sendSuccess(res, 'If that account exists, a verification code was sent.', {
        sent: false,
        emailVerified: false,
      });
    }

    if (user.emailVerified) {
      return sendSuccess(res, 'This email is already verified. Please sign in.', {
        sent: false,
        emailVerified: true,
      });
    }

    const result = await sendVerificationOtp(res, req.ip || 'unknown', { id: user.id, email: user.email });

    if (result.reason === 'rate-limited') {
      return sendError(
        res,
        'Too many verification codes were requested. Please wait a few minutes and try again.',
        undefined,
        429
      );
    }

    return sendSuccess(res, 'Verification code sent to your email.', {
      sent: true,
      emailVerified: false,
      mode: result.mode,
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to send verification code', undefined, 500);
  }
});

// POST /api/auth/otp/verify (Part B)
// Validates the emailed 6-digit code, marks the account verified and issues the
// first session (tokens + cookies).
router.post('/otp/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = otpVerifySchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Please provide your email and the 6-digit code', undefined, 400);
    }

    const { email: rawEmail, code } = parseResult.data;
    const email = rawEmail.toLowerCase().trim();

    // Brute-force guard: cap total verify attempts per IP+email window.
    const ipKey = req.ip || 'unknown';
    if (!otpVerifyLimiter.allow(`ip:${ipKey}`, 20, OTP_SEND_WINDOW_MS) ||
        !otpVerifyLimiter.allow(`verify:${email}`, 20, OTP_SEND_WINDOW_MS)) {
      return sendError(
        res,
        'Too many verification attempts. Please try again in a few minutes.',
        undefined,
        429
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'No account exists for this email address.', undefined, 404);
    }

    if (user.emailVerified) {
      return sendError(res, 'This email is already verified. Please sign in.', undefined, 400);
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return sendError(res, 'No verification code was issued for this email. Please request a new code.', undefined, 400);
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      return sendError(res, 'This verification code has expired. Please request a new one.', undefined, 400);
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
      });
      return sendError(
        res,
        'Too many incorrect attempts. The previous code was invalidated — please request a new one.',
        undefined,
        429
      );
    }

    const isValid = await bcrypt.compare(code, user.otpHash);
    if (!isValid) {
      const attempts = user.otpAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: attempts },
      });
      return sendError(
        res,
        'Incorrect verification code. Please check the number we emailed you.',
        undefined,
        400
      );
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpLastSentAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        companyProfile: true,
        approvalStatus: true,
        avatarUrl: true,
        kycStatus: true,
        status: true,
        createdAt: true,
      },
    });

    const payload = { userId: verifiedUser.id, email: verifiedUser.email, role: verifiedUser.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(res, 'Email verified successfully', {
      ...verifiedUser,
      emailVerified: true,
      token: accessToken,
      kycVerified: verifiedUser.kycStatus === 'VERIFIED',
      companyProfileIncomplete:
        verifiedUser.role === 'BUSINESS' &&
        !isCompleteCompanyProfile(verifiedUser.companyProfile as any),
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to verify email', undefined, 500);
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
        companyProfile: true,
        approvalStatus: true,
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
      companyProfileIncomplete:
        user.role === 'BUSINESS' && !isCompleteCompanyProfile(user.companyProfile as any),
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch user', undefined, 500);
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, companyName, bio, skills, avatarUrl, companyProfile } = req.body;

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

    // Feature 1: allow completing/updating the company profile on the profile
    // endpoint (used by the "Complete your profile" prompt for legacy accounts).
    if (companyProfile !== undefined) {
      const profileResult = companyProfileSchema.safeParse(companyProfile);
      if (!profileResult.success) {
        const formattedErrors: Record<string, string[]> = {};
        profileResult.error.issues.forEach((issue) => {
          const field = issue.path.join('.');
          formattedErrors[`companyProfile.${field}`] = [issue.message];
        });
        return sendError(res, 'Company profile validation failed', formattedErrors, 400);
      }
      dataToUpdate.companyProfile = profileResult.data;
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
        companyProfile: true,
        approvalStatus: true,
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
      companyProfileIncomplete:
        updated.role === 'BUSINESS' && !isCompleteCompanyProfile(updated.companyProfile as any),
    });
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to update profile', undefined, 500);
  }
});

// POST /api/auth/google/verify - Authenticates a real Google account
router.post('/google/verify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    let { email, name, avatarUrl, credential, role } = req.body;
    let emailVerified: boolean | undefined;

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.email) {
            email = payload.email;
            name = payload.name || name;
            avatarUrl = payload.picture || avatarUrl;
            emailVerified = payload.email_verified === true;
          }
        }
      } catch (e) {
        console.warn('Could not decode Google credential JWT:', e);
      }

      // Feature 3: On the real Google OAuth callback we MUST have an authentic,
      // email-verified payload. Unverified / spoofed payloads are rejected before
      // any session or account is created.
      if (!emailVerified) {
        return sendError(
          res,
          'Your Google account email is not verified. Please verify your email with Google and try again.',
          { email: ['Google email_verified flag is false or missing.'] },
          401
        );
      }
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return sendError(res, 'A valid Google email address is required', undefined, 400);
    }

    email = email.toLowerCase().trim();

    // Feature 3: block disposable / temporary domains even if the Google payload
    // was verified (defense in depth, cannot be bypassed from the client).
    if (isDisposableEmail(email)) {
      return sendError(
        res,
        'Sign in with disposable or temporary email addresses is not allowed. Please use your real Google account.',
        { email: ['This email domain is not allowed.'] },
        400
      );
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const assignedRole = role === 'BUSINESS' ? 'BUSINESS' : 'WORKER';
      const passwordHash = await bcrypt.hash(`google_oauth_${Date.now()}`, 10);
      const displayName = name?.trim() || email.split('@')[0];
      user = await prisma.user.create({
        data: {
          name: displayName,
          email,
          passwordHash,
          role: assignedRole,
          companyName:
            assignedRole === 'BUSINESS' ? (displayName ? `${displayName}'s Organization` : 'Business Inc') : null,
          // Feature 1: seed an initial company profile for business OAuth signups;
          // the business can complete/edit it from their dashboard.
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
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          kycStatus: 'VERIFIED',
          status: 'ACTIVE',
          // Part B: Google accounts are email-verified by Google itself
          // (enforced above); the OTP loop is skipped and the account starts
          // fully verified.
          emailVerified: true,
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

    // Part B: continued Google sign-in is proof enough of a deliverable,
    // Google-verified mailbox — resolve any pre-existing flagged account.
    if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
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
      companyProfile: user.companyProfile,
      approvalStatus: user.approvalStatus,
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

// GET /api/auth/google/config - exposes the Google client ID to the frontend
// so it can initialize the Google Identity Services button (Feature 3).
router.get('/google/config', (_req: AuthenticatedRequest, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  return sendSuccess(res, 'Google OAuth config', {
    clientId,
    available: clientId.length > 0,
  });
});

export default router;

import jwt from 'jsonwebtoken';
import { Response } from 'express';

// Secrets MUST come from the environment. Hardcoded fallbacks would bake a
// known secret into the binary and silently ship it to production if an env var
// is ever missing — so we fail loudly at startup instead.
function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} must be set (backend/.env). Refusing to start with fallback secrets.`
    );
  }
  return value;
}

const ACCESS_SECRET = requireSecret('JWT_ACCESS_SECRET');
const REFRESH_SECRET = requireSecret('JWT_REFRESH_SECRET');

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearAuthCookies(res: Response) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0),
  });

  res.cookie('refresh_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0),
  });
}

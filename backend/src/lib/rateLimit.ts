// In-memory sliding-window rate limiter for OTP sends / verifications.
// Sufficient for a single-instance deploy; swap for Redis if scaled horizontally.

type Counter = { count: number; resetAt: number };

class SlidingWindowLimiter {
  private buckets = new Map<string, Counter>();

  // Returns true if the key is under the limit, false if over.
  allow(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (existing.count >= max) {
      return false;
    }
    existing.count += 1;
    return true;
  }

  reset(key: string) {
    this.buckets.delete(key);
  }
}

export const otpSendLimiter = new SlidingWindowLimiter();
export const otpVerifyLimiter = new SlidingWindowLimiter();

// Brute-force guard on password login (per email AND per IP).
export const loginLimiter = new SlidingWindowLimiter();
// Registration spam guard (per IP + per email).
export const registerLimiter = new SlidingWindowLimiter();

export const OTP_SEND_MAX = 3; // per email & per IP
export const OTP_SEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const OTP_VERIFY_MAX = 10; // per IP / email guard against brute force
export const OTP_VERIFY_WINDOW_MS = 15 * 60 * 1000;

export const LOGIN_MAX = 10; // failed login attempts per IP & per email
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const REGISTER_MAX = 10; // signups per IP
export const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour
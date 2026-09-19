import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Layer 1 — syntactic validation. Keep the local part sane and length-bounded
// (RFC 5321 max 64 for local part, 254 for the full address).
export function isValidEmailFormat(email: string): boolean {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return false;
  if (!EMAIL_FORMAT_RE.test(trimmed)) return false;
  const [local] = trimmed.split('@');
  return !!local && local.length <= 64;
}

// Layer 3 — domain deliverability check. The domain must publish MX records so
// the mailbox can actually receive the OTP email.
//
// Fail-open on DNS errors/timeouts (network hiccups must not block signups),
// but a definitive "no MX records" result is rejected.
export async function hasMxRecords(domain: string): Promise<boolean> {
  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch (err: any) {
    // ENOTFOUND / NODATA → the domain does not exist or has no MX records.
    if (err?.code === 'ENOTFOUND' || err?.code === 'ENODATA' || err?.code === 'AXFR') {
      return false;
    }
    // Timeouts / transient resolver failures → fail open.
    return true;
  }
}

export function extractDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] || '';
}
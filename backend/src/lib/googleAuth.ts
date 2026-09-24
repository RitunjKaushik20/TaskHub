import { isDisposableEmail } from '../config/disposableEmails';

// Server-side verification of Google OIDC ID tokens.
//
// The credential is validated through Google's official tokeninfo endpoint,
// which checks the RS256 signature, issuer, audience and expiry server-side.
// The returned claims — never client-supplied email/name/role fields — are the
// sole source of truth for the Google identity. A forged/unsigned token (e.g.
// an alg=none JWT with a spoofed email) fails signature validation and is
// rejected before any account lookup or session is issued.

export interface VerifiedGoogleIdentity {
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
  sub?: string;
}

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const ALLOWED_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

export async function verifyGoogleIdToken(credential: unknown): Promise<VerifiedGoogleIdentity | null> {
  if (typeof credential !== 'string') return null;
  const token = credential.trim();
  if (!token || token.split('.').length !== 3) return null;

  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) return null;

  try {
    const res = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;

    const claims: Record<string, unknown> = await res.json();
    if (claims.aud !== clientId) return null;
    if (typeof claims.iss !== 'string' || !ALLOWED_ISSUERS.has(claims.iss)) return null;
    if (typeof claims.email !== 'string') return null;

    const email = claims.email.toLowerCase().trim();
    if (!email || !email.includes('@')) return null;
    if (isDisposableEmail(email)) return null;

    return {
      email,
      name: typeof claims.name === 'string' ? claims.name : undefined,
      picture: typeof claims.picture === 'string' ? claims.picture : undefined,
      emailVerified: claims.email_verified === true || claims.email_verified === 'true',
      sub: typeof claims.sub === 'string' ? claims.sub : undefined,
    };
  } catch {
    return null;
  }
}

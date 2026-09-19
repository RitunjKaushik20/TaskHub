import disposableDomains from 'disposable-email-domains';

// Feature 3 — Disposable / temporary-email blocking.
//
// The blocklist is NOT hardcoded inline. It ships in three additive layers so
// it stays easy to update in production without code changes:
//   1. `disposable-email-domains` npm package (curated, updated upstream).
//   2. ALWAYS_BLOCKED_EXTRA  — extra domains hard-blocked on top of the package.
//   3. Optional file blocklist — a plain-text file (one domain per line) at the
//      path in DISPOSABLE_EMAIL_BLOCKLIST_FILE (an absolute path). If present,
//      every line is merged into the active blocklist. This lets an operator
//      add a domain without a redeploy. Missing/invalid file is tolerated.
//
// The exported list is built lazily once per process and reused.

import fs from 'fs';

const isDisposable = disposableDomains as string[];

function loadExtraFile(): string[] {
  const filePath = process.env.DISPOSABLE_EMAIL_BLOCKLIST_FILE;
  if (!filePath) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line && !line.startsWith('#'));
  } catch (err) {
    console.warn('[disposableEmails] Could not read optional blocklist file:', filePath, err);
    return [];
  }
}

// Small curated list for domains that occasionally drift out of the npm package
// but are commonly used to create throwaway TaskHub accounts.
const ALWAYS_BLOCKED_EXTRA = ['mailinator.com', '10minutemail.com', 'guerrillamail.com'];

let activeBlocklist: Set<string> | null = null;

function getBlocklist(): Set<string> {
  if (activeBlocklist) return activeBlocklist;
  const combined = new Set<string>(isDisposable.map((d) => d.toLowerCase().trim()));
  for (const domain of ALWAYS_BLOCKED_EXTRA) combined.add(domain.toLowerCase().trim());
  for (const domain of loadExtraFile()) combined.add(domain);
  activeBlocklist = combined;
  console.info(
    `[disposableEmails] Active email blocklist initialized with ${combined.size} domains.`
  );
  return combined;
}

/**
 * Returns true when the given email's domain is on the disposable-email blocklist.
 * Accepts a full email address OR a bare domain (e.g. "mailinator.com").
 */
export function isDisposableEmail(email: string): boolean {
  const cleaned = (email || '').toLowerCase().trim();
  if (!cleaned) return false;

  const domain = cleaned.includes('@') ? cleaned.split('@').pop()!.trim() : cleaned;
  if (!domain) return false;

  const blocklist = getBlocklist();
  if (blocklist.has(domain)) return true;

  // Sub-domain guard: aaa.10minutemail.com should also be caught when the root
  // label is blocked.
  const labels = domain.split('.').length;
  const lastTwo = labels >= 2 ? domain.split('.').slice(-2).join('.') : domain;
  return blocklist.has(lastTwo);
}
# Part B — Email Verification & Anti-Fake-Account System (OTP)

## What changed

### Backend — `backend/`
- **`prisma/schema.prisma`** — added unverified-account + OTP columns to `User`:
  `emailVerified Boolean @default(false)`, `otpHash String?`, `otpExpiresAt
  DateTime?`, `otpAttempts Int @default(0)`, `otpLastSentAt DateTime?`. Safe
  defaults (nullable / `false`) so existing rows need no destructive migration.
- **`src/middleware/emailVerified.ts`** — `requireEmailVerified` (for WORKER
  accounts, must also pass approval gate, etc. — see Part A) blocks account
  creation of ticket-worthy actions until `emailVerified === true`. Fresh read
  of the user table (never trusts stale JWT claims).
- **`src/routes/auth.ts`**:
  - REGISTER now **starts accounts with `emailVerified: false`** and does NOT
    issue JWT tokens. Returns 201 with `pendingEmailVerification: true` instead.
  - LOGIN gates unverified accounts with `EMAIL_NOT_VERIFIED` (403) and the
    route issues no tokens until OTP is verified.
  - Google OAuth connect/verify: verified Google emails are auto-trusted
    (`emailVerified = true`) since Google already enforced verification.
  - New endpoints:
    - `POST /api/auth/otp/send` — creates a 6-digit OTP, **stores only its
      bcrypt hash**, 10-minute TTL, rate-limited (3/email per 15 min + per-IP),
      emails it via SMTP.
    - `POST /api/auth/otp/verify` — validates the code against the stored hash,
      marks `emailVerified = true`, issues the JWT tokens on success.
  - Login for unverified accounts triggers a fresh OTP send (rate-limited).
  - Disposable-domain block + MX/format checks moved ahead of account creation.
- **`src/lib/email.ts`** — new nodemailer-based SMTP transport. When SMTP is
  not configured it falls back to DEV mode: the OTP is printed to the server
  console (clearly labelled "DEV MODE OTP") so the flow remains testable and
  never crashes without credentials.
- **`src/middleware/emailVerified.ts`** added to routes: task **creation**
  (POST /tasks), task **seat claim/accept**, submission **proof submission** &
  **review**, chat message post, wallet **summary/transactions**, withdrawals,
  and Razorpay escrow order/verify — unverified accounts are blocked from all
  money/work/isolation-sensitive operations.
- **`scripts/backfill-email-verified.ts`** — one-off backfill marking all
  pre-existing (legacy) accounts `emailVerified = true`.
- **seed** — seeded demo accounts are `emailVerified: true`.
- `tsc` clean, `npm run build` clean, live E2E re-verified (7/7).

### Frontend — `frontend/`
- Registration now returns `pendingEmailVerification: true` → routes to the OTP
  page; no token is stored until the code is verified.
- Added **`VerifyEmail` page** (`/verify-email`) with OTP input, resend, and
  dev-mode banner. Login redirects unverified users here.
- Login/register flows surface `EMAIL_NOT_VERIFIED`/pending-OTP to the user.
- `tsc` + `vite build` clean.

## Manual test cases

1. **New account is created unverified**
   1. Go to `/register`, sign up a new WORKER with a real, non-disposable email.
   2. Confirm you land on `/verify-email` and see "code sent to your email".
   3. Check the backend console for the "DEV MODE OTP" line (dev SMTP off) and
      copy the 6-digit code.
   4. Before verifying, try to log in → expect **"EMAIL_NOT_VERIFIED / verify
      first"** (403) and that login is blocked.
2. **OTP verify unlocks the account**
   1. Enter the code from step 1.3 in the VerifyEmail page.
   2. Expect success, account becomes verified, and you are logged in as that
      role.
   3. Reload the app — session persists (hydrated from DB).
3. **Wrong code is rejected & attempts throttled**
   1. On a fresh unverified account, enter 4 wrong codes → each returns an
      error, no token issued.
   2. Enter a correct code on the 5th attempt → rejected (attempt cap) and a
      new code must be requested.
4. **OTP send is rate-limited**
   1. From the VerifyEmail page hit "Resend" repeatedly.
   2. After the 3rd send within 15 minutes, expect a 429 and the resend capped.
5. **Unverified account cannot perform isolated/paid actions**
   1. Register a second business (unverified) and try posting a task, depositing
      escrow via Razorpay, creating a wallet charge, or posting a chat message →
      expect 403 EMAIL_NOT_VERIFIED before any action.
6. **Verified legacy accounts still work (regression)**
   1. Log in with a pre-existing seeded account (e.g. Elena/worker) → works
      because backfill set `emailVerified = true`. Verify task posting, escrow,
      seat lock, proof, chat, wallet payout, and Google OAuth all still pass
      (E2E suite re-ran green).
7. **Disposable / MX validation still enforced at the API, not just the UI**
   1. Attempt registration with a `mailinator.com`-style address → rejected.
   2. Attempt registration with a `nonexistent-domain-xyz.io` address → rejected
      (no MX).

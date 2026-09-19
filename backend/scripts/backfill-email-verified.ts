import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Part B — legacy migration: every account created before email verification
// existed is treated as trusted (they were created via the old signup flow that
// proof-checked against the real identity through delivery). Google-OAuth users
// are already trusted. New signups from now on land in the unverified state.
async function main() {
  const result = await prisma.user.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true },
  });
  console.log(`Backfilled ${result.count} legacy account(s) -> emailVerified = true`);

  // Also clear any stray OTP debris left on legacy accounts.
  const cleared = await prisma.user.updateMany({
    where: { emailVerified: true, otpHash: { not: null } },
    data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0, otpLastSentAt: null },
  });
  if (cleared.count > 0) {
    console.log(`Cleared leftover OTP state on ${cleared.count} account(s)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
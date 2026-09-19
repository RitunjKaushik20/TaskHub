import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

// Feature 2 — Safe migration path.
//
// New business signups start with approvalStatus = PENDING. Business accounts
// that already existed BEFORE this feature must be auto-approval'd so current
// users are not locked out of task posting. Idempotent: safely rerunnable.
//
// Run: npx ts-node scripts/backfill-business-approval.ts
const prisma = new PrismaClient();

async function main() {
  console.log('=== Backfilling existing business accounts to APPROVED ===');

  const result = await prisma.user.updateMany({
    where: {
      role: 'BUSINESS',
      approvalStatus: { in: ['PENDING'] },
    },
    data: {
      approvalStatus: 'APPROVED',
    },
  });

  console.log(`✔ Updated ${result.count} business account(s) to approvalStatus = APPROVED.`);
  console.log('Existing businesses can continue posting tasks. New signups remain PENDING.');

  const totals = {
    businesses: await prisma.user.count({ where: { role: 'BUSINESS' } }),
    byStatus: await prisma.user.groupBy({
      by: ['approvalStatus'],
      where: { role: 'BUSINESS' },
      _count: { _all: true },
    }),
  };
  console.log('Business approval summary:', JSON.stringify(totals, null, 2));
}

main()
  .catch((e) => {
    console.error('Failed to backfill business approval status:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
/**
 * Part C — seed the single platform super admin (idempotent, env-driven).
 *
 * Guarantees (verified by scripts/verify-seed.ts afterwards):
 *   1. Exactly ONE user exists in the whole DB.
 *   2. It is role=ADMIN, status=ACTIVE, emailVerified=true.
 *   3. Its password is bcrypt-hashed (never plaintext), taken from env.
 *
 * Credentials come ONLY from environment variables (never hardcoded):
 *   SUPER_ADMIN_EMAIL
 *   SUPER_ADMIN_PASSWORD
 *   SUPER_ADMIN_NAME   (optional, defaults "Super Admin")
 *
 * Any pre-existing users (leftover test accounts, dev seeds) are removed so the
 * platform starts green: a real admin, real data pipeline, zero fabricated rows.
 */
import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD || '';
const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  if (!email) fail('SUPER_ADMIN_EMAIL is not set (backend/.env).');
  if (!password || password.length < 8)
    fail('SUPER_ADMIN_PASSWORD must be at least 8 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail(`Invalid email: ${email}`);

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    // 1. Remove every user that is NOT the super admin (leftover seeds/test data).
    await tx.user.deleteMany({ where: { email: { not: email } } });

    // 2. Upsert the super admin itself (idempotent across re-runs).
    await tx.user.upsert({
      where: { email },
      update: { role: 'ADMIN', status: UserStatus.ACTIVE, emailVerified: true, passwordHash },
      create: {
        email,
        name,
        role: 'ADMIN',
        status: UserStatus.ACTIVE,
        emailVerified: true,
        passwordHash,
        wallet: { create: { availableBalance: 0, pendingBalance: 0, totalEarned: 0, totalWithdrawn: 0 } },
      },
    });
  });

  const count = await prisma.user.count();
  const self = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { email: true, role: true, status: true, emailVerified: true },
  });
  if (count !== 1 || self.role !== 'ADMIN' || !self.emailVerified || self.email !== email)
    fail('Invariant violated — DB is not exactly ONE verified ADMIN.');

  console.log('✅ Super admin seeded (exactly one user in DB).');
  console.log(`  Email       : ${self.email}`);
  console.log(`  Role        : ${self.role} (super admin)`);
  console.log(`  Status      : ${self.status}`);
  console.log(`  Verified    : ${self.emailVerified}`);
  console.log(`  Total users : ${count}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => prisma.$disconnect());

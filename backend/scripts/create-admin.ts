import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  // Interactive credentials (via env vars as fallback so it can run non-interactively too).
  const name =
    process.env.ADMIN_NAME || (await prompt('Admin display name: '));
  const email =
    process.env.ADMIN_EMAIL || (await prompt('Admin email: '));
  const password =
    process.env.ADMIN_PASSWORD || (await prompt('Admin password (min 8 chars): '));

  if (!name || !email || !password) {
    console.error('❌ name, email and password are all required.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`❌ A user with email ${email} already exists (id: ${existing.id}).`);
    console.error('   If this is the account you want to promote to ADMIN, use scripts/promote-to-admin.ts instead.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      // Part B: an admin MUST be emailVerified, otherwise the login gate
      // (EMAIL_NOT_VERIFIED) blocks sign-in. Admin accounts are provisioned
      // by a trusted operator, so they are trusted by construction.
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

  console.log('\n✅ ADMIN ACCOUNT CREATED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Name  : ${admin.name}`);
  console.log(`  Email : ${admin.email}`);
  console.log(`  Role  : ${admin.role}`);
  console.log(`  emailVerified: true (login allowed)`);
  console.log(`  ID    : ${admin.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Login at POST /api/auth/login with the email/password above.');
  console.log('Admin API base: /api/admin/* (requires role ADMIN).');
}

main()
  .catch(async (e) => {
    console.error('Error creating admin account:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });

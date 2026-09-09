import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Wiping all data from database for fresh clean state...');

  // Delete child records first to respect FK constraints
  const auditLogs = await prisma.auditLog.deleteMany({});
  console.log(`Deleted ${auditLogs.count} audit logs.`);

  const chatMessages = await prisma.chatMessage.deleteMany({});
  console.log(`Deleted ${chatMessages.count} chat messages.`);

  const submissions = await prisma.submission.deleteMany({});
  console.log(`Deleted ${submissions.count} submissions.`);

  const tasks = await prisma.task.deleteMany({});
  console.log(`Deleted ${tasks.count} tasks.`);

  const transactions = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${transactions.count} transactions.`);

  const withdrawals = await prisma.withdrawalRequest.deleteMany({});
  console.log(`Deleted ${withdrawals.count} withdrawal requests.`);

  const wallets = await prisma.wallet.deleteMany({});
  console.log(`Deleted ${wallets.count} wallets.`);

  const refreshTokens = await prisma.refreshToken.deleteMany({});
  console.log(`Deleted ${refreshTokens.count} refresh tokens.`);

  const users = await prisma.user.deleteMany({});
  console.log(`Deleted ${users.count} users.`);

  // Verify counts
  const counts = {
    users: await prisma.user.count(),
    tasks: await prisma.task.count(),
    submissions: await prisma.submission.count(),
    chatMessages: await prisma.chatMessage.count(),
    wallets: await prisma.wallet.count(),
    transactions: await prisma.transaction.count(),
    withdrawals: await prisma.withdrawalRequest.count(),
    refreshTokens: await prisma.refreshToken.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log('✅ Final Database Counts:', counts);
  const totalRemaining = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalRemaining === 0) {
    console.log('🎉 Database is completely clean and zeroed out!');
  } else {
    console.error('⚠️ Warning: Some records still remain:', counts);
  }
}

main()
  .catch((e) => {
    console.error('Error wiping database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

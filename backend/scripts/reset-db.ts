import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('--- Starting Complete Database Wipe ---');
  try {
    const deletedMessages = await prisma.chatMessage.deleteMany({});
    console.log(`Deleted ${deletedMessages.count} chat messages.`);

    const deletedSubmissions = await prisma.submission.deleteMany({});
    console.log(`Deleted ${deletedSubmissions.count} submissions.`);

    const deletedTasks = await prisma.task.deleteMany({});
    console.log(`Deleted ${deletedTasks.count} tasks.`);

    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`Deleted ${deletedTransactions.count} transactions.`);

    const deletedWithdrawals = await prisma.withdrawalRequest.deleteMany({});
    console.log(`Deleted ${deletedWithdrawals.count} withdrawal requests.`);

    const deletedWallets = await prisma.wallet.deleteMany({});
    console.log(`Deleted ${deletedWallets.count} wallets.`);

    const deletedTokens = await prisma.refreshToken.deleteMany({});
    console.log(`Deleted ${deletedTokens.count} refresh tokens.`);

    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`Deleted ${deletedUsers.count} users.`);

    console.log('✅ Complete database wipe finished successfully!');

    // Verify 0 counts
    const verification = {
      users: await prisma.user.count(),
      tasks: await prisma.task.count(),
      submissions: await prisma.submission.count(),
      messages: await prisma.chatMessage.count(),
      wallets: await prisma.wallet.count(),
      transactions: await prisma.transaction.count(),
      withdrawals: await prisma.withdrawalRequest.count(),
      refreshTokens: await prisma.refreshToken.count(),
    };
    console.log('Current DB Counts (All should be 0):', verification);
  } catch (error) {
    console.error('❌ Failed to wipe database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();

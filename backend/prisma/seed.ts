import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TaskHub backend database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Demo Users
  const worker = await prisma.user.upsert({
    where: { email: 'alex.vance@worker.taskhub.io' },
    update: {},
    create: {
      id: 'usr_w101',
      name: 'Alex Vance',
      email: 'alex.vance@worker.taskhub.io',
      passwordHash,
      role: 'WORKER',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      kycStatus: 'VERIFIED',
      status: 'ACTIVE',
      wallet: {
        create: {
          availableBalance: 245.50,
          pendingBalance: 85.00,
          totalEarned: 1420.00,
          totalWithdrawn: 1089.50,
          transactions: {
            create: [
              {
                id: 'tx_701',
                type: 'TASK_PAYOUT',
                amount: 35.00,
                status: 'COMPLETED',
                description: 'Payout for task: Verify 200 B2B Sales Leads',
                referenceId: 'tsk_905',
              },
              {
                id: 'tx_702',
                type: 'WITHDRAWAL',
                amount: 150.00,
                status: 'COMPLETED',
                description: 'Withdrawal to PayPal (alex.vance@worker.taskhub.io)',
                referenceId: 'wdr_301',
              },
            ],
          },
        },
      },
    },
  });

  const business = await prisma.user.upsert({
    where: { email: 'elena@cybernet.ai' },
    update: {},
    create: {
      id: 'usr_b202',
      name: 'Elena Rostova',
      email: 'elena@cybernet.ai',
      passwordHash,
      role: 'BUSINESS',
      companyName: 'CyberNet AI Labs',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      kycStatus: 'VERIFIED',
      status: 'ACTIVE',
      wallet: {
        create: {
          availableBalance: 1000.00,
          pendingBalance: 0.00,
          totalEarned: 0.00,
          totalWithdrawn: 0.00,
        },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'marcus@admin.taskhub.io' },
    update: {},
    create: {
      id: 'usr_a303',
      name: 'Marcus Vance (SuperAdmin)',
      email: 'marcus@admin.taskhub.io',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      kycStatus: 'VERIFIED',
      status: 'ACTIVE',
      wallet: {
        create: {
          availableBalance: 0.00,
          pendingBalance: 0.00,
          totalEarned: 0.00,
          totalWithdrawn: 0.00,
        },
      },
    },
  });

  // 2. Create Tasks
  const task1 = await prisma.task.upsert({
    where: { id: 'tsk_901' },
    update: {},
    create: {
      id: 'tsk_901',
      title: 'Annotate 500 Image Masking Boundaries for Autonomous Vehicles',
      description: 'Segment and outline pedestrian and cyclist polygon boundaries in urban street scene footage using our online web labeling tool.',
      instructions: '1. Access labeler tool link\n2. Highlight pedestrian contours accurately\n3. Export JSON and paste submission URL below.',
      category: 'AI & Data Annotation',
      difficulty: 'INTERMEDIATE',
      reward: 45.00,
      workerLimit: 10,
      assignedWorkersCount: 4,
      deadline: new Date('2026-09-25T23:59:59Z'),
      requiredSkills: JSON.stringify(['Computer Vision', 'Data Annotation', 'Bounding Box']),
      proofRequirements: 'Submit completion JSON export link and screenshot of completed batch dashboard.',
      status: 'AVAILABLE',
      businessId: business.id,
    },
  });

  const task2 = await prisma.task.upsert({
    where: { id: 'tsk_903' },
    update: {},
    create: {
      id: 'tsk_903',
      title: 'Translate Technical API Documentation to Spanish & Portuguese',
      description: 'Translate 3 REST API endpoints overview and sample cURL requests from English into native Latin American Spanish.',
      instructions: 'Ensure technical terminology like OAuth2, Bearer Token, and Webhooks remain standard while context is perfectly translated.',
      category: 'Translation & Localization',
      difficulty: 'ADVANCED',
      reward: 85.00,
      workerLimit: 3,
      assignedWorkersCount: 3,
      deadline: new Date('2026-09-18T18:00:00Z'),
      requiredSkills: JSON.stringify(['Spanish Native', 'Technical Writing', 'REST API']),
      proofRequirements: 'Markdown doc formatted with English side-by-side Spanish translation.',
      status: 'SUBMITTED',
      businessId: business.id,
    },
  });

  // 3. Create Submissions
  await prisma.submission.upsert({
    where: { id: 'sub_001' },
    update: {},
    create: {
      id: 'sub_001',
      taskId: task2.id,
      workerId: worker.id,
      proofType: 'LINK',
      proofContent: 'Completed Spanish documentation Markdown file translated with technical precision.',
      linkUrl: 'https://github.com/alexvance/api-docs-es-translation',
      status: 'UNDER_REVIEW',
      rewardAmount: 85.00,
    },
  });

  // 4. Create Chat Messages
  await prisma.chatMessage.upsert({
    where: { id: 'msg_001' },
    update: {},
    create: {
      id: 'msg_001',
      taskId: task2.id,
      senderId: business.id,
      senderName: 'Elena Rostova',
      senderRole: 'BUSINESS',
      message: 'Hi Alex! Thanks for taking on the doc translation task. Let me know if you need clarification on any API parameters.',
    },
  });

  await prisma.chatMessage.upsert({
    where: { id: 'msg_002' },
    update: {},
    create: {
      id: 'msg_002',
      taskId: task2.id,
      senderId: worker.id,
      senderName: 'Alex Vance',
      senderRole: 'WORKER',
      message: 'Hello Elena! The specs look super clear. I will deliver the translated Markdown by this afternoon.',
    },
  });

  // 5. Create Audit Logs
  await prisma.auditLog.upsert({
    where: { id: 'log_901' },
    update: {},
    create: {
      id: 'log_901',
      actorName: 'Marcus Vance',
      actorRole: 'ADMIN',
      action: 'APPROVED_WITHDRAWAL',
      target: 'wdr_301 ($150.00)',
      ipAddress: '192.168.1.45',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

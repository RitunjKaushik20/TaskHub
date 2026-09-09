import { PrismaClient, TaskDifficulty, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function cleanAndSeed() {
  console.log('🧹 Purging all test and dummy data from Neon PostgreSQL database...');

  // 1. Delete in foreign key dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.withdrawalRequest.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✔ Database wiped clean.');

  // 2. Clean uploads directory
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(uploadsDir, file));
        } catch {}
      }
    }
    console.log(`✔ Cleaned test files from /uploads.`);
  }

  // 3. Create Seed Users
  console.log('🌱 Seeding fresh production-ready starter accounts...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // A. Worker: Alex Vance
  const worker = await prisma.user.create({
    data: {
      id: 'usr_worker_01',
      name: 'Alex Vance',
      email: 'alex.vance@worker.taskhub.io',
      passwordHash,
      role: 'WORKER',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
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

  // B. Business: Elena Rostova (CyberNet AI Labs)
  const business = await prisma.user.create({
    data: {
      id: 'usr_business_01',
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
          availableBalance: 1500.00,
          pendingBalance: 0.00,
          totalEarned: 0.00,
          totalWithdrawn: 0.00,
        },
      },
    },
  });

  // C. SuperAdmin: Marcus Vance
  const admin = await prisma.user.create({
    data: {
      id: 'usr_admin_01',
      name: 'Marcus Vance',
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

  console.log('✔ Users created:');
  console.log(`  - Worker: ${worker.email}`);
  console.log(`  - Business: ${business.email}`);
  console.log(`  - Admin: ${admin.email}`);

  // 4. Create 6 High-Quality Marketplace Tasks
  console.log('📦 Seeding verified marketplace tasks...');
  const tasks = [
    {
      id: 'tsk_cv_01',
      title: 'Annotate 500 Image Masking Boundaries for Autonomous Vehicles',
      description: 'Segment and outline pedestrian and cyclist polygon boundaries in urban street scene footage using our labeling tool specification.',
      instructions: '1. Access high-resolution camera footage batch.\n2. Label pedestrian and cyclist contour polygons accurately with < 2px tolerance.\n3. Export JSON deliverables and upload to TaskHub.',
      category: 'AI & Data Annotation',
      difficulty: TaskDifficulty.INTERMEDIATE,
      reward: 45.00,
      workerLimit: 10,
      assignedWorkersCount: 0,
      deadline: new Date('2026-10-15T23:59:59Z'),
      requiredSkills: JSON.stringify(['Computer Vision', 'Data Annotation', 'Polygon Segmentation']),
      proofRequirements: 'Upload segmentation output JSON file or public link to labeling session summary.',
      status: TaskStatus.AVAILABLE,
      businessId: business.id,
    },
    {
      id: 'tsk_trans_02',
      title: 'Translate Technical API Documentation to Spanish & Portuguese',
      description: 'Translate 3 REST API endpoint guides and sample cURL requests from English into native Latin American Spanish and Brazilian Portuguese.',
      instructions: 'Ensure technical terminology like OAuth2, Bearer Token, HMAC, and Webhooks remain accurate while instructional context is fluidly translated.',
      category: 'Translation & Localization',
      difficulty: TaskDifficulty.ADVANCED,
      reward: 85.00,
      workerLimit: 4,
      assignedWorkersCount: 0,
      deadline: new Date('2026-10-20T18:00:00Z'),
      requiredSkills: JSON.stringify(['Spanish Native', 'Portuguese Native', 'Technical Writing', 'REST APIs']),
      proofRequirements: 'Markdown document with English source side-by-side with localized translations.',
      status: TaskStatus.AVAILABLE,
      businessId: business.id,
    },
    {
      id: 'tsk_llm_03',
      title: 'Evaluate LLM Summarization Quality for Financial Earnings Calls',
      description: 'Grade model outputs against corporate 10-K transcripts across factual consistency, hallucination rate, and key financial metric retention.',
      instructions: 'Compare the AI-generated bullet summaries with original audio transcripts and record numeric accuracy scores across 10 evaluation criteria.',
      category: 'AI & Data Annotation',
      difficulty: TaskDifficulty.EXPERT,
      reward: 120.00,
      workerLimit: 5,
      assignedWorkersCount: 0,
      deadline: new Date('2026-10-25T12:00:00Z'),
      requiredSkills: JSON.stringify(['Financial Analysis', 'LLM Evaluation', 'Fact Checking']),
      proofRequirements: 'Completed evaluation rubric spreadsheet or PDF analysis deliverable.',
      status: TaskStatus.AVAILABLE,
      businessId: business.id,
    },
    {
      id: 'tsk_ux_04',
      title: 'UX Usability Benchmark: Mobile Checkout Flow Audit',
      description: 'Perform a comprehensive heuristic evaluation of our multi-currency mobile payment checkout experience and record usability friction points.',
      instructions: 'Navigate the complete 4-step mobile checkout sequence on iOS and Android. Document cart abandon hurdles, latency issues, and UX inconsistencies.',
      category: 'UX Research',
      difficulty: TaskDifficulty.BEGINNER,
      reward: 35.00,
      workerLimit: 8,
      assignedWorkersCount: 0,
      deadline: new Date('2026-10-10T20:00:00Z'),
      requiredSkills: JSON.stringify(['UX Research', 'Mobile Testing', 'Figma', 'User Feedback']),
      proofRequirements: 'Structured UX review document with annotated screenshots identifying improvement opportunities.',
      status: TaskStatus.AVAILABLE,
      businessId: business.id,
    },
    {
      id: 'tsk_lead_05',
      title: 'Verify and Enrich 250 Enterprise B2B SaaS Leads',
      description: 'Validate company domain, executive title, LinkedIn profile URL, and work email deliverability for a target list of enterprise cloud leaders.',
      instructions: 'Verify emails using MX check tools and ensure contacts are currently active in their listed positions at Fortune 500 software organizations.',
      category: 'Lead Generation',
      difficulty: TaskDifficulty.INTERMEDIATE,
      reward: 55.00,
      workerLimit: 6,
      assignedWorkersCount: 0,
      deadline: new Date('2026-10-18T16:00:00Z'),
      requiredSkills: JSON.stringify(['Lead Verification', 'B2B Research', 'LinkedIn Sales Nav']),
      proofRequirements: 'CSV or Google Sheets link with all 250 verified lead entries.',
      status: TaskStatus.AVAILABLE,
      businessId: business.id,
    },
    {
      id: 'tsk_swe_06',
      title: 'Develop High-Performance TypeScript SDK Client Wrapper',
      description: 'Build an open-source, typed SDK wrapper for our developer platform with retry logic, rate-limit backoff, and full Vitest unit test coverage.',
      instructions: '1. Clone boilerplate repository.\n2. Implement async retry with exponential jitter.\n3. Verify 100% test coverage with vitest run.',
      category: 'Software Engineering',
      difficulty: TaskDifficulty.ADVANCED,
      reward: 150.00,
      workerLimit: 2,
      assignedWorkersCount: 0,
      deadline: new Date('2026-10-30T23:59:59Z'),
      requiredSkills: JSON.stringify(['TypeScript', 'Node.js', 'Vitest', 'SDK Design']),
      proofRequirements: 'Public GitHub repository link with passing GitHub Actions CI pipeline.',
      status: TaskStatus.AVAILABLE,
      businessId: business.id,
    },
  ];

  for (const t of tasks) {
    await prisma.task.create({ data: t });
  }

  console.log(`✔ Created ${tasks.length} marketplace tasks successfully.`);
  console.log('\n=================================================');
  console.log('🎉 Database clean & seed completed successfully!');
  console.log('=================================================\n');
}

cleanAndSeed()
  .catch((err) => {
    console.error('Fatal error during clean-and-seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

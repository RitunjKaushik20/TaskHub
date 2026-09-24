import { io as SocketClient } from 'socket.io-client';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const API_BASE = 'http://localhost:8000';
const prisma = new PrismaClient();

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

let businessToken = '';
let workerToken = '';

async function request<T = any>(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
    formData?: FormData;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', token, body, formData } = options;
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody: any = undefined;
  if (formData) {
    requestBody = formData;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: requestBody,
  });

  const json = (await res.json()) as ApiResponse<T>;
  return json;
}

const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
};

function pass(step: string, details?: string) {
  console.log(`  ${colors.green('✔')} ${colors.bold(step)} ${details ? colors.cyan(`(${details})`) : ''}`);
}

function fail(step: string, details: string): never {
  console.error(`  ${colors.red('✖')} ${colors.bold(step)} - ${details}`);
  process.exit(1);
}

// Part B: registration is OTP-gated. A fresh account is unverified and gets no
// session. This harness completes the loop through the real /otp/verify
// endpoint — it pre-seeds the DB with a known hashed code (bcrypt), exactly as
// the email service would, then submits it over the API. The email delivery
// itself is exercised by the SMTP/dev transport and never automated here.
async function completeOtpVerification(email: string): Promise<{ token: string; role: string }> {
  const code = '123456';
  await prisma.user.update({
    where: { email },
    data: {
      otpHash: await bcrypt.hash(code, 10),
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
    },
  });
  const verifyRes = await request('/api/auth/otp/verify', {
    method: 'POST',
    body: { email, code },
  });
  if (!verifyRes.success || !verifyRes.data?.token) {
    fail('Email OTP Verification', JSON.stringify(verifyRes));
  }
  pass('Email OTP Verified (POST /api/auth/otp/verify)', `User: ${email}`);
  return { token: verifyRes.data.token, role: verifyRes.data.role };
}

async function run() {
  console.log(colors.cyan('\n======================================================'));
  console.log(colors.bold('  🚀 TaskHub Full End-to-End Audit & Verification'));
  console.log(colors.cyan('======================================================\n'));

  const timestamp = Date.now();

  // 1. Health Check
  console.log(colors.bold('[1/7] Database & Backend Health Check'));
  const health: any = await request('/api/health');
  if (health?.status === 'online' || health?.data?.status === 'online') {
    pass('Health Check GET /api/health', `status: ${health.status || health.data?.status}`);
  } else {
    fail('Health Check', JSON.stringify(health));
  }

  // 2. Business Flow: Register & Post Task
  console.log(colors.bold('\n[2/7] Business Flow: Registration, Approval Gate & Task Creation'));
  const businessEmail = `business_${timestamp}@cybernet.ai`;
  const regBusiness = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Dr. Elena Rostova',
      email: businessEmail,
      password: 'password123',
      role: 'BUSINESS',
      companyName: 'CyberNet Autonomous Labs',
      companyProfile: {
        companyName: 'CyberNet Autonomous Labs',
        industryType: 'SaaS',
        websiteUrl: 'https://cybernet-autonomous.ai',
        companySize: '51-200',
        servicesNeeded: ['AI Data Labeling', 'App QA'],
      },
    },
  });

  if (regBusiness.success && regBusiness.data?.pendingEmailVerification) {
    pass('Business Registration', `User: ${regBusiness.data.email}, Role: ${regBusiness.data.role} (pending OTP)`);
  } else {
    fail('Business Registration', JSON.stringify(regBusiness));
  }

  // Complete the Part B email-verification loop to unlock the account.
  const businessSession = await completeOtpVerification(businessEmail);
  businessToken = businessSession.token;

  // Feature 2: new businesses start PENDING. Simulate the Super Admin approval
  // step so the rest of the E2E flow (task posting -> escrow -> payout) can run.
  const businessUser = await prisma.user.findUnique({
    where: { email: businessEmail },
    select: { id: true, approvalStatus: true },
  });
  if (!businessUser) {
    fail('Business Approval Lookup', `Could not find business ${businessEmail} in DB`);
  }
  if (businessUser!.approvalStatus !== 'APPROVED') {
    await prisma.user.update({
      where: { id: businessUser!.id },
      data: { approvalStatus: 'APPROVED' },
    });
    pass('Business Approved by Admin (simulated)', `approvalStatus -> APPROVED`);
  } else {
    pass('Business Already Approved', 'No admin action required');
  }

  // Negative test: a freshly registered business should be blocked from posting.
  const pendingEmail = `pending_${timestamp}@cybernet.ai`;
  const regPending = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Pending Corp',
      email: pendingEmail,
      password: 'password123',
      role: 'BUSINESS',
      companyProfile: {
        companyName: 'Pending Corp',
        industryType: 'SaaS',
        websiteUrl: 'https://pending.corp',
        companySize: '1-10',
        servicesNeeded: ['App QA'],
      },
    },
  });
  if (!regPending.success || !regPending.data?.pendingEmailVerification) {
    fail('Pending Business Registration', JSON.stringify(regPending));
  }
  const pendingSession = await completeOtpVerification(pendingEmail);
  const blockedPost = await request('/api/tasks', {
    method: 'POST',
    token: pendingSession.token,
    body: {
      title: 'Should be blocked for pending business',
      description: 'This task must never be allowed to publish while pending.',
      instructions: 'Should not run',
      category: 'AI & Data Annotation',
      difficulty: 'BEGINNER',
      reward: 1.0,
      workerLimit: 1,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      requiredSkills: ['Test'],
      proofRequirements: 'None',
    },
  });
  if (!blockedPost || blockedPost.success !== false || blockedPost.data?.id) {
    fail('Pending Business Task Gate', `Expected 403 rejection, got: ${JSON.stringify(blockedPost)}`);
  }
  pass('Approval Gate Blocks Pending Business', 'POST /api/tasks returned a rejection for a pending account');

  // Post Task
  const postTask = await request('/api/tasks', {
    method: 'POST',
    token: businessToken,
    body: {
      title: `E2E Verify Autonomous Vehicle Object Annotation ${timestamp}`,
      description: 'Annotate street cameras bounding boxes for autonomous driving verification.',
      instructions: '1. Open link\n2. Outline objects\n3. Export JSON file',
      category: 'AI & Data Annotation',
      difficulty: 'INTERMEDIATE',
      reward: 50.0,
      workerLimit: 2,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      requiredSkills: ['Computer Vision', 'Bounding Box'],
      proofRequirements: 'Submit uploaded deliverable JSON proof file',
    },
  });

  if (!postTask.success || !postTask.data?.id) {
    fail('Task Creation', JSON.stringify(postTask));
  }
  const taskId = postTask.data.id;
  pass('Task Creation', `Task ID: ${taskId}, Reward: $${postTask.data.reward}`);

  // No escrow, no payment gateway: an approved business can post a task
  // directly; funds are settled off-platform and tracked manually.
  const paymentsProbe = await fetch(`${API_BASE}/api/payments/razorpay/config`);
  // The legacy Razorpay router should be gone entirely. If anything still
  // serves a 200 here, the removal regressed.
  if (paymentsProbe.status === 200) {
    fail('Payment Gateway Removal', 'Legacy /api/payments route still responds');
  }
  pass('Razorpay Gateway Removed', '/api/payments no longer served');

  // 3. Worker Flow: Register, Discover, Claim Task
  console.log(colors.bold('\n[3/7] Worker Flow: Registration, Task Discovery & Seat Locking'));
  const workerEmail = `worker_${timestamp}@taskhub.io`;
  const regWorker = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Alex Vance',
      email: workerEmail,
      password: 'password123',
      role: 'WORKER',
    },
  });

  if (!regWorker.success || !regWorker.data?.pendingEmailVerification) {
    fail('Worker Registration', JSON.stringify(regWorker));
  }
  const workerSession = await completeOtpVerification(workerEmail);
  workerToken = workerSession.token;
  pass('Worker Registration', `User: ${regWorker.data.email}`);

  // Check initial worker earnings are zero (0.00)
  const initialWallet = await request('/api/wallet/summary', {
    token: workerToken,
  });
  if (!initialWallet.success || initialWallet.data?.totalEarned !== 0 || initialWallet.data?.availableBalance !== 0) {
    fail('Worker Initial Wallet Check', `Expected 0 totalEarned, got: ${JSON.stringify(initialWallet)}`);
  }
  pass('Worker Initial Earnings', `Total Earned: $${initialWallet.data.totalEarned.toFixed(2)}`);

  // Discover tasks
  const tasksList = await request('/api/tasks');
  const discoveredTask = tasksList.data?.find((t: any) => t.id === taskId);
  if (!discoveredTask) {
    fail('Task Discovery', `Task ${taskId} not found in available list`);
  }
  pass('Task Discovered in Marketplace', `Title: "${discoveredTask.title.slice(0, 45)}..."`);

  // Claim Task Seat
  const claimTask = await request(`/api/tasks/${taskId}/accept`, {
    method: 'POST',
    token: workerToken,
  });

  if (!claimTask.success || claimTask.data?.status !== 'IN_PROGRESS') {
    fail('Task Claim', JSON.stringify(claimTask));
  }
  pass('Worker Claimed Task Seat', `Status: ${claimTask.data.status}, Workers: ${claimTask.data.assignedWorkersCount}/${claimTask.data.workerLimit}`);

  // 4. Proof File Upload
  console.log(colors.bold('\n[4/7] Proof Deliverable File Upload (/uploads)'));
  const sampleProofContent = JSON.stringify({
    annotatedFrames: 300,
    dataset: 'urban_street_01',
    accuracy: '99.4%',
    timestamp: new Date().toISOString(),
  }, null, 2);

  const form = new FormData();
  const fileBlob = new Blob([sampleProofContent], { type: 'application/json' });
  form.append('file', fileBlob, `proof_annotation_${timestamp}.json`);

  const uploadRes = await request('/api/uploads', {
    method: 'POST',
    token: workerToken,
    formData: form,
  });

  if (!uploadRes.success || !uploadRes.data?.fileUrl) {
    fail('Proof File Upload', JSON.stringify(uploadRes));
  }
  const uploadedFileUrl = uploadRes.data.fileUrl;
  pass('Proof File Uploaded via Multer', `Path: ${uploadedFileUrl}, Size: ${uploadRes.data.size} bytes`);

  // Verify static serving of uploaded file
  const staticFileRes = await fetch(`${API_BASE}${uploadedFileUrl}`);
  if (staticFileRes.status !== 200) {
    fail('Static File Serving Check', `GET ${uploadedFileUrl} returned HTTP ${staticFileRes.status}`);
  }
  pass('Static File Delivery Verified', `GET ${uploadedFileUrl} returned 200 OK`);

  // 5. Proof Submission + Real-Time Chat
  console.log(colors.bold('\n[5/7] Proof Submission & Real-Time Socket.IO Chat'));
  const submitProof = await request('/api/submissions', {
    method: 'POST',
    token: workerToken,
    body: {
      taskId,
      proofType: 'FILE',
      proofContent: 'Completed 300-frame image segmentation with ped/cyclist masks.',
      fileUrl: uploadedFileUrl,
    },
  });

  if (!submitProof.success || !submitProof.data?.id) {
    fail('Proof Submission', JSON.stringify(submitProof));
  }
  const submissionId = submitProof.data.id;
  pass('Proof Submitted to Business', `Submission ID: ${submissionId}, Status: ${submitProof.data.status}`);

  // Real-time chat: the worker must connect WITH a valid JWT and may only join
  // the task room because they now hold a submission on it (membership is
  // enforced server-side on the socket handshake and on join-task).
  const workerSocket = SocketClient(API_BASE, {
    transports: ['websocket', 'polling'],
    auth: { token: workerToken },
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
    workerSocket.on('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
    workerSocket.on('connect_error', (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`Socket auth error: ${err.message}`));
    });
  });
  pass('Worker Socket.IO Connected With JWT', `Socket ID: ${workerSocket.id}`);

  const joinedChat = await new Promise<boolean>((resolve) => {
    workerSocket.emit('join-task', taskId, (result: boolean) => resolve(result));
    setTimeout(() => resolve(false), 5000);
  });
  if (!joinedChat) {
    fail('Worker Join Chat Room', `join-task ack=false for task ${taskId}`);
  }
  pass('Worker Joined Chat Room', `Room: task:${taskId}`);

  const chatMessageText = `Hello Worker! Thanks for delivering ${taskId}. Please respond to any follow-ups.`;
  const receivedMessagePromise = new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Did not receive socket message in time')), 7000);
    workerSocket.on('new-message', (msg: any) => {
      if (msg.taskId === taskId) {
        clearTimeout(timeout);
        resolve(msg);
      }
    });
  });

  const sendChatRes = await request(`/api/chat/tasks/${taskId}`, {
    method: 'POST',
    token: businessToken,
    body: { message: chatMessageText },
  });

  if (!sendChatRes.success) {
    fail('Send Chat Message', JSON.stringify(sendChatRes));
  }

  const receivedMsg = await receivedMessagePromise;
  if (receivedMsg.message !== chatMessageText) {
    fail('Socket.IO Message Verification', `Expected "${chatMessageText}", got "${receivedMsg.message}"`);
  }
  pass('Socket.IO Real-Time Messaging Verified', `Received live broadcast: "${receivedMsg.message.slice(0, 40)}..."`);
  workerSocket.disconnect();

  // 6. Review, Approve, and Manually Mark as Paid
  console.log(colors.bold('\n[6/7] Approval & Manual Payment Tracking'));

  // Business Reviews & Approves Submission (approval alone moves NO money now)
  const reviewSub = await request(`/api/submissions/${submissionId}/review`, {
    method: 'POST',
    token: businessToken,
    body: {
      status: 'APPROVED',
      qualityScore: 5,
      feedback: 'Outstanding bounding box accuracy. Reward payable on manual settlement.',
    },
  });

  if (!reviewSub.success || reviewSub.data?.status !== 'APPROVED') {
    fail('Submission Approval', JSON.stringify(reviewSub));
  }
  if (reviewSub.data.paymentStatus !== 'PENDING') {
    fail('Submission Payment State After Approval', `Expected PENDING, got: ${reviewSub.data.paymentStatus}`);
  }
  pass('Business Approved Submission', `Score: ${reviewSub.data.qualityScore}/5 stars, Reward: $${reviewSub.data.rewardAmount} (payment PENDING)`);

  // No money should have moved just because it was approved.
  const postApproveWallet = await request('/api/wallet/summary', {
    token: workerToken,
  });
  if (!postApproveWallet.success || postApproveWallet.data.totalEarned !== 0) {
    fail('No Auto-Payout on Approval', `Expected totalEarned $0, got: $${postApproveWallet.data?.totalEarned}`);
  }
  if (postApproveWallet.data.pendingBalance !== 50.0) {
    fail('Worker Pending Earnings After Approval', `Expected pendingBalance $50, got: $${postApproveWallet.data?.pendingBalance}`);
  }
  pass('Approval Does Not Release Money', `Worker totalEarned $0.00, pending $${postApproveWallet.data.pendingBalance.toFixed(2)}`);

  const businessWalletOpen = await request('/api/wallet/summary', {
    token: businessToken,
  });
  if (!businessWalletOpen.success || businessWalletOpen.data.totalSpending !== 0) {
    fail('Business Spending Before Payment', `Expected totalSpending $0, got: $${businessWalletOpen.data?.totalSpending}`);
  }
  pass('Business Spending Zero Before Mark-as-Paid', `Total Spending: $0.00, pendingPayout: $${businessWalletOpen.data.pendingPayout.toFixed(2)}`);

  // Worker confirms the off-platform payment (worker-side Mark as Paid).
  const workerMark = await request(`/api/submissions/${submissionId}/mark-paid`, {
    method: 'POST',
    token: workerToken,
  });
  if (!workerMark.success || workerMark.data?.paymentStatus !== 'MARKED_PAID' || workerMark.data?.alreadyPaid) {
    fail('Worker Mark as Paid', JSON.stringify(workerMark));
  }
  pass('Worker Marked Submission as Paid', `paymentStatus: ${workerMark.data.paymentStatus}`);

  // Business re-marks as paid -> idempotent no-op (no double count).
  const businessMark = await request(`/api/submissions/${submissionId}/mark-paid`, {
    method: 'POST',
    token: businessToken,
  });
  if (!businessMark.success || !businessMark.data?.alreadyPaid) {
    fail('Idempotent Re-Mark as Paid', JSON.stringify(businessMark));
  }
  pass('Second Mark-as-Paid is Idempotent No-Op', 'alreadyPaid: true, no duplicate ledger row');

  // Post-payment state: task should be PAID; worker earnings + business spending credited exactly once.
  const fundedWallet = await request('/api/wallet/summary', {
    token: workerToken,
  });
  if (!fundedWallet.success || fundedWallet.data.totalEarned !== 50.0) {
    fail('Worker Earnings After Mark as Paid', `Expected $50.00, got: $${fundedWallet.data?.totalEarned}`);
  }
  if (fundedWallet.data.pendingBalance !== 0) {
    fail('Worker Pending After Payment', `Expected $0.00, got: $${fundedWallet.data?.pendingBalance}`);
  }
  pass('Worker Total Earnings Updated', `Total Earned: $${fundedWallet.data.totalEarned.toFixed(2)}, Pending: $${fundedWallet.data.pendingBalance.toFixed(2)}`);

  const businessWalletClosed = await request('/api/wallet/summary', {
    token: businessToken,
  });
  if (!businessWalletClosed.success || businessWalletClosed.data.totalSpending !== 50.0) {
    fail('Business Spending After Mark as Paid', `Expected $50.00, got: $${businessWalletClosed.data?.totalSpending}`);
  }
  pass('Business Total Spending Updated', `Total Spending: $${businessWalletClosed.data.totalSpending.toFixed(2)}`);

  const taskAfterPaid = await request(`/api/tasks/${taskId}`, {
    token: businessToken,
  });
  if (taskAfterPaid.data?.status !== 'PAID') {
    fail('Task Status After Payment', `Expected PAID, got: ${taskAfterPaid.data?.status}`);
  }
  pass('Task Status Advanced to PAID', `Status: ${taskAfterPaid.data.status}`);

  const workerTxList = await request('/api/wallet/transactions', {
    token: workerToken,
  });
  const payoutTxs = workerTxList.data?.filter((tx: any) => tx.type === 'TASK_PAYOUT') || [];
  if (payoutTxs.length !== 1 || payoutTxs[0].amount !== 50.0) {
    fail('Single Payout Ledger Record', `Expected exactly one $50 TASK_PAYOUT, got: ${JSON.stringify(payoutTxs)}`);
  }
  pass('Manual Payment Logged Exactly Once in Ledger', `TX ID: ${payoutTxs[0].id}, Type: TASK_PAYOUT, Amount: +$${payoutTxs[0].amount}`);

  // 7. Google OAuth Security Hardening (forged/unsigned tokens must be rejected)
  // NOTE: a positive Google sign-in can only be verified against a real Google
  // account (real ID token). The automation below asserts the security boundary:
  // no client-supplied credential, no unsigned/forged JWT, and no
  // email/email_verified query param can ever mint a session. Email+OTP flows
  // that a fresh Google signup goes through are covered in sections 2/3.
  console.log(colors.bold('\n[7/7] Google OAuth Security: Forged Credentials Rejected'));
  const forgeB64url = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const fakeEmail = `gtest_${timestamp}@cybernet.ai`;

  // 7a. No credential / client-supplied email+name must be rejected outright.
  const noCredential = await request('/api/auth/google/verify', {
    method: 'POST',
    body: { email: fakeEmail, name: 'Grace', role: 'WORKER' },
  });
  if (noCredential.success !== false || noCredential.data?.token) {
    fail('Google Verify Must Reject Missing Credential', JSON.stringify(noCredential));
  }
  pass('Missing Credential Rejected', 'POST /api/auth/google/verify -> 400, no session issued');

  // 7b. An unsigned (alg:none) forged JWT claiming any verified email must fail
  // server-side ID-token verification against Google.
  const forgedCredential =
    forgeB64url({ alg: 'none', typ: 'JWT' }) +
    '.' +
    forgeB64url({ email: fakeEmail, email_verified: true, sub: '12345', name: 'Fake Grace' }) +
    '.';
  const forgedVerify = await request('/api/auth/google/verify', {
    method: 'POST',
    body: { credential: forgedCredential, role: 'WORKER' },
  });
  if (forgedVerify.success !== false || forgedVerify.data?.token) {
    fail('Forged Unsigned Token Must Be Rejected', JSON.stringify(forgedVerify));
  }
  pass('Forged alg=none Token Rejected', 'token never passes Google tokeninfo verification');

  // 7c. /api/google/connect must not trust email/email_verified query params —
  // with no real `credential`, it must redirect back to the GIS flow with NO token.
  const connectRes = await fetch(
    `${API_BASE}/api/google/connect?email=${encodeURIComponent(`fakeadmin_${timestamp}@taskhub.io`)}&email_verified=true&role=ADMIN`,
    { redirect: 'manual' }
  );
  const connectLocation = connectRes.headers.get('location') || '';
  if (connectRes.status !== 302 || connectLocation.includes('token=')) {
    fail('Google Connect Must Not Trust Query Params', `status=${connectRes.status}, location=${connectLocation}`);
  }
  pass('google/connect Ignores email_verified Query Param', 'Redirect goes back to the GIS flow, no token issued');

  // 7d. The GIS client ID is exposed for the real OAuth button.
  const oauthConfig = await request('/api/auth/google/config');
  if (!oauthConfig.success || !oauthConfig.data?.clientId) {
    fail('Google OAuth Config', JSON.stringify(oauthConfig));
  }
  pass('OAuth Client ID Exposed for GIS Button', `clientId: ${String(oauthConfig.data.clientId).slice(0, 24)}...`);

  console.log(colors.green('\n======================================================'));
  console.log(colors.bold(colors.green('  ✔ ALL END-TO-END VERIFICATION CHECKS PASSED 100%!')));
  console.log(colors.green('======================================================\n'));
}

run().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});

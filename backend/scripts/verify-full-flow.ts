import { io as SocketClient } from 'socket.io-client';
import http from 'http';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:8000';

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
  console.log(colors.bold('\n[2/7] Business Flow: Registration, Task Creation & Escrow Deposit'));
  const businessEmail = `business_${timestamp}@cybernet.ai`;
  const regBusiness = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Dr. Elena Rostova',
      email: businessEmail,
      password: 'password123',
      role: 'BUSINESS',
      companyName: 'CyberNet Autonomous Labs',
    },
  });

  if (regBusiness.success && regBusiness.data?.token) {
    businessToken = regBusiness.data.token;
    pass('Business Registration', `User: ${regBusiness.data.email}, Role: ${regBusiness.data.role}`);
  } else {
    fail('Business Registration', JSON.stringify(regBusiness));
  }

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

  // Razorpay Escrow Deposit Order
  const rzpOrder = await request('/api/payments/razorpay/create-order', {
    method: 'POST',
    token: businessToken,
    body: {
      taskId,
      amount: 100.0, // 2 seats * $50
      currency: 'USD',
    },
  });

  if (!rzpOrder.success || !rzpOrder.data?.orderId) {
    fail('Razorpay Escrow Order Creation', JSON.stringify(rzpOrder));
  }
  pass('Razorpay Order Created', `Order ID: ${rzpOrder.data.orderId}, Key: ${rzpOrder.data.keyId}`);

  // Razorpay Escrow Payment Verification
  const rzpVerify = await request('/api/payments/razorpay/verify', {
    method: 'POST',
    token: businessToken,
    body: {
      razorpay_order_id: rzpOrder.data.orderId,
      razorpay_payment_id: `pay_test_${timestamp}`,
      taskId,
      amount: 100.0,
    },
  });

  if (!rzpVerify.success || !rzpVerify.data?.verified) {
    fail('Razorpay Escrow Verification', JSON.stringify(rzpVerify));
  }
  pass('Razorpay Escrow Verified', `Transaction: ${rzpVerify.data.transactionId}, Status: LOCKED & COMPLETED`);

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

  if (!regWorker.success || !regWorker.data?.token) {
    fail('Worker Registration', JSON.stringify(regWorker));
  }
  workerToken = regWorker.data.token;
  pass('Worker Registration', `User: ${regWorker.data.email}`);

  // Check initial worker wallet balance is 0.00
  const initialWallet = await request('/api/wallet/summary', {
    token: workerToken,
  });
  if (!initialWallet.success || initialWallet.data?.availableBalance !== 0) {
    fail('Worker Initial Wallet Balance Check', `Expected 0.00, got: ${JSON.stringify(initialWallet)}`);
  }
  pass('Worker Initial Wallet Balance', `Available: $${initialWallet.data.availableBalance.toFixed(2)}`);

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

  // 4. Real-Time Chat Verification via Socket.IO
  console.log(colors.bold('\n[4/7] Real-Time Chat Verification via Socket.IO'));
  const workerSocket = SocketClient(API_BASE, {
    transports: ['websocket', 'polling'],
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
    workerSocket.on('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  pass('Worker Socket.IO Connected', `Socket ID: ${workerSocket.id}`);

  // Join task room
  workerSocket.emit('join-task', taskId);
  pass('Worker Joined Chat Room', `Room: task:${taskId}`);

  // Prepare listener for incoming message
  const chatMessageText = `Hello Worker! Thanks for claiming task ${taskId}. Please deliver by tomorrow.`;
  const receivedMessagePromise = new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Did not receive socket message in time')), 7000);
    workerSocket.on('new-message', (msg: any) => {
      if (msg.taskId === taskId) {
        clearTimeout(timeout);
        resolve(msg);
      }
    });
  });

  // Business sends message via REST API (which broadcasts to Socket.IO room)
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

  // 5. Proof File Upload (/uploads)
  console.log(colors.bold('\n[5/7] Proof Deliverable File Upload (/uploads)'));
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

  // 6. Submit Proof & Escrow Payout
  console.log(colors.bold('\n[6/7] Proof Submission & Automated Escrow Payout'));
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

  // Business Reviews & Approves Submission
  const reviewSub = await request(`/api/submissions/${submissionId}/review`, {
    method: 'POST',
    token: businessToken,
    body: {
      status: 'APPROVED',
      qualityScore: 5,
      feedback: 'Outstanding bounding box accuracy. Escrow reward released!',
    },
  });

  if (!reviewSub.success || reviewSub.data?.status !== 'APPROVED') {
    fail('Submission Approval', JSON.stringify(reviewSub));
  }
  pass('Business Approved Submission', `Score: ${reviewSub.data.qualityScore}/5 stars, Reward: $${reviewSub.data.rewardAmount}`);

  // Verify Automated Escrow Payout into Worker's Wallet
  const fundedWallet = await request('/api/wallet/summary', {
    token: workerToken,
  });

  if (!fundedWallet.success || fundedWallet.data.availableBalance !== 50.0) {
    fail('Worker Payout Verification', `Expected availableBalance $50.00, got: $${fundedWallet.data?.availableBalance}`);
  }
  pass('Worker Wallet Escrow Payout Received', `Available Balance: $${fundedWallet.data.availableBalance.toFixed(2)} (+$50.00 reward)`);

  const workerTxList = await request('/api/wallet/transactions', {
    token: workerToken,
  });

  const payoutTx = workerTxList.data?.find((tx: any) => tx.type === 'TASK_PAYOUT');
  if (!payoutTx || payoutTx.amount !== 50.0) {
    fail('Worker Payout Transaction Log', `Missing or incorrect TASK_PAYOUT transaction: ${JSON.stringify(workerTxList)}`);
  }
  pass('Automated Transaction Logged', `TX ID: ${payoutTx.id}, Type: ${payoutTx.type}, Amount: +$${payoutTx.amount}`);

  // 7. Withdrawal Flow
  console.log(colors.bold('\n[7/7] Worker Payout Withdrawal Flow'));
  const withdrawAmount = 20.0;
  const withdrawRes = await request('/api/withdrawals', {
    method: 'POST',
    token: workerToken,
    body: {
      amount: withdrawAmount,
      method: 'PAYPAL',
      accountDetails: 'alex.vance@worker.taskhub.io',
    },
  });

  if (!withdrawRes.success || !withdrawRes.data?.id) {
    fail('Withdrawal Request', JSON.stringify(withdrawRes));
  }
  const withdrawalId = withdrawRes.data.id;
  pass('Withdrawal Requested', `ID: ${withdrawalId}, Amount: $${withdrawAmount}, Status: PENDING`);

  // Verify Worker Wallet balance deduction
  const postWithdrawWallet = await request('/api/wallet/summary', {
    token: workerToken,
  });

  const expectedRemaining = 50.0 - withdrawAmount; // $30.00
  if (!postWithdrawWallet.success || postWithdrawWallet.data.availableBalance !== expectedRemaining) {
    fail('Wallet Balance Deduction Check', `Expected $${expectedRemaining.toFixed(2)}, got: $${postWithdrawWallet.data?.availableBalance}`);
  }
  pass('Wallet Balance Correctly Deducted', `Remaining Available: $${postWithdrawWallet.data.availableBalance.toFixed(2)}, Total Withdrawn: $${postWithdrawWallet.data.totalWithdrawn.toFixed(2)}`);

  // Verify Withdrawal transaction logged
  const postWithdrawTxList = await request('/api/wallet/transactions', {
    token: workerToken,
  });
  const withdrawTx = postWithdrawTxList.data?.find((tx: any) => tx.type === 'WITHDRAWAL');
  if (!withdrawTx || withdrawTx.amount !== withdrawAmount) {
    fail('Withdrawal Transaction Log', 'Missing WITHDRAWAL transaction');
  }
  pass('Withdrawal Transaction Logged in Ledger', `TX ID: ${withdrawTx.id}, Type: WITHDRAWAL, Amount: -$${withdrawTx.amount}`);

  console.log(colors.green('\n======================================================'));
  console.log(colors.bold(colors.green('  ✔ ALL END-TO-END VERIFICATION CHECKS PASSED 100%!')));
  console.log(colors.green('======================================================\n'));
}

run().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});

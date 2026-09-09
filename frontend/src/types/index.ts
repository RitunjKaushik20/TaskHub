export type UserRole = 'WORKER' | 'BUSINESS' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  bio?: string;
  skills?: string;
  avatarUrl?: string;
  kycVerified?: boolean;
  createdAt: string;
}

export type TaskStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  difficulty: TaskDifficulty;
  reward: number;
  currency?: 'USD' | 'INR';
  workerLimit: number;
  assignedWorkersCount: number;
  deadline: string;
  requiredSkills: string[];
  proofRequirements: string;
  status: TaskStatus;
  businessId: string;
  businessName: string;
  businessCompany?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  workerId: string;
  workerName: string;
  proofType: 'FILE' | 'LINK' | 'TEXT' | 'HYBRID';
  proofContent: string;
  fileUrl?: string;
  linkUrl?: string;
  status: SubmissionStatus;
  qualityScore?: number; // 1-5
  rejectionReason?: string;
  feedback?: string;
  rewardAmount: number;
  submittedAt: string;
  reviewedAt?: string;
}

export interface ChatMessage {
  id: string;
  taskId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  message: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
}

export interface WalletSummary {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export type TransactionType = 'TASK_PAYOUT' | 'WITHDRAWAL' | 'TASK_REWARD' | 'REFUND';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  referenceId?: string;
  createdAt: string;
}

export type WithdrawalMethod = 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO_USDT';

export interface WithdrawalRequest {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  amount: number;
  method: WithdrawalMethod;
  accountDetails: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  processedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface TaskFilters {
  search?: string;
  category?: string;
  difficulty?: string;
  minReward?: number;
  maxReward?: number;
  status?: string;
}

export interface UserManagementItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'FROZEN';
  kycStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  joinedDate: string;
  tasksCount: number;
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  ipAddress: string;
  timestamp: string;
}

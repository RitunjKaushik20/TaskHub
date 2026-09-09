import type {
  User,
  Task,
  Submission,
  WalletSummary,
  Transaction,
  WithdrawalRequest,
  ChatMessage,
  UserManagementItem,
  AuditLog,
} from '../types';

export const MOCK_USERS: Record<string, User> = {};

export const MOCK_TASKS: Task[] = [];

export const MOCK_SUBMISSIONS: Submission[] = [];

export const MOCK_WALLET: WalletSummary = {
  availableBalance: 0,
  pendingBalance: 0,
  totalEarned: 0,
  totalWithdrawn: 0,
};

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const MOCK_WITHDRAWALS: WithdrawalRequest[] = [];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [];

export const MOCK_ADMIN_USERS: UserManagementItem[] = [];

export const MOCK_AUDIT_LOGS: AuditLog[] = [];

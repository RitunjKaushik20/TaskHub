import { api, apiRequest } from '../lib/api';
import type { UserManagementItem, WithdrawalRequest, AuditLog, ApiResponse, Task, Submission } from '../types';

export const adminApi = {
  getUsers: async (): Promise<ApiResponse<UserManagementItem[]>> => {
    return apiRequest(() => api.get('/admin/users'));
  },

  updateUserStatus: async (
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'FROZEN'
  ): Promise<ApiResponse<UserManagementItem>> => {
    return apiRequest(() => api.patch(`/admin/users/${userId}/status`, { status }));
  },

  getAdminTasks: async (): Promise<ApiResponse<Task[]>> => {
    return apiRequest(() => api.get('/admin/tasks'));
  },
  getTasks: async (): Promise<ApiResponse<Task[]>> => {
    return apiRequest(() => api.get('/admin/tasks'));
  },

  getAdminSubmissions: async (): Promise<ApiResponse<Submission[]>> => {
    return apiRequest(() => api.get('/admin/submissions'));
  },
  getSubmissions: async (): Promise<ApiResponse<Submission[]>> => {
    return apiRequest(() => api.get('/admin/submissions'));
  },

  getVerificationQueue: async (): Promise<ApiResponse<UserManagementItem[]>> => {
    return apiRequest(() => api.get('/admin/verification'));
  },

  getWithdrawalQueue: async (): Promise<ApiResponse<WithdrawalRequest[]>> => {
    return apiRequest(() => api.get('/admin/withdrawals'));
  },
  getWithdrawals: async (): Promise<ApiResponse<WithdrawalRequest[]>> => {
    return apiRequest(() => api.get('/admin/withdrawals'));
  },

  processWithdrawal: async (
    withdrawalId: string,
    action: 'APPROVE' | 'REJECT'
  ): Promise<ApiResponse<WithdrawalRequest>> => {
    return apiRequest(() => api.post(`/admin/withdrawals/${withdrawalId}/process`, { action }));
  },

  getAuditLogs: async (): Promise<ApiResponse<AuditLog[]>> => {
    return apiRequest(() => api.get('/admin/audit-logs'));
  },

  getAdminAnalytics: async (): Promise<ApiResponse<any>> => {
    return apiRequest(() => api.get('/admin/analytics'));
  },
};

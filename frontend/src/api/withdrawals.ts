import { api, apiRequest } from '../lib/api';
import type { WithdrawalRequest, ApiResponse, WithdrawalMethod } from '../types';

export interface CreateWithdrawalPayload {
  amount: number;
  method: WithdrawalMethod;
  accountDetails: string;
}

export const withdrawalsApi = {
  createWithdrawal: async (payload: CreateWithdrawalPayload): Promise<ApiResponse<WithdrawalRequest>> => {
    return apiRequest(() => api.post('/withdrawals', payload));
  },

  getWithdrawals: async (): Promise<ApiResponse<WithdrawalRequest[]>> => {
    return apiRequest(() => api.get('/withdrawals'));
  },
};

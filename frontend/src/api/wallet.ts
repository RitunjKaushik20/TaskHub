import { api, apiRequest } from '../lib/api';
import type { WalletSummary, Transaction, ApiResponse } from '../types';

export const walletApi = {
  getWalletSummary: async (): Promise<ApiResponse<WalletSummary>> => {
    return apiRequest(() => api.get('/wallet/summary'));
  },

  getTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    return apiRequest(() => api.get('/wallet/transactions'));
  },
};

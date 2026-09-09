import { api, apiRequest } from '../lib/api';
import type { ApiResponse } from '../types';

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  amountInSubunits: number;
  keyId: string;
  taskId?: string;
  taskTitle?: string;
  isLiveOrder: boolean;
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  taskId?: string;
  amount?: number;
}

export interface RazorpayVerifyResponse {
  verified: boolean;
  orderId: string;
  paymentId: string;
  amount: number;
  transactionId: string;
  taskId?: string;
  status: string;
}

export const paymentsApi = {
  createRazorpayOrder: async (payload: {
    taskId?: string;
    amount: number;
    currency?: string;
  }): Promise<ApiResponse<RazorpayOrderResponse>> => {
    return apiRequest(() => api.post('/payments/razorpay/create-order', payload));
  },

  verifyRazorpayPayment: async (
    payload: RazorpayVerifyPayload
  ): Promise<ApiResponse<RazorpayVerifyResponse>> => {
    return apiRequest(() => api.post('/payments/razorpay/verify', payload));
  },

  getRazorpayConfig: async (): Promise<ApiResponse<{ keyId: string }>> => {
    return apiRequest(() => api.get('/payments/razorpay/config'));
  },
};

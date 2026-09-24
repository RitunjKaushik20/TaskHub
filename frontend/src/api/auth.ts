import { api, apiRequest } from '../lib/api';
import type { User, ApiResponse } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'WORKER' | 'BUSINESS';
  companyName?: string;
  companyProfile?: {
    companyName: string;
    industryType: string;
    websiteUrl?: string | null;
    companySize: string;
    servicesNeeded: string[];
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.post('/auth/register', payload));
  },

  login: async (payload: LoginPayload): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.post('/auth/login', payload));
  },

  // Part B: OTP email verification.
  sendOtp: async (email: string): Promise<ApiResponse<{ sent: boolean; emailVerified: boolean; mode?: string }>> => {
    return apiRequest(() => api.post('/auth/otp/send', { email }));
  },

  verifyOtp: async (payload: { email: string; code: string }): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.post('/auth/otp/verify', payload));
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return apiRequest(() => api.post('/auth/logout'));
  },

  refresh: async (): Promise<ApiResponse<null>> => {
    return apiRequest(() => api.post('/auth/refresh'));
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.get('/auth/me'));
  },

  // Server-verified Google sign-in: sends the Google ID token produced by the
  // Google Identity Services button; the backend validates it against Google
  // before creating/authenticating any account.
  googleVerify: async (payload: { credential: string; role?: string }): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.post('/auth/google/verify', payload));
  },

  googleConfig: async (): Promise<ApiResponse<{ clientId: string }>> => {
    return apiRequest(() => api.get('/auth/google/config'));
  },

  updateProfile: async (payload: {
    name?: string;
    companyName?: string;
    bio?: string;
    skills?: string;
    avatarUrl?: string;
    companyProfile?: {
      companyName: string;
      industryType: string;
      websiteUrl?: string | null;
      companySize: string;
      servicesNeeded: string[];
    };
  }): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.put('/auth/profile', payload));
  },
};

import { api, apiRequest } from '../lib/api';
import type { User, ApiResponse } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'WORKER' | 'BUSINESS';
  companyName?: string;
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

  logout: async (): Promise<ApiResponse<null>> => {
    return apiRequest(() => api.post('/auth/logout'));
  },

  refresh: async (): Promise<ApiResponse<null>> => {
    return apiRequest(() => api.post('/auth/refresh'));
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.get('/auth/me'));
  },

  googleVerify: async (payload: { email?: string; name?: string; credential?: string; role?: string }): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.post('/auth/google/verify', payload));
  },

  updateProfile: async (payload: {
    name?: string;
    companyName?: string;
    bio?: string;
    skills?: string;
    avatarUrl?: string;
  }): Promise<ApiResponse<User>> => {
    return apiRequest(() => api.put('/auth/profile', payload));
  },
};

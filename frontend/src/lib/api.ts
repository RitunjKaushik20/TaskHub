import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';

const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
export const API_URL = rawApiUrl.endsWith('/api') 
  ? rawApiUrl 
  : `${rawApiUrl.replace(/\/$/, '')}/api`;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token from localStorage if present
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest.url?.includes('/auth/refresh') && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post<ApiResponse>('/auth/refresh');
        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('access_token');
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Clean apiRequest: STRICTLY NO MOCK FALLBACKS
export async function apiRequest<T>(
  requestFn: () => Promise<{ data: ApiResponse<T> }>
): Promise<ApiResponse<T>> {
  try {
    const res = await requestFn();
    return res.data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as ApiResponse<T>;
    }
    return {
      success: false,
      message: err?.message || 'Network error occurred',
      errors: { server: ['Failed to reach backend service'] },
    };
  }
}

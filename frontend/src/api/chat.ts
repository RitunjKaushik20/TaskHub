import { api, apiRequest } from '../lib/api';
import type { ChatMessage, ApiResponse, UserRole } from '../types';

export const chatApi = {
  getTaskMessages: async (taskId: string): Promise<ApiResponse<ChatMessage[]>> => {
    return apiRequest(() => api.get(`/chat/tasks/${taskId}`));
  },

  getMessages: async (taskId: string): Promise<ApiResponse<ChatMessage[]>> => {
    return apiRequest(() => api.get(`/chat/tasks/${taskId}`));
  },

  sendMessage: async (
    taskId: string,
    message: string,
    senderRole: UserRole = 'WORKER',
    fileUrl?: string,
    fileName?: string
  ): Promise<ApiResponse<ChatMessage>> => {
    return apiRequest(() => api.post(`/chat/tasks/${taskId}`, { message, senderRole, fileUrl, fileName }));
  },
};

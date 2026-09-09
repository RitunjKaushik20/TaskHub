import { api, apiRequest } from '../lib/api';
import type { Task, TaskFilters, ApiResponse, TaskDifficulty } from '../types';

export interface CreateTaskPayload {
  title: string;
  description: string;
  instructions: string;
  category: string;
  difficulty: TaskDifficulty;
  reward: number;
  currency?: 'USD' | 'INR';
  workerLimit: number;
  deadline: string;
  requiredSkills: string[];
  proofRequirements: string;
}

export const tasksApi = {
  getTasks: async (filters?: TaskFilters): Promise<ApiResponse<Task[]>> => {
    return apiRequest(() => api.get('/tasks', { params: filters }));
  },

  getTaskById: async (id: string): Promise<ApiResponse<Task>> => {
    return apiRequest(
      () => api.get(`/tasks/${id}`)
    );
  },

  createTask: async (payload: CreateTaskPayload): Promise<ApiResponse<Task>> => {
    return apiRequest(
      () => api.post('/tasks', payload)
    );
  },

  acceptTask: async (taskId: string): Promise<ApiResponse<Task>> => {
    return apiRequest(
      () => api.post(`/tasks/${taskId}/accept`)
    );
  },

  updateTaskStatus: async (taskId: string, status: string): Promise<ApiResponse<Task>> => {
    return apiRequest(
      () => api.patch(`/tasks/${taskId}/status`, { status })
    );
  },

  deleteTask: async (taskId: string): Promise<ApiResponse<{ id: string }>> => {
    return apiRequest(
      () => api.delete(`/tasks/${taskId}`)
    );
  },
};
import { api, apiRequest } from '../lib/api';
import type { ApiResponse } from '../types';

export interface UploadResponse {
  fileUrl: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export const uploadsApi = {
  uploadFile: async (file: File): Promise<ApiResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(() =>
      api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
};

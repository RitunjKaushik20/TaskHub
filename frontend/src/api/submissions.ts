import { api, apiRequest } from '../lib/api';
import type { Submission, ApiResponse } from '../types';

export interface SubmitProofPayload {
  taskId: string;
  proofType: 'FILE' | 'LINK' | 'TEXT' | 'HYBRID';
  proofContent: string;
  fileUrl?: string;
  linkUrl?: string;
}

export interface ReviewSubmissionPayload {
  status: 'APPROVED' | 'REJECTED';
  qualityScore?: number;
  feedback?: string;
  rejectionReason?: string;
}

export const submissionsApi = {
  submitProof: async (payload: SubmitProofPayload): Promise<ApiResponse<Submission>> => {
    return apiRequest(() => api.post('/submissions', payload));
  },

  getSubmissions: async (params?: { taskId?: string; workerId?: string }): Promise<ApiResponse<Submission[]>> => {
    return apiRequest(() => api.get('/submissions', { params }));
  },

  reviewSubmission: async (submissionId: string, payload: ReviewSubmissionPayload): Promise<ApiResponse<Submission>> => {
    return apiRequest(() => api.post(`/submissions/${submissionId}/review`, payload));
  },

  uploadProofFile: async (file: File): Promise<ApiResponse<{ fileUrl: string; filename: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(() =>
      api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },
};

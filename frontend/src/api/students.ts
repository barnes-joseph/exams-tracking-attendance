import apiClient from './client';
import type { Student, PaginatedResponse } from '../types';

export const studentsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    programId?: string;
    departmentId?: string;
    level?: number;
    status?: string;
  }): Promise<PaginatedResponse<Student>> => {
    const response = await apiClient.get<Student[] | PaginatedResponse<Student>>('/students', { params });
    // Handle both array and paginated response formats
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1,
      };
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },

  create: async (data: Partial<Student>) => {
    const response = await apiClient.post<Student>('/students', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Student>) => {
    const response = await apiClient.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/students/${id}`);
  },

  updatePhoto: async (id: string, photo: File) => {
    const formData = new FormData();
    formData.append('photo', photo);
    const response = await apiClient.patch<Student>(`/students/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  bulkImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ imported: number; errors: string[] }>('/students/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getExamSchedule: async (id: string) => {
    const response = await apiClient.get(`/students/${id}/exam-schedule`);
    return response.data;
  },

  getAttendanceHistory: async (id: string) => {
    const response = await apiClient.get(`/students/${id}/attendance-history`);
    return response.data;
  },
};

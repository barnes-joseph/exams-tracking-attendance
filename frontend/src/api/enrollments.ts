import apiClient from './client';
import type { Enrollment, PaginatedResponse } from '../types';

export const enrollmentsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    courseId?: string;
    academicYear?: string;
    semester?: number;
    status?: string;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Enrollment>>('/enrollments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Enrollment>(`/enrollments/${id}`);
    return response.data;
  },

  create: async (data: {
    studentId: string;
    courseId: string;
    academicYear: string;
    semester: 1 | 2;
  }) => {
    const response = await apiClient.post<Enrollment>('/enrollments', data);
    return response.data;
  },

  bulkEnroll: async (data: {
    courseId: string;
    studentIds: string[];
    academicYear: string;
    semester: 1 | 2;
  }) => {
    const response = await apiClient.post<{ enrolled: number; errors: string[] }>('/enrollments/bulk-enroll', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Enrollment>) => {
    const response = await apiClient.put<Enrollment>(`/enrollments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/enrollments/${id}`);
  },
};

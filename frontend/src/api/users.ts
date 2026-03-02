import apiClient from './client';
import type { User, PaginatedResponse } from '../types';

export const usersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; role?: string }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<User[] | PaginatedResponse<User>>('/users', { params });
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
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: Partial<User> & { password: string }) => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>) => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}`);
  },

  resetPassword: async (id: string, newPassword: string) => {
    await apiClient.post(`/users/${id}/reset-password`, { newPassword });
  },
};

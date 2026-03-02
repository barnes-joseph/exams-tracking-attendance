import apiClient from './client';
import type { User, PaginatedResponse } from '../types';

export const usersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users', { params });
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
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}`);
  },

  resetPassword: async (id: string, newPassword: string) => {
    await apiClient.post(`/users/${id}/reset-password`, { newPassword });
  },
};

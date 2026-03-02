import apiClient from './client';
import type { College, Department, Program, Course, PaginatedResponse } from '../types';

// Colleges API
export const collegesApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<College>> => {
    const response = await apiClient.get<College[] | PaginatedResponse<College>>('/colleges', { params });
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
    const response = await apiClient.get<College>(`/colleges/${id}`);
    return response.data;
  },

  create: async (data: Partial<College>) => {
    const response = await apiClient.post<College>('/colleges', data);
    return response.data;
  },

  update: async (id: string, data: Partial<College>) => {
    const response = await apiClient.patch<College>(`/colleges/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/colleges/${id}`);
  },
};

// Departments API
export const departmentsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; collegeId?: string }): Promise<PaginatedResponse<Department>> => {
    const response = await apiClient.get<Department[] | PaginatedResponse<Department>>('/departments', { params });
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
    const response = await apiClient.get<Department>(`/departments/${id}`);
    return response.data;
  },

  create: async (data: Partial<Department>) => {
    const response = await apiClient.post<Department>('/departments', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Department>) => {
    const response = await apiClient.patch<Department>(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/departments/${id}`);
  },
};

// Programs API
export const programsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; departmentId?: string }): Promise<PaginatedResponse<Program>> => {
    const response = await apiClient.get<Program[] | PaginatedResponse<Program>>('/programs', { params });
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
    const response = await apiClient.get<Program>(`/programs/${id}`);
    return response.data;
  },

  create: async (data: Partial<Program>) => {
    const response = await apiClient.post<Program>('/programs', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Program>) => {
    const response = await apiClient.patch<Program>(`/programs/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/programs/${id}`);
  },
};

// Courses API
export const coursesApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; departmentId?: string; programId?: string }): Promise<PaginatedResponse<Course>> => {
    const response = await apiClient.get<Course[] | PaginatedResponse<Course>>('/courses', { params });
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
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  },

  create: async (data: Partial<Course>) => {
    const response = await apiClient.post<Course>('/courses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Course>) => {
    const response = await apiClient.patch<Course>(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/courses/${id}`);
  },
};

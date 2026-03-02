import apiClient from './client';
import type { Exam, ExamSchedule, ExamAssignment, PaginatedResponse } from '../types';

// Exam Schedules API
export const examSchedulesApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; academicYear?: string }): Promise<PaginatedResponse<ExamSchedule>> => {
    const response = await apiClient.get<ExamSchedule[] | PaginatedResponse<ExamSchedule>>('/exam-schedules', { params });
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
    const response = await apiClient.get<ExamSchedule>(`/exam-schedules/${id}`);
    return response.data;
  },

  create: async (data: Partial<ExamSchedule>) => {
    const response = await apiClient.post<ExamSchedule>('/exam-schedules', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ExamSchedule>) => {
    const response = await apiClient.patch<ExamSchedule>(`/exam-schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/exam-schedules/${id}`);
  },

  publish: async (id: string) => {
    const response = await apiClient.patch<ExamSchedule>(`/exam-schedules/${id}/publish`);
    return response.data;
  },

  generateQrCodes: async (id: string) => {
    const response = await apiClient.post(`/exam-schedules/${id}/generate-qr-codes`);
    return response.data;
  },

  sendQrCodes: async (id: string) => {
    const response = await apiClient.post(`/exam-schedules/${id}/send-qr-codes`);
    return response.data;
  },
};

// Exams API
export const examsApi = {
  getAll: async (params?: { page?: number; limit?: number; examScheduleId?: string; courseId?: string; status?: string; date?: string }): Promise<PaginatedResponse<Exam>> => {
    const response = await apiClient.get<Exam[] | PaginatedResponse<Exam>>('/exams', { params });
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
    const response = await apiClient.get<Exam>(`/exams/${id}`);
    return response.data;
  },

  create: async (data: Partial<Exam>) => {
    const response = await apiClient.post<Exam>('/exams', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Exam>) => {
    const response = await apiClient.patch<Exam>(`/exams/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/exams/${id}`);
  },

  autoAssignStudents: async (id: string) => {
    const response = await apiClient.post(`/exams/${id}/auto-assign-students`);
    return response.data;
  },

  getAssignments: async (id: string) => {
    const response = await apiClient.get<ExamAssignment[]>(`/exams/${id}/assignments`);
    return response.data;
  },

  getAttendance: async (id: string) => {
    const response = await apiClient.get(`/exams/${id}/attendance`);
    return response.data;
  },

  getMyAssignmentsToday: async () => {
    const response = await apiClient.get<Exam[]>('/exams/my-assignments/today');
    return response.data;
  },
};

// Exam Assignments API
export const examAssignmentsApi = {
  getAll: async (params?: { examId?: string; studentId?: string; status?: string }): Promise<PaginatedResponse<ExamAssignment>> => {
    const response = await apiClient.get<ExamAssignment[] | PaginatedResponse<ExamAssignment>>('/exam-assignments', { params });
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

  create: async (data: { examId: string; studentId: string; seatNumber?: string; room?: string }) => {
    const response = await apiClient.post<ExamAssignment>('/exam-assignments', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ExamAssignment>) => {
    const response = await apiClient.patch<ExamAssignment>(`/exam-assignments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/exam-assignments/${id}`);
  },
};

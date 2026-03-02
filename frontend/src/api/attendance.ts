import apiClient from './client';
import type { Attendance, Student } from '../types';

interface ScanQrResponse {
  success: boolean;
  attendance: Attendance;
  student: Student;
  message: string;
}

export const attendanceApi = {
  scanQr: async (token: string, _examId: string) => {
    const response = await apiClient.post<ScanQrResponse>('/attendance/scan-qr', { token });
    return response.data;
  },

  manualMark: async (data: {
    examId: string;
    indexNumber: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    remarks?: string;
  }) => {
    const response = await apiClient.post<Attendance>('/attendance/manual-mark', data);
    return response.data;
  },

  flag: async (id: string, reason: string) => {
    const response = await apiClient.post<Attendance>(`/attendance/${id}/flag`, { reason });
    return response.data;
  },

  resolve: async (id: string, resolution: string) => {
    const response = await apiClient.post<Attendance>(`/attendance/${id}/resolve`, { resolution });
    return response.data;
  },

  getByExam: async (examId: string) => {
    const response = await apiClient.get<Attendance[]>(`/attendance/exam/${examId}`);
    return response.data;
  },

  getMyHistory: async () => {
    const response = await apiClient.get<Attendance[]>('/attendance/my-history');
    return response.data;
  },
};

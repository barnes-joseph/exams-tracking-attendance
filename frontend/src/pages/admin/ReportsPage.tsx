import { useState, useEffect } from 'react';
import { examSchedulesApi } from '../../api/exams';
import apiClient from '../../api/client';
import type { ExamSchedule } from '../../types';
import { Button, Select, Alert, Badge } from '../../components/common';

interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  todayExams: number;
  activeSchedules: number;
  totalAttendance: number;
  averageAttendanceRate: number;
}

interface AttendanceReport {
  examId: string;
  examCode: string;
  examTitle: string;
  courseCode: string;
  examDate: string;
  totalAssigned: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

export function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [statsRes, schedulesRes] = await Promise.all([
          apiClient.get('/reports/admin-dashboard'),
          examSchedulesApi.getAll({ limit: 100 }),
        ]);
        setStats(statsRes.data);
        setSchedules(schedulesRes.data);
      } catch (err) {
        setError('Failed to fetch report data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchAttendanceReport = async () => {
    if (!selectedScheduleId) return;
    setIsReportLoading(true);
    try {
      const response = await apiClient.get(`/reports/exam-schedule/${selectedScheduleId}/attendance`);
      setAttendanceReport(response.data);
    } catch (err) {
      setError('Failed to fetch attendance report');
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    if (selectedScheduleId) {
      fetchAttendanceReport();
    } else {
      setAttendanceReport([]);
    }
  }, [selectedScheduleId]);

  const handleExportCSV = async () => {
    if (!selectedScheduleId) return;
    try {
      const response = await apiClient.get(`/reports/exam-schedule/${selectedScheduleId}/attendance`, {
        params: { format: 'csv' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${selectedScheduleId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export report');
    }
  };

  const handleExportPDF = async () => {
    if (!selectedScheduleId) return;
    try {
      const response = await apiClient.get(`/reports/exam-schedule/${selectedScheduleId}/attendance`, {
        params: { format: 'pdf' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${selectedScheduleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Reports</h1>

      {error && (
        <div className="mb-4">
          <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {/* Overview Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-semibold">{stats?.totalStudents || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Exams</p>
            <p className="text-2xl font-semibold">{stats?.totalExams || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Today's Exams</p>
            <p className="text-2xl font-semibold">{stats?.todayExams || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Active Schedules</p>
            <p className="text-2xl font-semibold">{stats?.activeSchedules || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Attendance Records</p>
            <p className="text-2xl font-semibold">{stats?.totalAttendance || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Avg Attendance Rate</p>
            <p className="text-2xl font-semibold">{(stats?.averageAttendanceRate || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Attendance Report */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Attendance Report</h2>
          <div className="flex items-center space-x-4">
            <div className="w-64">
              <Select
                options={[
                  { value: '', label: 'Select Exam Schedule' },
                  ...(schedules || []).map(s => ({ value: s._id, label: s.name })),
                ]}
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
              />
            </div>
            {selectedScheduleId && (
              <>
                <Button variant="outline" onClick={handleExportCSV}>
                  Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportPDF}>
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {isReportLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : selectedScheduleId ? (
          attendanceReport.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Late
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(attendanceReport || []).map((report) => (
                    <tr key={report.examId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.examTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.courseCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.examDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.totalAssigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="green">{report.present}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="red">{report.absent}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="yellow">{report.late}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={report.attendanceRate >= 80 ? 'green' : report.attendanceRate >= 60 ? 'yellow' : 'red'}>
                          {report.attendanceRate.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No attendance data found for this schedule.</p>
          )
        ) : (
          <p className="text-center text-gray-500 py-8">Select an exam schedule to view the attendance report.</p>
        )}
      </div>

      {/* Absentee List */}
      {selectedScheduleId && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Quick Links</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <a
              href={`/api/reports/absentee-list/${selectedScheduleId}?format=csv`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100"
            >
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-3 text-sm font-medium text-red-900">Download Absentee List (CSV)</span>
            </a>
            <a
              href={`/api/reports/absentee-list/${selectedScheduleId}?format=pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100"
            >
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="ml-3 text-sm font-medium text-red-900">Download Absentee List (PDF)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

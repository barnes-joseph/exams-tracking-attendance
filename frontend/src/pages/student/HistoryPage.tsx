import { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendance';
import type { Attendance, Exam } from '../../types';
import { Table, Badge, Alert, getStatusVariant } from '../../components/common';

interface AttendanceWithExam extends Attendance {
  examId: Exam;
}

export function HistoryPage() {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceWithExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await attendanceApi.getMyHistory();
        setAttendanceHistory(data as AttendanceWithExam[]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch attendance history');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const columns = [
    {
      key: 'examDate',
      header: 'Date',
      render: (att: AttendanceWithExam) =>
        new Date((att.examId as Exam).examDate).toLocaleDateString(),
    },
    {
      key: 'examTitle',
      header: 'Exam',
      render: (att: AttendanceWithExam) => (att.examId as Exam).title,
    },
    {
      key: 'courseCode',
      header: 'Course',
      render: (att: AttendanceWithExam) => (att.examId as Exam).courseCode || '-',
    },
    {
      key: 'checkInTime',
      header: 'Check-in',
      render: (att: AttendanceWithExam) =>
        att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString() : '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (att: AttendanceWithExam) => (
        <Badge variant={getStatusVariant(att.status)}>{att.status}</Badge>
      ),
    },
    {
      key: 'verified',
      header: 'Verified',
      render: (att: AttendanceWithExam) => (
        <Badge variant={att.studentVerified ? 'green' : 'gray'} size="sm">
          {att.studentVerified ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ];

  // Calculate stats
  const stats = {
    total: attendanceHistory.length,
    present: attendanceHistory.filter((a) => a.status === 'PRESENT').length,
    absent: attendanceHistory.filter((a) => a.status === 'ABSENT').length,
    late: attendanceHistory.filter((a) => a.status === 'LATE').length,
  };

  const attendanceRate =
    stats.total > 0
      ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1)
      : '0';

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Attendance History</h1>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Exams</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">Present</p>
          <p className="text-2xl font-semibold text-green-700">{stats.present}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-600">Late</p>
          <p className="text-2xl font-semibold text-yellow-700">{stats.late}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">Absent</p>
          <p className="text-2xl font-semibold text-red-700">{stats.absent}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-blue-600">Attendance Rate</p>
          <p className="text-2xl font-semibold text-blue-700">{attendanceRate}%</p>
        </div>
      </div>

      {/* Attendance table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={attendanceHistory}
          keyExtractor={(att) => att._id}
          isLoading={isLoading}
          emptyMessage="No attendance records found"
        />
      </div>
    </div>
  );
}

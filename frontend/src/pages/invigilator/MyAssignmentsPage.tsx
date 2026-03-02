import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import type { Exam } from '../../types';
import { Select, Table, Badge, Alert, getStatusVariant } from '../../components/common';

export function MyAssignmentsPage() {
  const [assignments, setAssignments] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('upcoming');

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/exams/my-assignments', {
          params: {
            status: filterStatus || undefined,
            period: filterPeriod || undefined,
          },
        });
        setAssignments(response.data);
      } catch (err) {
        setError('Failed to fetch assignments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, [filterStatus, filterPeriod]);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const periodOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'all', label: 'All Time' },
  ];

  const columns = [
    {
      key: 'examDate',
      header: 'Date',
      render: (exam: Exam) => new Date(exam.examDate).toLocaleDateString(),
    },
    { key: 'examCode', header: 'Code' },
    { key: 'title', header: 'Title' },
    {
      key: 'course',
      header: 'Course',
      render: (exam: Exam) => exam.courseCode || 'N/A',
    },
    {
      key: 'time',
      header: 'Time',
      render: (exam: Exam) => `${exam.startTime} - ${exam.endTime}`,
    },
    {
      key: 'venue',
      header: 'Venue',
      render: (exam: Exam) => exam.venue?.name || 'TBA',
    },
    {
      key: 'students',
      header: 'Attendance',
      render: (exam: Exam) => (
        <span>
          <span className="text-indigo-600 font-medium">{exam.presentCount}</span>
          <span className="text-gray-400"> / </span>
          <span>{exam.totalAssignedStudents}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (exam: Exam) => (
        <Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (exam: Exam) => (
        <div className="flex space-x-2">
          {exam.status === 'IN_PROGRESS' && (
            <Link
              to={`/invigilator/scanner/${exam._id}`}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Scan
            </Link>
          )}
          <Link
            to={`/invigilator/attendance/${exam._id}`}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Assignments</h1>

      {error && (
        <div className="mb-4">
          <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <div className="w-48">
          <Select
            options={periodOptions}
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={assignments}
          keyExtractor={(exam) => exam._id}
          isLoading={isLoading}
          emptyMessage="No assignments found"
        />
      </div>

      {/* Stats Summary */}
      {!isLoading && assignments.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Assignments</p>
            <p className="text-2xl font-semibold">{assignments.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-600">Scheduled</p>
            <p className="text-2xl font-semibold text-blue-700">
              {assignments.filter(a => a.status === 'SCHEDULED').length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-600">In Progress</p>
            <p className="text-2xl font-semibold text-yellow-700">
              {assignments.filter(a => a.status === 'IN_PROGRESS').length}
            </p>
          </div>
          <div className="bg-indigo-50 rounded-lg shadow p-4">
            <p className="text-sm text-indigo-600">Completed</p>
            <p className="text-2xl font-semibold text-indigo-700">
              {assignments.filter(a => a.status === 'COMPLETED').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

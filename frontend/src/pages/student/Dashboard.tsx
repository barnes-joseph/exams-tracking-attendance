import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { Badge, getStatusVariant } from '../../components/common';
import type { Exam } from '../../types';

interface UpcomingExam extends Exam {
  assignmentId: string;
  hasQrCode: boolean;
}

export function StudentDashboard() {
  const { user } = useAuthStore();
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const studentUser = user && 'indexNumber' in user ? user : null;

  useEffect(() => {
    const fetchUpcomingExams = async () => {
      try {
        const response = await apiClient.get('/students/me/upcoming-exams');
        setUpcomingExams(response.data);
      } catch (error) {
        console.error('Failed to fetch upcoming exams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcomingExams();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {studentUser?.firstName}!
        </h1>
        <p className="mt-1 text-gray-500">
          Index Number: {studentUser?.indexNumber}
        </p>
      </div>

      {/* Upcoming exams */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Exams</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your scheduled exams and QR codes
          </p>
        </div>

        {upcomingExams.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2">No upcoming exams found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {(upcomingExams || []).map((exam) => (
              <li key={exam._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {exam.title}
                      </h3>
                      <Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{exam.courseCode || 'N/A'}</span>
                      <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                      <span>{exam.startTime} - {exam.endTime}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Venue: {exam.venue?.name || 'TBA'}
                    </div>
                  </div>
                  <div>
                    {exam.hasQrCode ? (
                      <Link
                        to={`/student/qr/${exam._id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        View QR Code
                      </Link>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded-md">
                        QR code not yet available
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/student/my-exams"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">All My Exams</h3>
              <p className="text-sm text-gray-500">View your complete exam schedule</p>
            </div>
          </div>
        </Link>

        <Link
          to="/student/history"
          className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
              <p className="text-sm text-gray-500">View your past exam attendance</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

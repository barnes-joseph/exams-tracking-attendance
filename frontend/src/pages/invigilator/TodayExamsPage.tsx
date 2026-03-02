import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examsApi } from '../../api/exams';
import type { Exam } from '../../types';
import { Badge, getStatusVariant } from '../../components/common';

export function TodayExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodayExams = async () => {
      try {
        const data = await examsApi.getMyAssignmentsToday();
        setExams(data);
      } catch (err) {
        toast.error('Failed to fetch today\'s exams');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTodayExams();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const upcomingExams = exams.filter(e => e.status === 'SCHEDULED');
  const ongoingExams = exams.filter(e => e.status === 'IN_PROGRESS');
  const completedExams = exams.filter(e => e.status === 'COMPLETED');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Today's Exams</h1>
{exams.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No exams today</h3>
          <p className="mt-2 text-gray-500">You don't have any exams assigned for today.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ongoing Exams */}
          {ongoingExams.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                In Progress ({ongoingExams.length})
              </h2>
              <div className="grid gap-4">
                {(ongoingExams || []).map((exam) => (
                  <ExamCard key={exam._id} exam={exam} isOngoing />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Exams */}
          {upcomingExams.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3">
                Upcoming ({upcomingExams.length})
              </h2>
              <div className="grid gap-4">
                {(upcomingExams || []).map((exam) => (
                  <ExamCard key={exam._id} exam={exam} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Exams */}
          {completedExams.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-3 text-gray-500">
                Completed ({completedExams.length})
              </h2>
              <div className="grid gap-4">
                {(completedExams || []).map((exam) => (
                  <ExamCard key={exam._id} exam={exam} isCompleted />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam, isOngoing = false, isCompleted = false }: { exam: Exam; isOngoing?: boolean; isCompleted?: boolean }) {
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${isCompleted ? 'opacity-75' : ''} ${isOngoing ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">{exam.title}</h3>
            <Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Course:</span> {exam.courseCode || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Time:</span> {exam.startTime} - {exam.endTime}
            </div>
            <div>
              <span className="font-medium">Venue:</span> {exam.venue?.name || 'TBA'}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {exam.duration} min
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-4">
            <div className="flex items-center text-sm">
              <span className="text-indigo-600 font-medium">{exam.presentCount}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-600">{exam.totalAssignedStudents}</span>
              <span className="text-gray-400 ml-1">present</span>
            </div>
            {exam.absentCount > 0 && (
              <div className="text-sm text-red-600">
                {exam.absentCount} absent
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          {isOngoing && (
            <Link
              to={`/invigilator/scanner/${exam._id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan QR
            </Link>
          )}
          <Link
            to={`/invigilator/attendance/${exam._id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View Attendance
          </Link>
        </div>
      </div>
    </div>
  );
}

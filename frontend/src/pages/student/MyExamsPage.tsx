import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import type { Exam } from '../../types';
import { Select, Badge, getStatusVariant } from '../../components/common';

interface ExamWithAssignment extends Exam {
  assignmentId: string;
  hasQrCode: boolean;
  seatNumber?: string;
  room?: string;
}

export function MyExamsPage() {
  const [exams, setExams] = useState<ExamWithAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('upcoming');

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/students/me/exams', {
          params: { period: filterPeriod },
        });
        setExams(response.data);
      } catch (err) {
        toast.error('Failed to fetch exams');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, [filterPeriod]);

  const periodOptions = [
    { value: 'upcoming', label: 'Upcoming Exams' },
    { value: 'past', label: 'Past Exams' },
    { value: 'all', label: 'All Exams' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Exams</h1>
        <div className="w-48">
          <Select
            options={periodOptions}
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          />
        </div>
      </div>
{exams.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No exams found</h3>
          <p className="mt-2 text-gray-500">
            {filterPeriod === 'upcoming'
              ? "You don't have any upcoming exams scheduled."
              : filterPeriod === 'past'
              ? "You don't have any past exams."
              : "You don't have any exams."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {(exams || []).map((exam) => (
            <div key={exam._id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{exam.title}</h3>
                      <Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{exam.courseCode}</p>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(exam.examDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <span className="ml-2 font-medium">
                          {exam.startTime} - {exam.endTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Venue:</span>
                        <span className="ml-2 font-medium">{exam.venue?.name || 'TBA'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium">{exam.duration} min</span>
                      </div>
                    </div>

                    {(exam.seatNumber || exam.room) && (
                      <div className="mt-3 flex items-center space-x-4 text-sm">
                        {exam.seatNumber && (
                          <div className="bg-blue-50 px-3 py-1 rounded">
                            <span className="text-blue-600">Seat:</span>
                            <span className="ml-1 font-medium text-blue-800">{exam.seatNumber}</span>
                          </div>
                        )}
                        {exam.room && (
                          <div className="bg-gray-100 px-3 py-1 rounded">
                            <span className="text-gray-600">Room:</span>
                            <span className="ml-1 font-medium text-gray-800">{exam.room}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
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
                        QR not available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Make sure to download or print your QR code before the exam</li>
                <li>Arrive at the venue at least 15 minutes before the exam starts</li>
                <li>Present your QR code to the invigilator for attendance verification</li>
                <li>Contact your department if you see any incorrect exam assignments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

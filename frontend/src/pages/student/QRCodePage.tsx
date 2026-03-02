import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import apiClient from '../../api/client';
import type { Exam } from '../../types';
import { Button, Badge, getStatusVariant } from '../../components/common';

interface ExamAssignmentWithQR {
  _id: string;
  exam: Exam;
  qrToken: string;
  seatNumber?: string;
  room?: string;
}

export function QRCodePage() {
  const { examId } = useParams<{ examId: string }>();
  const [assignment, setAssignment] = useState<ExamAssignmentWithQR | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!examId) return;
      try {
        const response = await apiClient.get<ExamAssignmentWithQR>(
          `/students/me/exam-assignment/${examId}`
        );
        setAssignment(response.data);

        // Generate QR code
        if (response.data.qrToken) {
          const dataUrl = await QRCode.toDataURL(response.data.qrToken, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          setQrDataUrl(dataUrl);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to fetch exam assignment');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignment();
  }, [examId]);

  const handleDownload = () => {
    if (!qrDataUrl || !assignment) return;
    const link = document.createElement('a');
    link.download = `qr-code-${assignment.exam.examCode}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !assignment) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Exam QR Code - ${assignment.exam.examCode}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
            }
            .header {
              margin-bottom: 20px;
            }
            .exam-info {
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .instructions {
              margin-top: 20px;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Exam Attendance QR Code</h1>
          </div>
          <div class="exam-info">
            <h2>${assignment.exam.title}</h2>
            <p><strong>Course:</strong> ${assignment.exam.courseCode}</p>
            <p><strong>Date:</strong> ${new Date(assignment.exam.examDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${assignment.exam.startTime} - ${assignment.exam.endTime}</p>
            <p><strong>Venue:</strong> ${assignment.exam.venue?.name || 'TBA'}</p>
            ${assignment.seatNumber ? `<p><strong>Seat:</strong> ${assignment.seatNumber}</p>` : ''}
          </div>
          <div class="qr-code">
            <img src="${qrDataUrl}" alt="QR Code" />
          </div>
          <div class="instructions">
            <p>Present this QR code to the invigilator for attendance verification.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">Exam assignment not found</p>
        <Link to="/student" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const exam = assignment.exam;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/student" className="text-blue-600 hover:underline text-sm">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 text-white">
          <h1 className="text-xl font-semibold">{exam.title}</h1>
          <p className="text-blue-100">{exam.courseCode}</p>
        </div>

        {/* Exam details */}
        <div className="px-6 py-4 border-b">
          <div className="grid grid-cols-2 gap-4 text-sm">
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
              <span className="text-gray-500">Status:</span>
              <span className="ml-2">
                <Badge variant={getStatusVariant(exam.status)}>{exam.status}</Badge>
              </span>
            </div>
            {assignment.seatNumber && (
              <div>
                <span className="text-gray-500">Seat Number:</span>
                <span className="ml-2 font-medium">{assignment.seatNumber}</span>
              </div>
            )}
            {assignment.room && (
              <div>
                <span className="text-gray-500">Room:</span>
                <span className="ml-2 font-medium">{assignment.room}</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="px-6 py-8 text-center">
          {qrDataUrl ? (
            <>
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <p className="mt-4 text-sm text-gray-500">
                Show this QR code to the invigilator for attendance verification
              </p>
            </>
          ) : (
            <div className="text-gray-500">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="mt-2">QR code not yet available</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {qrDataUrl && (
          <div className="px-6 py-4 bg-gray-50 flex justify-center space-x-4">
            <Button variant="outline" onClick={handleDownload}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </Button>
            <Button onClick={handlePrint}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

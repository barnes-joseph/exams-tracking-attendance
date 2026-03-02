import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceApi } from '../../api/attendance';
import { examsApi } from '../../api/exams';
import type { Exam, Student, Attendance } from '../../types';
import { Button, Modal, Badge, getStatusVariant } from '../../components/common';

interface ScanResult {
  success: boolean;
  student: Student | null;
  attendance: Attendance | null;
  message: string;
}

export function ScannerPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      try {
        const data = await examsApi.getById(examId);
        setExam(data);
      } catch {
        toast.error('Failed to fetch exam details');
      }
    };
    fetchExam();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );

      setIsScanning(true);
    } catch {
      toast.error('Failed to start camera. Please check camera permissions.');
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop();
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    // Pause scanning while processing
    await stopScanning();
    setIsProcessing(true);

    try {
      if (!examId) return;
      const result = await attendanceApi.scanQr(decodedText, examId);
      setScanResult(result);
      setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
      setIsVerificationModalOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process QR code');
      // Resume scanning after error
      setTimeout(() => {
        startScanning();
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const onScanFailure = () => {
    // QR code not detected, continue scanning
  };

  const handleVerificationComplete = () => {
    setIsVerificationModalOpen(false);
    setScanResult(null);
    // Resume scanning
    startScanning();
  };

  const handleManualEntry = () => {
    navigate(`/invigilator/attendance/${examId}`);
  };

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">QR Scanner</h1>
          <p className="text-gray-500">{exam.title}</p>
          <p className="text-sm text-gray-400">
            {exam.courseCode} | {exam.venue?.name || 'TBA'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={getStatusVariant(exam.status)} size="md">
            {exam.status}
          </Badge>
          <span className="text-sm text-gray-600">
            {exam.presentCount} / {exam.totalAssignedStudents} present
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h2>

          <div className="relative">
            <div
              id="qr-reader"
              className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden"
            />

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
                  <p className="mt-4 text-white font-medium">Processing QR Code...</p>
                  <p className="text-sm text-gray-300">Verifying student attendance</p>
                </div>
              </div>
            )}

            {!isScanning && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex space-x-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1">
                Start Scanning
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="danger" className="flex-1">
                Stop Scanning
              </Button>
            )}
            <Button variant="outline" onClick={handleManualEntry}>
              Manual Entry
            </Button>
          </div>
        </div>

        {/* Recent scans */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Scans</h2>

          {recentScans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No scans yet</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {(recentScans || []).map((scan, index) => (
                <li
                  key={index}
                  className={`p-3 rounded-lg ${
                    scan.success ? 'bg-indigo-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      {scan.student ? (
                        <>
                          <p className="font-medium text-gray-900">
                            {scan.student.firstName} {scan.student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{scan.student.indexNumber}</p>
                        </>
                      ) : (
                        <p className="font-medium text-gray-900">Unknown Student</p>
                      )}
                    </div>
                    <Badge variant={scan.success ? 'green' : 'red'}>
                      {scan.success ? 'Verified' : 'Failed'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      <Modal
        isOpen={isVerificationModalOpen}
        onClose={handleVerificationComplete}
        title="Student Verification"
        size="md"
      >
        {scanResult && (
          <div className="text-center">
            {scanResult.student ? (
              <>
                {/* Student photo */}
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                  {scanResult.student.photo ? (
                    <img
                      src={scanResult.student.photo}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Student info */}
                <h3 className="text-xl font-semibold text-gray-900">
                  {scanResult.student.firstName} {scanResult.student.lastName}
                </h3>
                <p className="text-gray-500">{scanResult.student.indexNumber}</p>
              </>
            ) : (
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
            )}

            {/* Status */}
            <div className="mt-4">
              <Badge
                variant={scanResult.success ? 'green' : 'red'}
                size="md"
              >
                {scanResult.message}
              </Badge>
            </div>

            {scanResult.attendance && scanResult.attendance.checkInTime && (
              <p className="mt-2 text-sm text-gray-500">
                Check-in time: {new Date(scanResult.attendance.checkInTime).toLocaleTimeString()}
              </p>
            )}

            <div className="mt-6">
              <Button onClick={handleVerificationComplete} className="w-full">
                Continue Scanning
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

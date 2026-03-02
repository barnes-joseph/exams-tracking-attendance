import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attendanceApi } from '../../api/attendance';
import { examsApi } from '../../api/exams';
import type { Exam, Attendance, Student } from '../../types';
import { Button, Input, Select, Table, Modal, Badge, Alert, getStatusVariant } from '../../components/common';

interface AttendanceWithStudent extends Attendance {
  studentId: Student;
}

export function AttendancePage() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [isManualMarkModalOpen, setIsManualMarkModalOpen] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceWithStudent | null>(null);

  const [manualMarkData, setManualMarkData] = useState({
    indexNumber: '',
    status: 'PRESENT' as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
    remarks: '',
  });

  const [flagReason, setFlagReason] = useState('');

  const fetchData = async () => {
    if (!examId) return;
    setIsLoading(true);
    try {
      const [examData, attendanceData] = await Promise.all([
        examsApi.getById(examId),
        attendanceApi.getByExam(examId),
      ]);
      setExam(examData);
      setAttendanceList(attendanceData as AttendanceWithStudent[]);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  const handleManualMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId) return;
    try {
      await attendanceApi.manualMark({
        examId,
        ...manualMarkData,
      });
      setSuccess('Attendance marked successfully');
      setIsManualMarkModalOpen(false);
      setManualMarkData({ indexNumber: '', status: 'PRESENT', remarks: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendance) return;
    try {
      await attendanceApi.flag(selectedAttendance._id, flagReason);
      setSuccess('Attendance flagged successfully');
      setIsFlagModalOpen(false);
      setFlagReason('');
      setSelectedAttendance(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to flag attendance');
    }
  };

  const openFlagModal = (attendance: AttendanceWithStudent) => {
    setSelectedAttendance(attendance);
    setIsFlagModalOpen(true);
  };

  const filteredAttendance = attendanceList.filter((att) => {
    const student = att.studentId as Student;
    const matchesSearch =
      !search ||
      student.indexNumber.toLowerCase().includes(search.toLowerCase()) ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || att.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PRESENT', label: 'Present' },
    { value: 'ABSENT', label: 'Absent' },
    { value: 'LATE', label: 'Late' },
    { value: 'EXCUSED', label: 'Excused' },
  ];

  const columns = [
    {
      key: 'indexNumber',
      header: 'Index Number',
      render: (att: AttendanceWithStudent) => (att.studentId as Student).indexNumber,
    },
    {
      key: 'name',
      header: 'Name',
      render: (att: AttendanceWithStudent) => {
        const student = att.studentId as Student;
        return `${student.firstName} ${student.lastName}`;
      },
    },
    {
      key: 'checkInTime',
      header: 'Check-in Time',
      render: (att: AttendanceWithStudent) =>
        att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString() : '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (att: AttendanceWithStudent) => (
        <Badge variant={getStatusVariant(att.status)}>{att.status}</Badge>
      ),
    },
    {
      key: 'verificationMethod',
      header: 'Method',
      render: (att: AttendanceWithStudent) => (
        <Badge variant="gray" size="sm">
          {att.verificationMethod}
        </Badge>
      ),
    },
    {
      key: 'flag',
      header: 'Flag',
      render: (att: AttendanceWithStudent) =>
        att.isFlagged ? (
          <Badge variant="red" size="sm">
            {att.flagStatus}
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (att: AttendanceWithStudent) => (
        <div className="flex space-x-2">
          {!att.isFlagged && (
            <Button size="sm" variant="outline" onClick={() => openFlagModal(att)}>
              Flag
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!exam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const stats = {
    total: attendanceList.length,
    present: attendanceList.filter((a) => a.status === 'PRESENT').length,
    absent: attendanceList.filter((a) => a.status === 'ABSENT').length,
    late: attendanceList.filter((a) => a.status === 'LATE').length,
    flagged: attendanceList.filter((a) => a.isFlagged).length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Sheet</h1>
          <p className="text-gray-500">{exam.title}</p>
          <p className="text-sm text-gray-400">
            {exam.courseCode} | {exam.venue?.name || 'TBA'} | {exam.startTime} - {exam.endTime}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link to={`/invigilator/scanner/${examId}`}>
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan QR
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsManualMarkModalOpen(true)}>
            Manual Entry
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">Present</p>
          <p className="text-2xl font-semibold text-green-700">{stats.present}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">Absent</p>
          <p className="text-2xl font-semibold text-red-700">{stats.absent}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-600">Late</p>
          <p className="text-2xl font-semibold text-yellow-700">{stats.late}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4">
          <p className="text-sm text-orange-600">Flagged</p>
          <p className="text-2xl font-semibold text-orange-700">{stats.flagged}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name or index number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Attendance table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={filteredAttendance}
          keyExtractor={(att) => att._id}
          isLoading={isLoading}
          emptyMessage="No attendance records found"
        />
      </div>

      {/* Manual Mark Modal */}
      <Modal
        isOpen={isManualMarkModalOpen}
        onClose={() => setIsManualMarkModalOpen(false)}
        title="Manual Attendance Entry"
      >
        <form onSubmit={handleManualMark} className="space-y-4">
          <Input
            label="Index Number"
            required
            value={manualMarkData.indexNumber}
            onChange={(e) => setManualMarkData({ ...manualMarkData, indexNumber: e.target.value })}
            placeholder="Enter student index number"
          />
          <Select
            label="Status"
            required
            options={statusOptions.filter((s) => s.value !== '')}
            value={manualMarkData.status}
            onChange={(e) =>
              setManualMarkData({ ...manualMarkData, status: e.target.value as any })
            }
          />
          <Input
            label="Remarks"
            value={manualMarkData.remarks}
            onChange={(e) => setManualMarkData({ ...manualMarkData, remarks: e.target.value })}
            placeholder="Optional remarks"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsManualMarkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Mark Attendance</Button>
          </div>
        </form>
      </Modal>

      {/* Flag Modal */}
      <Modal
        isOpen={isFlagModalOpen}
        onClose={() => {
          setIsFlagModalOpen(false);
          setSelectedAttendance(null);
          setFlagReason('');
        }}
        title="Flag Attendance"
      >
        <form onSubmit={handleFlag} className="space-y-4">
          {selectedAttendance && (
            <p className="text-gray-600">
              Flagging attendance for:{' '}
              <strong>
                {(selectedAttendance.studentId as Student).firstName}{' '}
                {(selectedAttendance.studentId as Student).lastName}
              </strong>
            </p>
          )}
          <Input
            label="Reason"
            required
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Enter reason for flagging"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsFlagModalOpen(false);
                setSelectedAttendance(null);
                setFlagReason('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Flag
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

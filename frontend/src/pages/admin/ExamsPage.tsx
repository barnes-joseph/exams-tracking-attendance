import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { examsApi, examSchedulesApi } from '../../api/exams';
import { coursesApi } from '../../api/academic';
import { usersApi } from '../../api/users';
import { enrollmentsApi } from '../../api/enrollments';
import type { Exam, ExamSchedule, Course, User, ExamAssignment, Student, Enrollment } from '../../types';
import { Button, Input, Select, Table, Pagination, Modal, Badge, getStatusVariant, DropdownMenu, type DropdownMenuItem } from '../../components/common';

export function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [invigilators, setInvigilators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterScheduleId, setFilterScheduleId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examStudents, setExamStudents] = useState<{ assigned: ExamAssignment[]; enrolled: Enrollment[] }>({ assigned: [], enrolled: [] });
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [formData, setFormData] = useState({
    examCode: '',
    title: '',
    examScheduleId: '',
    courseId: '',
    examDate: '',
    startTime: '',
    endTime: '',
    duration: 180,
    venueName: '',
    venueBuilding: '',
    venueRoom: '',
    venueCapacity: 100,
    invigilators: [] as string[],
    chiefInvigilator: '',
    status: 'SCHEDULED',
  });

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const response = await examsApi.getAll({
        page,
        limit: 10,
        examScheduleId: filterScheduleId || undefined,
        status: filterStatus || undefined,
      });
      setExams(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      toast.error('Failed to fetch exams');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [schedulesRes, coursesRes, usersRes] = await Promise.all([
        examSchedulesApi.getAll({ limit: 100 }),
        coursesApi.getAll({ limit: 100 }),
        usersApi.getAll({ limit: 100, role: 'INVIGILATOR' }),
      ]);
      setSchedules(schedulesRes.data);
      setCourses(coursesRes.data);
      setInvigilators(usersRes.data);
    } catch (err) {
      console.error('Failed to fetch related data');
    }
  };

  useEffect(() => {
    fetchRelatedData();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [page, filterScheduleId, filterStatus]);

  const handleOpenModal = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      const examScheduleId = typeof exam.examScheduleId === 'string'
        ? exam.examScheduleId
        : (exam.examScheduleId as ExamSchedule)._id;
      const courseId = typeof exam.courseId === 'string'
        ? exam.courseId
        : (exam.courseId as Course)._id;
      const invigilatorIds = (exam.invigilators || []).map(inv =>
        typeof inv === 'string' ? inv : (inv as User).id
      );
      const chiefInvigilatorId = exam.chiefInvigilator
        ? (typeof exam.chiefInvigilator === 'string' ? exam.chiefInvigilator : (exam.chiefInvigilator as User).id)
        : '';

      setFormData({
        examCode: exam.examCode,
        title: exam.title,
        examScheduleId,
        courseId,
        examDate: exam.examDate.split('T')[0],
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        venueName: exam.venue?.name || '',
        venueBuilding: exam.venue?.building || '',
        venueRoom: exam.venue?.room || '',
        venueCapacity: exam.venue?.capacity || 100,
        invigilators: invigilatorIds,
        chiefInvigilator: chiefInvigilatorId,
        status: exam.status || 'SCHEDULED',
      });
    } else {
      setEditingExam(null);
      setFormData({
        examCode: '',
        title: '',
        examScheduleId: '',
        courseId: '',
        examDate: '',
        startTime: '',
        endTime: '',
        duration: 180,
        venueName: '',
        venueBuilding: '',
        venueRoom: '',
        venueCapacity: 100,
        invigilators: [],
        chiefInvigilator: '',
        status: 'SCHEDULED',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend: any = {
        examCode: formData.examCode,
        title: formData.title,
        examScheduleId: formData.examScheduleId,
        courseId: formData.courseId,
        examDate: formData.examDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration,
        venue: {
          name: formData.venueName,
          building: formData.venueBuilding,
          room: formData.venueRoom,
          capacity: formData.venueCapacity,
        },
        invigilators: formData.invigilators,
        chiefInvigilator: formData.chiefInvigilator || undefined,
      };

      // Include status when editing
      if (editingExam) {
        dataToSend.status = formData.status;
        await examsApi.update(editingExam._id, dataToSend);
        toast.success('Exam updated successfully');
      } else {
        await examsApi.create(dataToSend);
        toast.success('Exam created successfully');
      }
      handleCloseModal();
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save exam');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await examsApi.delete(id);
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  const handleAutoAssign = async (id: string) => {
    try {
      await examsApi.autoAssignStudents(id);
      toast.success('Students auto-assigned successfully');
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to auto-assign students');
    }
  };

  const handleViewStudents = async (exam: Exam) => {
    setSelectedExam(exam);
    setIsStudentsModalOpen(true);
    setIsLoadingStudents(true);

    try {
      // Get the course ID
      const courseId = typeof exam.courseId === 'string' ? exam.courseId : (exam.courseId as Course)._id;

      // Fetch both assigned students and enrolled students in parallel
      const [assignmentsRes, enrollmentsRes] = await Promise.all([
        examsApi.getAssignments(exam._id),
        enrollmentsApi.getAll({ courseId, limit: 500 }),
      ]);

      setExamStudents({
        assigned: assignmentsRes || [],
        enrolled: enrollmentsRes.data || [],
      });
    } catch (err: any) {
      toast.error('Failed to fetch students');
      setExamStudents({ assigned: [], enrolled: [] });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const getCourseName = (courseId: string | Course) => {
    if (typeof courseId === 'object') return `${courseId.code} - ${courseId.name}`;
    const course = courses.find(c => c._id === courseId);
    return course ? `${course.code} - ${course.name}` : 'Unknown';
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'POSTPONED', label: 'Postponed' },
  ];

  const columns = [
    { key: 'examCode', header: 'Code' },
    { key: 'title', header: 'Title' },
    {
      key: 'courseId',
      header: 'Course',
      render: (exam: Exam) => exam.courseCode || getCourseName(exam.courseId),
    },
    {
      key: 'examDate',
      header: 'Date',
      render: (exam: Exam) => new Date(exam.examDate).toLocaleDateString(),
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
      header: 'Students',
      render: (exam: Exam) => `${exam.presentCount}/${exam.totalAssignedStudents}`,
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
      header: '',
      render: (exam: Exam) => {
        const menuItems: DropdownMenuItem[] = [
          { label: 'View Students', onClick: () => handleViewStudents(exam) },
          { label: 'Edit', onClick: () => handleOpenModal(exam) },
          { label: 'Auto-Assign Students', onClick: () => handleAutoAssign(exam._id), variant: 'success', hidden: exam.totalAssignedStudents > 0 },
          { label: 'Delete', onClick: () => handleDelete(exam._id), variant: 'danger' },
        ];
        return <DropdownMenu items={menuItems} />;
      },
    },
  ];

  const handleInvigilatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({ ...formData, invigilators: selectedOptions });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Exams</h1>
        <Button onClick={() => handleOpenModal()}>Add Exam</Button>
      </div>
<div className="mb-4 flex gap-4">
        <div className="w-64">
          <Select
            options={[{ value: '', label: 'All Schedules' }, ...(schedules || []).map(s => ({ value: s._id, label: s.name }))]}
            value={filterScheduleId}
            onChange={(e) => { setFilterScheduleId(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-48">
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={exams}
          keyExtractor={(exam) => exam._id}
          isLoading={isLoading}
          emptyMessage="No exams found"
        />
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingExam ? 'Edit Exam' : 'Add Exam'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Exam Code"
              required
              value={formData.examCode}
              onChange={(e) => setFormData({ ...formData, examCode: e.target.value })}
              placeholder="e.g., CS101-2024-S1-F"
            />
            <Input
              label="Title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., CS101 Final Examination"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Exam Schedule"
              required
              options={(schedules || []).map(s => ({ value: s._id, label: s.name }))}
              value={formData.examScheduleId}
              onChange={(e) => setFormData({ ...formData, examScheduleId: e.target.value })}
              placeholder="Select a schedule"
            />
            <Select
              label="Course"
              required
              options={(courses || []).map(c => ({ value: c._id, label: `${c.code} - ${c.name}` }))}
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              placeholder="Select a course"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Input
              label="Exam Date"
              type="date"
              required
              value={formData.examDate}
              onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
            />
            <Input
              label="Start Time"
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
            <Input
              label="Duration (min)"
              type="number"
              required
              min={30}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            />
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Venue Details</h4>
            <div className="grid grid-cols-4 gap-4">
              <Input
                label="Venue Name"
                required
                value={formData.venueName}
                onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                placeholder="e.g., Main Hall"
              />
              <Input
                label="Building"
                value={formData.venueBuilding}
                onChange={(e) => setFormData({ ...formData, venueBuilding: e.target.value })}
                placeholder="e.g., Block A"
              />
              <Input
                label="Room"
                value={formData.venueRoom}
                onChange={(e) => setFormData({ ...formData, venueRoom: e.target.value })}
                placeholder="e.g., Room 101"
              />
              <Input
                label="Capacity"
                type="number"
                min={1}
                value={formData.venueCapacity}
                onChange={(e) => setFormData({ ...formData, venueCapacity: parseInt(e.target.value) })}
              />
            </div>
          </div>
          {editingExam && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Exam Status</h4>
              <div className="w-64">
                <Select
                  label="Status"
                  options={statusOptions.filter(opt => opt.value !== '')}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
              </div>
            </div>
          )}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Invigilators</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invigilators (hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  multiple
                  value={formData.invigilators}
                  onChange={handleInvigilatorChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-32"
                >
                  {(invigilators || []).map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.firstName} {inv.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <Select
                label="Chief Invigilator"
                options={[{ value: '', label: 'None' }, ...(invigilators || []).map(inv => ({
                  value: inv.id,
                  label: `${inv.firstName} ${inv.lastName}`,
                }))]}
                value={formData.chiefInvigilator}
                onChange={(e) => setFormData({ ...formData, chiefInvigilator: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">{editingExam ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Students Modal */}
      <Modal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        title={`Students - ${selectedExam?.title || ''}`}
        size="xl"
      >
        {isLoadingStudents ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Enrolled in Course</p>
                <p className="text-2xl font-semibold text-blue-700">{examStudents.enrolled.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Assigned to Exam</p>
                <p className="text-2xl font-semibold text-green-700">{examStudents.assigned.length}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600">Not Yet Assigned</p>
                <p className="text-2xl font-semibold text-yellow-700">
                  {Math.max(0, examStudents.enrolled.length - examStudents.assigned.length)}
                </p>
              </div>
            </div>

            {/* Tabs for Assigned vs Enrolled */}
            {examStudents.assigned.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Assigned Students ({examStudents.assigned.length})</h3>
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Index Number</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seat</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {examStudents.assigned.map((assignment) => {
                        const student = assignment.studentId as Student;
                        return (
                          <tr key={assignment._id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{student?.indexNumber || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {student ? `${student.firstName} ${student.lastName}` : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{assignment.seatNumber || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{assignment.room || '-'}</td>
                            <td className="px-4 py-2 text-sm">
                              <Badge variant={assignment.status === 'ASSIGNED' ? 'blue' : assignment.status === 'PRESENT' ? 'green' : 'gray'} size="sm">
                                {assignment.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Enrolled Students ({examStudents.enrolled.length})</h3>
                <p className="text-sm text-gray-500 mb-3">
                  These students are enrolled in the course and will be assigned when you click "Auto-Assign Students".
                </p>
                {examStudents.enrolled.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Index Number</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {examStudents.enrolled.map((enrollment) => {
                          const student = enrollment.studentId as Student;
                          return (
                            <tr key={enrollment._id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{student?.indexNumber || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {student ? `${student.firstName} ${student.lastName}` : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{enrollment.academicYear}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">Semester {enrollment.semester}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No students enrolled in this course yet.</p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsStudentsModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

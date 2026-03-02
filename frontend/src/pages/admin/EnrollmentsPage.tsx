import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { enrollmentsApi } from '../../api/enrollments';
import { coursesApi, programsApi } from '../../api/academic';
import { studentsApi } from '../../api/students';
import type { Enrollment, Course, Program, Student } from '../../types';
import { Button, Input, Select, Table, Pagination, Modal, Badge } from '../../components/common';

export function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    semester: 1 as 1 | 2,
  });

  const [bulkFormData, setBulkFormData] = useState({
    courseId: '',
    programId: '',
    level: '',
    academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    semester: 1 as 1 | 2,
  });

  const fetchEnrollments = async () => {
    setIsLoading(true);
    try {
      const response = await enrollmentsApi.getAll({
        page,
        limit: 10,
        courseId: filterCourseId || undefined,
        academicYear: filterAcademicYear || undefined,
        semester: filterSemester ? parseInt(filterSemester) : undefined,
      });
      setEnrollments(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      toast.error('Failed to fetch enrollments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [coursesRes, programsRes, studentsRes] = await Promise.all([
        coursesApi.getAll({ limit: 200 }),
        programsApi.getAll({ limit: 100 }),
        studentsApi.getAll({ limit: 500 }),
      ]);
      setCourses(coursesRes.data);
      setPrograms(programsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error('Failed to fetch related data');
    }
  };

  useEffect(() => {
    fetchRelatedData();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [page, filterCourseId, filterAcademicYear, filterSemester]);

  const handleOpenModal = () => {
    setFormData({
      studentId: '',
      courseId: '',
      academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      semester: 1,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await enrollmentsApi.create(formData);
      toast.success('Enrollment created successfully');
      handleCloseModal();
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create enrollment');
    }
  };

  const handleBulkEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get students matching the criteria
      const studentsRes = await studentsApi.getAll({
        limit: 500,
        programId: bulkFormData.programId || undefined,
        level: bulkFormData.level ? parseInt(bulkFormData.level) : undefined,
        status: 'ACTIVE',
      });

      if (studentsRes.data.length === 0) {
        toast.error('No students found matching the criteria');
        return;
      }

      const studentIds = studentsRes.data.map(s => s.id);

      const result = await enrollmentsApi.bulkEnroll({
        courseId: bulkFormData.courseId,
        studentIds,
        academicYear: bulkFormData.academicYear,
        semester: bulkFormData.semester,
      });

      toast.success(`Successfully enrolled ${result.enrolled} students`);
      if (result.errors && result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred`);
      }
      setIsBulkModalOpen(false);
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to bulk enroll students');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enrollment?')) return;
    try {
      await enrollmentsApi.delete(id);
      toast.success('Enrollment deleted successfully');
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete enrollment');
    }
  };

  const getStudentName = (studentId: string | Student) => {
    if (typeof studentId === 'object') {
      return `${studentId.firstName} ${studentId.lastName} (${studentId.indexNumber})`;
    }
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName} (${student.indexNumber})` : 'Unknown';
  };

  const getCourseName = (courseId: string | Course) => {
    if (typeof courseId === 'object') {
      return `${courseId.code} - ${courseId.name}`;
    }
    const course = courses.find(c => c._id === courseId);
    return course ? `${course.code} - ${course.name}` : 'Unknown';
  };

  const academicYearOptions = [
    { value: '', label: 'All Academic Years' },
    { value: '2024/2025', label: '2024/2025' },
    { value: '2025/2026', label: '2025/2026' },
    { value: '2026/2027', label: '2026/2027' },
  ];

  const semesterOptions = [
    { value: '', label: 'All Semesters' },
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
  ];

  const columns = [
    {
      key: 'studentId',
      header: 'Student',
      render: (enrollment: Enrollment) => getStudentName(enrollment.studentId),
    },
    {
      key: 'courseId',
      header: 'Course',
      render: (enrollment: Enrollment) => getCourseName(enrollment.courseId),
    },
    { key: 'academicYear', header: 'Academic Year' },
    {
      key: 'semester',
      header: 'Semester',
      render: (enrollment: Enrollment) => `Semester ${enrollment.semester}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (enrollment: Enrollment) => (
        <Badge variant={enrollment.status === 'ENROLLED' ? 'green' : enrollment.status === 'DROPPED' ? 'red' : 'gray'}>
          {enrollment.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (enrollment: Enrollment) => (
        <Button size="sm" variant="danger" onClick={() => handleDelete(enrollment._id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Enrollments</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
            Bulk Enroll
          </Button>
          <Button onClick={handleOpenModal}>Add Enrollment</Button>
        </div>
      </div>

      <div className="mb-4 flex gap-4 flex-wrap">
        <div className="w-64">
          <Select
            options={[{ value: '', label: 'All Courses' }, ...courses.map(c => ({ value: c._id, label: `${c.code} - ${c.name}` }))]}
            value={filterCourseId}
            onChange={(e) => { setFilterCourseId(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-48">
          <Select
            options={academicYearOptions}
            value={filterAcademicYear}
            onChange={(e) => { setFilterAcademicYear(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-40">
          <Select
            options={semesterOptions}
            value={filterSemester}
            onChange={(e) => { setFilterSemester(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={enrollments}
          keyExtractor={(enrollment) => enrollment._id}
          isLoading={isLoading}
          emptyMessage="No enrollments found"
        />
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>

      {/* Single Enrollment Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add Enrollment" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Student"
            required
            options={students.map(s => ({ value: s.id, label: `${s.indexNumber} - ${s.firstName} ${s.lastName}` }))}
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            placeholder="Select a student"
          />
          <Select
            label="Course"
            required
            options={courses.map(c => ({ value: c._id, label: `${c.code} - ${c.name}` }))}
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            placeholder="Select a course"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Academic Year"
              required
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              placeholder="e.g., 2024/2025"
            />
            <Select
              label="Semester"
              required
              options={[
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
              ]}
              value={formData.semester.toString()}
              onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) as 1 | 2 })}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Enrollment Modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Enroll Students" size="md">
        <form onSubmit={handleBulkEnroll} className="space-y-4">
          <Select
            label="Course"
            required
            options={courses.map(c => ({ value: c._id, label: `${c.code} - ${c.name}` }))}
            value={bulkFormData.courseId}
            onChange={(e) => setBulkFormData({ ...bulkFormData, courseId: e.target.value })}
            placeholder="Select a course"
          />
          <Select
            label="Program (Optional - filter students)"
            options={[{ value: '', label: 'All Programs' }, ...programs.map(p => ({ value: p._id, label: p.name }))]}
            value={bulkFormData.programId}
            onChange={(e) => setBulkFormData({ ...bulkFormData, programId: e.target.value })}
          />
          <Select
            label="Level (Optional - filter students)"
            options={[
              { value: '', label: 'All Levels' },
              { value: '100', label: 'Level 100' },
              { value: '200', label: 'Level 200' },
              { value: '300', label: 'Level 300' },
              { value: '400', label: 'Level 400' },
            ]}
            value={bulkFormData.level}
            onChange={(e) => setBulkFormData({ ...bulkFormData, level: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Academic Year"
              required
              value={bulkFormData.academicYear}
              onChange={(e) => setBulkFormData({ ...bulkFormData, academicYear: e.target.value })}
              placeholder="e.g., 2024/2025"
            />
            <Select
              label="Semester"
              required
              options={[
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
              ]}
              value={bulkFormData.semester.toString()}
              onChange={(e) => setBulkFormData({ ...bulkFormData, semester: parseInt(e.target.value) as 1 | 2 })}
            />
          </div>
          <p className="text-sm text-gray-500">
            This will enroll all active students matching the selected program and level into the selected course.
          </p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
            <Button type="submit">Enroll Students</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

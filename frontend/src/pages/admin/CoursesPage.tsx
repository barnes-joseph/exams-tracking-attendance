import { useState, useEffect } from 'react';
import { coursesApi, departmentsApi, programsApi } from '../../api/academic';
import type { Course, Department, Program } from '../../types';
import { Button, Input, Select, Table, Pagination, Modal, Badge, Alert } from '../../components/common';

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    departmentId: '',
    programId: '',
    creditHours: 3,
    level: 100,
    semester: 1 as 1 | 2,
    lecturer: '',
    isElective: false,
  });

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await coursesApi.getAll({
        page,
        limit: 10,
        search,
        departmentId: filterDepartmentId || undefined,
      });
      setCourses(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartmentsAndPrograms = async () => {
    try {
      const [deptResponse, progResponse] = await Promise.all([
        departmentsApi.getAll({ limit: 100 }),
        programsApi.getAll({ limit: 100 }),
      ]);
      setDepartments(deptResponse.data);
      setPrograms(progResponse.data);
    } catch (err) {
      console.error('Failed to fetch departments/programs');
    }
  };

  useEffect(() => {
    fetchDepartmentsAndPrograms();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [page, search, filterDepartmentId]);

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      const departmentId = typeof course.departmentId === 'string'
        ? course.departmentId
        : (course.departmentId as Department)._id;
      const programId = course.programId
        ? (typeof course.programId === 'string' ? course.programId : (course.programId as Program)._id)
        : '';
      setFormData({
        code: course.code,
        name: course.name,
        departmentId,
        programId,
        creditHours: course.creditHours,
        level: course.level,
        semester: course.semester,
        lecturer: course.lecturer || '',
        isElective: course.isElective,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        code: '',
        name: '',
        departmentId: '',
        programId: '',
        creditHours: 3,
        level: 100,
        semester: 1,
        lecturer: '',
        isElective: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.programId) {
        delete (dataToSend as any).programId;
      }
      if (editingCourse) {
        await coursesApi.update(editingCourse._id, dataToSend);
        setSuccess('Course updated successfully');
      } else {
        await coursesApi.create(dataToSend);
        setSuccess('Course created successfully');
      }
      handleCloseModal();
      fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await coursesApi.delete(id);
      setSuccess('Course deleted successfully');
      fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const getDepartmentName = (departmentId: string | Department) => {
    if (typeof departmentId === 'object') return departmentId.name;
    const dept = departments.find(d => d._id === departmentId);
    return dept?.name || 'Unknown';
  };

  const levelOptions = [
    { value: '100', label: 'Level 100' },
    { value: '200', label: 'Level 200' },
    { value: '300', label: 'Level 300' },
    { value: '400', label: 'Level 400' },
    { value: '500', label: 'Level 500' },
    { value: '600', label: 'Level 600' },
  ];

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    {
      key: 'departmentId',
      header: 'Department',
      render: (course: Course) => getDepartmentName(course.departmentId),
    },
    { key: 'creditHours', header: 'Credits' },
    {
      key: 'level',
      header: 'Level',
      render: (course: Course) => `L${course.level}`,
    },
    {
      key: 'semester',
      header: 'Semester',
      render: (course: Course) => `Sem ${course.semester}`,
    },
    {
      key: 'isElective',
      header: 'Type',
      render: (course: Course) => (
        <Badge variant={course.isElective ? 'purple' : 'blue'} size="sm">
          {course.isElective ? 'Elective' : 'Core'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (course: Course) => (
        <Badge variant={course.isActive ? 'green' : 'gray'}>
          {course.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (course: Course) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(course)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(course._id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
        <Button onClick={() => handleOpenModal()}>Add Course</Button>
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

      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-64">
          <Select
            options={[{ value: '', label: 'All Departments' }, ...(departments || []).map(d => ({ value: d._id, label: d.name }))]}
            value={filterDepartmentId}
            onChange={(e) => { setFilterDepartmentId(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={courses}
          keyExtractor={(course) => course._id}
          isLoading={isLoading}
          emptyMessage="No courses found"
        />
        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCourse ? 'Edit Course' : 'Add Course'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., CS101"
            />
            <Input
              label="Course Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Introduction to Programming"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              required
              options={(departments || []).map(d => ({ value: d._id, label: d.name }))}
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              placeholder="Select a department"
            />
            <Select
              label="Program (Optional)"
              options={[{ value: '', label: 'None' }, ...(programs || []).map(p => ({ value: p._id, label: p.name }))]}
              value={formData.programId}
              onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Credit Hours"
              type="number"
              required
              min={1}
              max={12}
              value={formData.creditHours}
              onChange={(e) => setFormData({ ...formData, creditHours: parseInt(e.target.value) })}
            />
            <Select
              label="Level"
              required
              options={levelOptions}
              value={formData.level.toString()}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Lecturer"
              value={formData.lecturer}
              onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
              placeholder="Lecturer name"
            />
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="isElective"
                checked={formData.isElective}
                onChange={(e) => setFormData({ ...formData, isElective: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isElective" className="ml-2 text-sm text-gray-700">
                This is an elective course
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">{editingCourse ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { studentsApi } from '../../api/students';
import { programsApi } from '../../api/academic';
import type { Student, Program } from '../../types';
import { Button, Input, Select, Table, Pagination, Modal, Badge, getStatusVariant, DropdownMenu, type DropdownMenuItem } from '../../components/common';

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterProgramId, setFilterProgramId] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    indexNumber: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    programId: '',
    level: 100,
    enrollmentYear: new Date().getFullYear(),
    currentAcademicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    currentSemester: 1 as 1 | 2,
    gender: '' as '' | 'MALE' | 'FEMALE' | 'OTHER',
    dateOfBirth: '',
    status: 'ACTIVE' as Student['status'],
    password: '',
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await studentsApi.getAll({
        page,
        limit: 10,
        search,
        programId: filterProgramId || undefined,
        level: filterLevel ? parseInt(filterLevel) : undefined,
        status: filterStatus || undefined,
      });
      setStudents(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await programsApi.getAll({ limit: 100 });
      setPrograms(response.data);
    } catch (err) {
      console.error('Failed to fetch programs');
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, search, filterProgramId, filterLevel, filterStatus]);

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        indexNumber: student.indexNumber,
        email: student.email,
        firstName: student.firstName,
        middleName: student.middleName || '',
        lastName: student.lastName,
        programId: student.programId,
        level: student.level,
        enrollmentYear: student.enrollmentYear,
        currentAcademicYear: student.currentAcademicYear,
        currentSemester: student.currentSemester,
        gender: student.gender || '',
        dateOfBirth: student.dateOfBirth || '',
        status: student.status,
        password: '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        indexNumber: '',
        email: '',
        firstName: '',
        middleName: '',
        lastName: '',
        programId: '',
        level: 100,
        enrollmentYear: new Date().getFullYear(),
        currentAcademicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        currentSemester: 1,
        gender: '',
        dateOfBirth: '',
        status: 'ACTIVE',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend: Partial<Student> & { password?: string } = {
        indexNumber: formData.indexNumber,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        programId: formData.programId,
        level: formData.level,
        enrollmentYear: formData.enrollmentYear,
        currentAcademicYear: formData.currentAcademicYear,
        currentSemester: formData.currentSemester,
        status: formData.status,
      };

      if (formData.middleName) dataToSend.middleName = formData.middleName;
      if (formData.dateOfBirth) dataToSend.dateOfBirth = formData.dateOfBirth;
      if (formData.gender) dataToSend.gender = formData.gender as 'MALE' | 'FEMALE' | 'OTHER';
      if (formData.password) dataToSend.password = formData.password;

      if (editingStudent) {
        await studentsApi.update(editingStudent.id, dataToSend);
        toast.success('Student updated successfully');
      } else {
        await studentsApi.create(dataToSend);
        toast.success('Student created successfully');
      }
      handleCloseModal();
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentsApi.delete(id);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleBulkImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const fileInput = formElement.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      const result = await studentsApi.bulkImport(file);
      toast.success(`Successfully imported ${result.imported} students`);
      if (result.errors.length > 0) {
        toast.error(`Errors: ${result.errors.join(', ')}`);
      }
      setIsImportModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import students');
    }
  };

  const getProgramName = (programId: string) => {
    const program = programs.find(p => p._id === programId);
    return program?.name || 'Unknown';
  };

  const columns = [
    { key: 'indexNumber', header: 'Index Number' },
    {
      key: 'name',
      header: 'Name',
      render: (student: Student) => `${student.firstName} ${student.lastName}`,
    },
    { key: 'email', header: 'Email' },
    {
      key: 'programId',
      header: 'Program',
      render: (student: Student) => getProgramName(student.programId),
    },
    { key: 'level', header: 'Level' },
    {
      key: 'status',
      header: 'Status',
      render: (student: Student) => (
        <Badge variant={getStatusVariant(student.status)}>{student.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (student: Student) => {
        const menuItems: DropdownMenuItem[] = [
          { label: 'Edit', onClick: () => handleOpenModal(student) },
          { label: 'Delete', onClick: () => handleDelete(student.id), variant: 'danger' },
        ];
        return <DropdownMenu items={menuItems} />;
      },
    },
  ];

  const levelOptions = [
    { value: '', label: 'All Levels' },
    { value: '100', label: 'Level 100' },
    { value: '200', label: 'Level 200' },
    { value: '300', label: 'Level 300' },
    { value: '400', label: 'Level 400' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'GRADUATED', label: 'Graduated' },
    { value: 'DEFERRED', label: 'Deferred' },
    { value: 'WITHDRAWN', label: 'Withdrawn' },
  ];

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            Bulk Import
          </Button>
          <Button onClick={() => handleOpenModal()}>Add Student</Button>
        </div>
      </div>
<div className="mb-4 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name or index number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-48">
          <Select
            options={[{ value: '', label: 'All Programs' }, ...(programs || []).map(p => ({ value: p._id, label: p.name }))]}
            value={filterProgramId}
            onChange={(e) => { setFilterProgramId(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-36">
          <Select
            options={levelOptions}
            value={filterLevel}
            onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-36">
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
          data={students}
          keyExtractor={(student) => student.id}
          isLoading={isLoading}
          emptyMessage="No students found"
        />
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>

      {/* Add/Edit Student Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStudent ? 'Edit Student' : 'Add Student'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Index Number"
              required
              value={formData.indexNumber}
              onChange={(e) => setFormData({ ...formData, indexNumber: e.target.value })}
              placeholder="e.g., 2024001234"
            />
            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@example.com"
            />
            <Input
              label={editingStudent ? 'New Password (optional)' : 'Password'}
              type="password"
              required={!editingStudent}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="Middle Name"
              value={formData.middleName}
              onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Program"
              required
              options={(programs || []).map(p => ({ value: p._id, label: p.name }))}
              value={formData.programId}
              onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
              placeholder="Select a program"
            />
            <Select
              label="Level"
              required
              options={[
                { value: '100', label: 'Level 100' },
                { value: '200', label: 'Level 200' },
                { value: '300', label: 'Level 300' },
                { value: '400', label: 'Level 400' },
              ]}
              value={formData.level.toString()}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
            />
            <Input
              label="Enrollment Year"
              type="number"
              required
              value={formData.enrollmentYear}
              onChange={(e) => setFormData({ ...formData, enrollmentYear: parseInt(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Academic Year"
              required
              value={formData.currentAcademicYear}
              onChange={(e) => setFormData({ ...formData, currentAcademicYear: e.target.value })}
              placeholder="e.g., 2024/2025"
            />
            <Select
              label="Semester"
              required
              options={[
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
              ]}
              value={formData.currentSemester.toString()}
              onChange={(e) => setFormData({ ...formData, currentSemester: parseInt(e.target.value) as 1 | 2 })}
            />
            <Select
              label="Gender"
              options={genderOptions}
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
            <Select
              label="Status"
              required
              options={statusOptions.filter(s => s.value !== '')}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Student['status'] })}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">{editingStudent ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Bulk Import Students">
        <form onSubmit={handleBulkImport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-2 text-sm text-gray-500">
              CSV should have columns: indexNumber, email, firstName, lastName, programId, level, enrollmentYear
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            <Button type="submit">Import</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

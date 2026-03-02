import { useState, useEffect } from 'react';
import { programsApi, departmentsApi } from '../../api/academic';
import type { Program, Department } from '../../types';
import { Button, Input, Select, Table, Pagination, Modal, Badge, Alert } from '../../components/common';

export function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    abbreviation: '',
    departmentId: '',
    degreeType: 'UNDERGRADUATE' as Program['degreeType'],
    duration: 4,
    semestersPerYear: 2,
  });

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const response = await programsApi.getAll({
        page,
        limit: 10,
        search,
        departmentId: filterDepartmentId || undefined,
      });
      setPrograms(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to fetch programs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsApi.getAll({ limit: 100 });
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [page, search, filterDepartmentId]);

  const handleOpenModal = (program?: Program) => {
    if (program) {
      setEditingProgram(program);
      const departmentId = typeof program.departmentId === 'string'
        ? program.departmentId
        : (program.departmentId as Department)._id;
      setFormData({
        code: program.code,
        name: program.name,
        abbreviation: program.abbreviation || '',
        departmentId,
        degreeType: program.degreeType,
        duration: program.duration,
        semestersPerYear: program.semestersPerYear,
      });
    } else {
      setEditingProgram(null);
      setFormData({
        code: '',
        name: '',
        abbreviation: '',
        departmentId: '',
        degreeType: 'UNDERGRADUATE',
        duration: 4,
        semestersPerYear: 2,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProgram(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProgram) {
        await programsApi.update(editingProgram._id, formData);
        setSuccess('Program updated successfully');
      } else {
        await programsApi.create(formData);
        setSuccess('Program created successfully');
      }
      handleCloseModal();
      fetchPrograms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save program');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      await programsApi.delete(id);
      setSuccess('Program deleted successfully');
      fetchPrograms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete program');
    }
  };

  const getDepartmentName = (departmentId: string | Department) => {
    if (typeof departmentId === 'object') return departmentId.name;
    const dept = departments.find(d => d._id === departmentId);
    return dept?.name || 'Unknown';
  };

  const degreeTypeOptions = [
    { value: 'UNDERGRADUATE', label: 'Undergraduate' },
    { value: 'POSTGRADUATE', label: 'Postgraduate' },
    { value: 'DIPLOMA', label: 'Diploma' },
    { value: 'CERTIFICATE', label: 'Certificate' },
  ];

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'abbreviation', header: 'Abbrev.' },
    {
      key: 'departmentId',
      header: 'Department',
      render: (prog: Program) => getDepartmentName(prog.departmentId),
    },
    {
      key: 'degreeType',
      header: 'Degree Type',
      render: (prog: Program) => (
        <Badge variant="blue" size="sm">{prog.degreeType}</Badge>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (prog: Program) => `${prog.duration} years`,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (prog: Program) => (
        <Badge variant={prog.isActive ? 'green' : 'gray'}>
          {prog.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (prog: Program) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(prog)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(prog._id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Programs</h1>
        <Button onClick={() => handleOpenModal()}>Add Program</Button>
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
            placeholder="Search programs..."
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
          data={programs}
          keyExtractor={(prog) => prog._id}
          isLoading={isLoading}
          emptyMessage="No programs found"
        />
        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProgram ? 'Edit Program' : 'Add Program'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., BSC-CS"
            />
            <Input
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Bachelor of Science in Computer Science"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Abbreviation"
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
              placeholder="e.g., BSc. CS"
            />
            <Select
              label="Department"
              required
              options={(departments || []).map(d => ({ value: d._id, label: d.name }))}
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              placeholder="Select a department"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Degree Type"
              required
              options={degreeTypeOptions}
              value={formData.degreeType}
              onChange={(e) => setFormData({ ...formData, degreeType: e.target.value as Program['degreeType'] })}
            />
            <Input
              label="Duration (years)"
              type="number"
              required
              min={1}
              max={10}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            />
            <Input
              label="Semesters/Year"
              type="number"
              required
              min={1}
              max={4}
              value={formData.semestersPerYear}
              onChange={(e) => setFormData({ ...formData, semestersPerYear: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">{editingProgram ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { departmentsApi, collegesApi } from '../../api/academic';
import type { Department, College } from '../../types';
import { Button, Input, Select, Table, Pagination, Modal, Badge, Alert } from '../../components/common';

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCollegeId, setFilterCollegeId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    abbreviation: '',
    collegeId: '',
    headOfDepartment: '',
    description: '',
  });

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await departmentsApi.getAll({
        page,
        limit: 10,
        search,
        collegeId: filterCollegeId || undefined,
      });
      setDepartments(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await collegesApi.getAll({ limit: 100 });
      setColleges(response.data);
    } catch (err) {
      console.error('Failed to fetch colleges');
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [page, search, filterCollegeId]);

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      const collegeId = typeof department.collegeId === 'string'
        ? department.collegeId
        : (department.collegeId as College)._id;
      setFormData({
        code: department.code,
        name: department.name,
        abbreviation: department.abbreviation || '',
        collegeId,
        headOfDepartment: department.headOfDepartment || '',
        description: department.description || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({ code: '', name: '', abbreviation: '', collegeId: '', headOfDepartment: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await departmentsApi.update(editingDepartment._id, formData);
        setSuccess('Department updated successfully');
      } else {
        await departmentsApi.create(formData);
        setSuccess('Department created successfully');
      }
      handleCloseModal();
      fetchDepartments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await departmentsApi.delete(id);
      setSuccess('Department deleted successfully');
      fetchDepartments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const getCollegeName = (collegeId: string | College) => {
    if (typeof collegeId === 'object') return collegeId.name;
    const college = colleges.find(c => c._id === collegeId);
    return college?.name || 'Unknown';
  };

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'abbreviation', header: 'Abbreviation' },
    {
      key: 'collegeId',
      header: 'College',
      render: (dept: Department) => getCollegeName(dept.collegeId),
    },
    { key: 'headOfDepartment', header: 'HOD' },
    {
      key: 'isActive',
      header: 'Status',
      render: (dept: Department) => (
        <Badge variant={dept.isActive ? 'green' : 'gray'}>
          {dept.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (dept: Department) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(dept)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(dept._id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
        <Button onClick={() => handleOpenModal()}>Add Department</Button>
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
            placeholder="Search departments..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-64">
          <Select
            options={[{ value: '', label: 'All Colleges' }, ...(colleges || []).map(c => ({ value: c._id, label: c.name }))]}
            value={filterCollegeId}
            onChange={(e) => { setFilterCollegeId(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={departments}
          keyExtractor={(dept) => dept._id}
          isLoading={isLoading}
          emptyMessage="No departments found"
        />
        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingDepartment ? 'Edit Department' : 'Add Department'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., CS"
            />
            <Input
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Computer Science"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Abbreviation"
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
              placeholder="e.g., CS"
            />
            <Select
              label="College"
              required
              options={(colleges || []).map(c => ({ value: c._id, label: c.name }))}
              value={formData.collegeId}
              onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
              placeholder="Select a college"
            />
          </div>
          <Input
            label="Head of Department"
            value={formData.headOfDepartment}
            onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
            placeholder="Name of the HOD"
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">{editingDepartment ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

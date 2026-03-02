import { useState, useEffect } from 'react';
import { collegesApi } from '../../api/academic';
import type { College } from '../../types';
import { Button, Input, Table, Pagination, Modal, Badge, Alert } from '../../components/common';

export function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    dean: '',
    email: '',
    phone: '',
  });

  const fetchColleges = async () => {
    setIsLoading(true);
    try {
      const response = await collegesApi.getAll({ page, limit: 10, search });
      setColleges(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to fetch colleges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [page, search]);

  const handleOpenModal = (college?: College) => {
    if (college) {
      setEditingCollege(college);
      setFormData({
        code: college.code,
        name: college.name,
        description: college.description || '',
        dean: college.dean || '',
        email: college.email || '',
        phone: college.phone || '',
      });
    } else {
      setEditingCollege(null);
      setFormData({ code: '', name: '', description: '', dean: '', email: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCollege(null);
    setFormData({ code: '', name: '', description: '', dean: '', email: '', phone: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollege) {
        await collegesApi.update(editingCollege._id, formData);
        setSuccess('College updated successfully');
      } else {
        await collegesApi.create(formData);
        setSuccess('College created successfully');
      }
      handleCloseModal();
      fetchColleges();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save college');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this college?')) return;
    try {
      await collegesApi.delete(id);
      setSuccess('College deleted successfully');
      fetchColleges();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete college');
    }
  };

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'name', header: 'Name' },
    { key: 'dean', header: 'Dean' },
    { key: 'email', header: 'Email' },
    {
      key: 'isActive',
      header: 'Status',
      render: (college: College) => (
        <Badge variant={college.isActive ? 'green' : 'gray'}>
          {college.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (college: College) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(college)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(college._id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Colleges</h1>
        <Button onClick={() => handleOpenModal()}>Add College</Button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert variant="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search colleges..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={colleges}
          keyExtractor={(college) => college._id}
          isLoading={isLoading}
          emptyMessage="No colleges found"
        />
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCollege ? 'Edit College' : 'Add College'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., COE"
            />
            <Input
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., College of Engineering"
            />
          </div>
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description of the college"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Dean"
              value={formData.dean}
              onChange={(e) => setFormData({ ...formData, dean: e.target.value })}
              placeholder="Name of the dean"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="college@example.com"
            />
          </div>
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1234567890"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">{editingCollege ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

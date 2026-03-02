import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { examSchedulesApi } from '../../api/exams';
import type { ExamSchedule } from '../../types';
import { Button, Input, Select, Table, Pagination, Modal, Badge, getStatusVariant, DropdownMenu, type DropdownMenuItem } from '../../components/common';

export function ExamSchedulesPage() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    semester: 1 as 1 | 2,
    startDate: '',
    endDate: '',
    description: '',
  });

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const response = await examSchedulesApi.getAll({
        page,
        limit: 10,
        status: filterStatus || undefined,
      });
      setSchedules(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      toast.error('Failed to fetch exam schedules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [page, filterStatus]);

  const handleOpenModal = (schedule?: ExamSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        name: schedule.name,
        academicYear: schedule.academicYear,
        semester: schedule.semester,
        startDate: schedule.startDate.split('T')[0],
        endDate: schedule.endDate.split('T')[0],
        description: schedule.description || '',
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        name: '',
        academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        semester: 1,
        startDate: '',
        endDate: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await examSchedulesApi.update(editingSchedule._id, formData);
        toast.success('Exam schedule updated successfully');
      } else {
        await examSchedulesApi.create(formData);
        toast.success('Exam schedule created successfully');
      }
      handleCloseModal();
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save exam schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam schedule?')) return;
    try {
      await examSchedulesApi.delete(id);
      toast.success('Exam schedule deleted successfully');
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete exam schedule');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await examSchedulesApi.publish(id);
      toast.success('Exam schedule published successfully');
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish exam schedule');
    }
  };

  const handleGenerateQrCodes = async (id: string) => {
    setGeneratingId(id);
    try {
      await examSchedulesApi.generateQrCodes(id);
      toast.success('QR codes generated successfully');
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate QR codes');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSendQrCodes = async (id: string) => {
    setSendingId(id);
    try {
      await examSchedulesApi.sendQrCodes(id);
      toast.success('QR codes sent to students successfully');
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send QR codes');
    } finally {
      setSendingId(null);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'academicYear', header: 'Academic Year' },
    {
      key: 'semester',
      header: 'Semester',
      render: (schedule: ExamSchedule) => `Semester ${schedule.semester}`,
    },
    {
      key: 'dates',
      header: 'Period',
      render: (schedule: ExamSchedule) =>
        `${new Date(schedule.startDate).toLocaleDateString()} - ${new Date(schedule.endDate).toLocaleDateString()}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (schedule: ExamSchedule) => (
        <Badge variant={getStatusVariant(schedule.status)}>{schedule.status}</Badge>
      ),
    },
    {
      key: 'qrStatus',
      header: 'QR Codes',
      render: (schedule: ExamSchedule) => {
        const isGenerating = generatingId === schedule._id;
        const isSending = sendingId === schedule._id;
        
        if (isGenerating) {
          return (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-600">Generating...</span>
            </div>
          );
        }
        
        if (isSending) {
          return (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-600">Sending...</span>
            </div>
          );
        }
        
        return (
          <div className="flex space-x-1">
            <Badge variant={schedule.qrCodesGenerated ? 'green' : 'gray'} size="sm">
              {schedule.qrCodesGenerated ? 'Generated' : 'Not Generated'}
            </Badge>
            {schedule.qrCodesSent && (
              <Badge variant="blue" size="sm">Sent</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (schedule: ExamSchedule) => {
        const menuItems: DropdownMenuItem[] = [
          { label: 'Edit', onClick: () => handleOpenModal(schedule) },
          { label: 'Publish', onClick: () => handlePublish(schedule._id), variant: 'success', hidden: schedule.status !== 'DRAFT' },
          { label: 'Generate QR Codes', onClick: () => handleGenerateQrCodes(schedule._id), hidden: schedule.status === 'DRAFT' },
          { label: 'Send QR Codes', onClick: () => handleSendQrCodes(schedule._id), hidden: !schedule.qrCodesGenerated },
          { label: 'Delete', onClick: () => handleDelete(schedule._id), variant: 'danger' },
        ];
        return <DropdownMenu items={menuItems} />;
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Exam Schedules</h1>
        <Button onClick={() => handleOpenModal()}>Create Schedule</Button>
      </div>
<div className="mb-4">
        <Select
          options={statusOptions}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={schedules}
          keyExtractor={(schedule) => schedule._id}
          isLoading={isLoading}
          emptyMessage="No exam schedules found"
        />
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSchedule ? 'Edit Exam Schedule' : 'Create Exam Schedule'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., End of Semester Examinations 2024"
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">{editingSchedule ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

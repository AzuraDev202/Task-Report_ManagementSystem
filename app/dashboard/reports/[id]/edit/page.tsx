'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiFile, FiX, FiUpload, FiDownload } from 'react-icons/fi';
import { useDashboard } from '@/contexts/DashboardContext';

export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const { triggerRefresh } = useDashboard();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    task: '',
    title: '',
    content: '',
    status: 'draft',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchTasks();
    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
        // Only show tasks assigned to current user
        const myTasks = data.data.filter((task: any) => task.assignedTo?._id === userId);
        setTasks(myTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const report = data.data;
        
        // Check if user can edit this report (only owner and only if draft or rejected)
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (report.user._id !== userData.id || (report.status !== 'draft' && report.status !== 'rejected')) {
          router.push('/dashboard/reports');
          return;
        }
        
        setFormData({
          task: report.task?._id || '',
          title: report.title,
          content: report.content,
          status: report.status,
        });
        setAttachments(report.attachments || []);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'reports');

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to upload file');
        }

        const data = await response.json();
        setAttachments(prev => [...prev, data.data]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUpdating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update report');
      }

      // Trigger dashboard refresh
      triggerRefresh();
      
      router.push(`/dashboard/reports/${params.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/reports/${params.id}`} className="text-gray-600 hover:text-gray-900">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Báo cáo</h1>
          <p className="text-gray-600">Cập nhật nội dung báo cáo</p>
        </div>
      </div>

      <div className="card max-w-3xl">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Công việc *
            </label>
            <select
              name="task"
              value={formData.task}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Chọn công việc</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title} ({task.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề báo cáo *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung báo cáo *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="input"
              rows={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tài liệu đính kèm
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiUpload className="text-4xl text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Đang tải lên...' : 'Click để chọn file hoặc kéo thả vào đây'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOC, XLS, PPT, TXT, JPG, PNG (tối đa 10MB mỗi file)
                </span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Đã chọn {attachments.length} file:
                </p>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FiFile className="text-blue-500 flex-shrink-0" size={20} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/uploads/reports/${file.filename}`}
                        download={file.originalName}
                        className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FiDownload size={20} />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="draft">Nháp</option>
              <option value="submitted">Đã nộp</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Sau khi nộp, báo cáo sẽ được gửi đến quản lý để duyệt
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={updating}
              className="btn btn-primary"
            >
              {updating ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
            <Link href={`/dashboard/reports/${params.id}`} className="btn btn-secondary">
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

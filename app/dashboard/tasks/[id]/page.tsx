'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiClock, FiCalendar, FiDownload, FiFile } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useDashboard } from '@/contexts/DashboardContext';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { triggerRefresh } = useDashboard();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    if (params.id) {
      fetchTask();
    }
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.data);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Trigger dashboard refresh
        triggerRefresh();
        fetchTask();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      pending: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const styles: any = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return styles[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!task) {
    return <div className="text-center py-12">Không tìm thấy công việc</div>;
  }

  const isAssigned = task.assignedTo?._id === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks" className="text-gray-600 hover:text-gray-900">
          <FiArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết Công việc</h1>
          <p className="text-gray-600">Thông tin và trạng thái công việc</p>
        </div>
        {user?.role === 'manager' && (
          <Link href={`/dashboard/tasks/${params.id}/edit`} className="btn btn-primary">
            Chỉnh sửa
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Mô tả</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tệp đính kèm</h3>
                <div className="space-y-2">
                  {task.attachments.map((file: any, index: number) => (
                    <a
                      key={index}
                      href={`/uploads/tasks/${file.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FiFile className="text-blue-600" size={24} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • {format(new Date(file.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                      <FiDownload className="text-gray-400" size={20} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isAssigned && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cập nhật trạng thái</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateStatus('in-progress')}
                  disabled={updating || task.status === 'in-progress'}
                  className="btn btn-secondary"
                >
                  Đang xử lý
                </button>
                <button
                  onClick={() => updateStatus('completed')}
                  disabled={updating || task.status === 'completed'}
                  className="btn btn-primary"
                >
                  Hoàn thành
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <FiUser className="mr-3 mt-1 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Người nhận</p>
                  <p className="font-medium text-gray-900">{task.assignedTo?.name}</p>
                  <p className="text-sm text-gray-600">{task.assignedTo?.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FiUser className="mr-3 mt-1 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Người giao</p>
                  <p className="font-medium text-gray-900">{task.assignedBy?.name}</p>
                  <p className="text-sm text-gray-600">{task.assignedBy?.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FiCalendar className="mr-3 mt-1 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Hạn chót</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
              </div>

              {task.startDate && (
                <div className="flex items-start">
                  <FiClock className="mr-3 mt-1 text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(task.startDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              )}

              {task.completedDate && (
                <div className="flex items-start">
                  <FiClock className="mr-3 mt-1 text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Ngày hoàn thành</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(task.completedDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <FiClock className="mr-3 mt-1 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isAssigned && (
            <Link 
              href={`/dashboard/reports/new?taskId=${task._id}`}
              className="btn btn-primary w-full text-center"
            >
              Tạo báo cáo
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

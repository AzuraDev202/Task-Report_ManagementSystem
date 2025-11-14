'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiEye, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { useDashboard } from '@/contexts/DashboardContext';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState<any>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { needsRefresh, clearRefresh, triggerRefresh } = useDashboard();

  const fetchTasks = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      let url = '/api/tasks';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchTasks();
  }, [fetchTasks]);

  // Listen for refresh trigger
  useEffect(() => {
    if (needsRefresh) {
      fetchTasks(true);
      clearRefresh();
    }
  }, [needsRefresh, fetchTasks, clearRefresh]);

  const handleRefresh = () => {
    fetchTasks(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(tasks.map(task => task._id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTasks.length === 0) {
      alert('Vui lòng chọn ít nhất một công việc để xóa');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedTasks.length} công việc đã chọn?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const deletePromises = selectedTasks.map(taskId =>
        fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;

      if (successCount > 0) {
        alert(`Đã xóa thành công ${successCount}/${selectedTasks.length} công việc!`);
        setSelectedTasks([]);
        triggerRefresh();
        fetchTasks(true);
      } else {
        alert('Không thể xóa công việc');
      }
    } catch (error) {
      console.error('Error deleting tasks:', error);
      alert('Đã xảy ra lỗi khi xóa công việc');
    }
  };

  const handleDelete = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa công việc "${taskTitle}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Xóa công việc thành công!');
        triggerRefresh();
        fetchTasks(true);
      } else {
        const data = await response.json();
        alert(data.message || 'Không thể xóa công việc');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Đã xảy ra lỗi khi xóa công việc');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Công việc</h1>
          <p className="text-gray-600">Danh sách tất cả công việc trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && selectedTasks.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="btn btn-danger flex items-center gap-2"
            >
              <FiTrash2 />
              Xóa đã chọn ({selectedTasks.length})
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
          {user?.role === 'manager' && (
            <Link href="/dashboard/tasks/new" className="btn btn-primary">
              <FiPlus className="inline mr-2" />
              Tạo công việc mới
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Chờ xử lý
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg ${filter === 'in-progress' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Đang xử lý
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Hoàn thành
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card overflow-x-auto">
        {tasks.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Không có công việc nào</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {user?.role === 'admin' && (
                  <th className="text-left py-3 px-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedTasks.length === tasks.length && tasks.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                  </th>
                )}
                <th className="text-left py-3 px-4">Tiêu đề</th>
                <th className="text-left py-3 px-4">Người nhận</th>
                <th className="text-left py-3 px-4">Trạng thái</th>
                <th className="text-left py-3 px-4">Ưu tiên</th>
                <th className="text-left py-3 px-4">Hạn chót</th>
                <th className="text-left py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="border-b hover:bg-gray-50">
                  {user?.role === 'admin' && (
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task._id)}
                        onChange={(e) => handleSelectTask(task._id, e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {task.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2">
                        {task.assignedTo?.name?.charAt(0)}
                      </div>
                      <span>{task.assignedTo?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/tasks/${task._id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="Xem chi tiết"
                      >
                        <FiEye size={18} />
                      </Link>
                      {user?.role === 'manager' && (
                        <Link
                          href={`/dashboard/tasks/${task._id}/edit`}
                          className="text-green-600 hover:text-green-800"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 size={18} />
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(task._id, task.title)}
                          className="text-red-600 hover:text-red-800"
                          title="Xóa"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

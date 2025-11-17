'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSearch, FiX } from 'react-icons/fi';
import { useDashboard } from '@/contexts/DashboardContext';

export default function NewTaskPage() {
  const router = useRouter();
  const { triggerRefresh } = useDashboard();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    tags: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // Only managers can create tasks
      if (user.role !== 'manager') {
        router.push('/dashboard/tasks');
        return;
      }
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Only show users (not admin or manager) to assign tasks to
        setUsers(data.data.filter((u: any) => u.isActive && u.role === 'user'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        return data.data;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments([...attachments, ...uploadedFiles]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          attachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create task');
      }

      // Trigger dashboard refresh
      triggerRefresh();
      
      router.push('/dashboard/tasks');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks" className="text-gray-600 hover:text-gray-900">
          <FiArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Công việc Mới</h1>
          <p className="text-gray-600">Giao công việc cho nhân viên</p>
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
              Tiêu đề *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
              placeholder="Nhập tiêu đề công việc"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows={4}
              required
              placeholder="Mô tả chi tiết công việc"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giao cho *
              </label>
              
              {/* Selected user display or search input */}
              <div className="relative">
                {formData.assignedTo ? (
                  <div className="input flex items-center justify-between bg-blue-50 border-blue-200">
                    <span className="text-gray-900 font-medium">
                      {users.find(u => u._id === formData.assignedTo)?.name || 'Đã chọn'}
                      {users.find(u => u._id === formData.assignedTo)?.department && 
                        <span className="text-sm text-gray-600 ml-2">
                          ({users.find(u => u._id === formData.assignedTo)?.department})
                        </span>
                      }
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, assignedTo: '' });
                        setSearchQuery('');
                        setFilterDepartment('all');
                      }}
                      className="text-gray-500 hover:text-red-600 transition"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên, email, phòng ban..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        className="input pl-10 pr-4"
                      />
                    </div>
                    
                    {showDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-80 overflow-hidden">
                        {/* Filter by department */}
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                          <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white font-medium"
                          >
                            <option value="all">📂 Tất cả phòng ban</option>
                            {Array.from(new Set(users.map(u => u.department).filter(Boolean))).map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* User list */}
                        <div className="overflow-y-auto max-h-60">
                          {users
                            .filter(user => {
                              const matchSearch = searchQuery === '' || 
                                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));
                              const matchDept = filterDepartment === 'all' || user.department === filterDepartment;
                              return matchSearch && matchDept;
                            })
                            .map((user) => (
                              <button
                                key={user._id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, assignedTo: user._id });
                                  setShowDropdown(false);
                                  setSearchQuery('');
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                              >
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                                {user.department && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    📂 {user.department}
                                    {user.position && ` • ${user.position}`}
                                  </div>
                                )}
                              </button>
                            ))}
                          {users.filter(user => {
                            const matchSearch = searchQuery === '' || 
                              user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));
                            const matchDept = filterDepartment === 'all' || user.department === filterDepartment;
                            return matchSearch && matchDept;
                          }).length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-500">
                              <div className="text-3xl mb-2">🔍</div>
                              <div className="text-sm">Không tìm thấy nhân viên phù hợp</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Click outside to close */}
              {showDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mức độ ưu tiên *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hạn chót *
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="input"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="input"
              placeholder="VD: urgent, backend, feature"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tệp đính kèm
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="input"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-1">Đang tải lên...</p>
            )}
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{file.originalName}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Đang tạo...' : 'Tạo công việc'}
            </button>
            <Link href="/dashboard/tasks" className="btn btn-secondary">
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

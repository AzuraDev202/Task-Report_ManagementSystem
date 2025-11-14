'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiMail, FiBriefcase, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    if (params.id) {
      fetchUser();
      fetchUserStats();
    }
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [tasksRes, reportsRes] = await Promise.all([
        fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/reports', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (tasksRes.ok && reportsRes.ok) {
        const tasksData = await tasksRes.json();
        const reportsData = await reportsRes.json();

        const userTasks = tasksData.data.filter((t: any) => t.assignedTo?._id === params.id);
        const userReports = reportsData.data.filter((r: any) => r.user?._id === params.id);

        setStats({
          totalTasks: userTasks.length,
          completedTasks: userTasks.filter((t: any) => t.status === 'completed').length,
          pendingTasks: userTasks.filter((t: any) => t.status === 'pending').length,
          inProgressTasks: userTasks.filter((t: any) => t.status === 'in-progress').length,
          totalReports: userReports.length,
          approvedReports: userReports.filter((r: any) => r.status === 'approved').length,
          submittedReports: userReports.filter((r: any) => r.status === 'submitted').length,
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: any = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleText = (role: string) => {
    const text: any = {
      admin: 'Quản trị viên',
      manager: 'Quản lý',
      user: 'Nhân viên',
    };
    return text[role] || role;
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!user) {
    return <div className="text-center py-12">Không tìm thấy người dùng</div>;
  }

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users" className="text-gray-600 hover:text-gray-900">
          <FiArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Thông tin Người dùng</h1>
          <p className="text-gray-600">Chi tiết và thống kê người dùng</p>
        </div>
        {canEdit && (
          <Link href={`/dashboard/users/${params.id}/edit`} className="btn btn-primary">
            Chỉnh sửa
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser size={48} className="text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(user.role)}`}>
                {getRoleText(user.role)}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <FiMail className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>

              {user.department && (
                <div className="flex items-center">
                  <FiBriefcase className="mr-3 text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Phòng ban</p>
                    <p className="text-gray-900">{user.department}</p>
                  </div>
                </div>
              )}

              {user.position && (
                <div className="flex items-center">
                  <FiBriefcase className="mr-3 text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Chức vụ</p>
                    <p className="text-gray-900">{user.position}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <FiClock className="mr-3 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Ngày tham gia</p>
                  <p className="text-gray-900">
                    {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Trạng thái</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Công việc</h3>
              {stats ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tổng số:</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.totalTasks}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Hoàn thành:</span>
                    <span className="font-medium text-green-600">{stats.completedTasks}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Đang xử lý:</span>
                    <span className="font-medium text-yellow-600">{stats.inProgressTasks}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Chờ xử lý:</span>
                    <span className="font-medium text-blue-600">{stats.pendingTasks}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Đang tải thống kê...</p>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo</h3>
              {stats ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tổng số:</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.totalReports}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Đã duyệt:</span>
                    <span className="font-medium text-green-600">{stats.approvedReports}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Chờ duyệt:</span>
                    <span className="font-medium text-yellow-600">{stats.submittedReports}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Đang tải thống kê...</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quyền hạn</h3>
            <div className="space-y-2">
              {user.role === 'admin' && (
                <>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Quản lý toàn bộ hệ thống</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Tạo, sửa, xóa người dùng</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Giao và duyệt công việc</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Duyệt báo cáo</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Xem thống kê và báo cáo tổng hợp</span>
                  </div>
                </>
              )}
              {user.role === 'manager' && (
                <>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Giao công việc cho nhân viên</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Duyệt báo cáo</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Xem thống kê nhóm</span>
                  </div>
                </>
              )}
              {user.role === 'user' && (
                <>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Nhận và thực hiện công việc</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Tạo và nộp báo cáo</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Xem công việc của mình</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

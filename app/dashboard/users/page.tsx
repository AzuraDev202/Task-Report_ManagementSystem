'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit2, FiEye, FiSearch, FiFilter, FiUsers, FiUserCheck, FiUserX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchUsers();
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
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments
  const departments = useMemo(() => {
    const depts = users
      .map(u => u.department)
      .filter((d, i, arr) => d && arr.indexOf(d) === i);
    return depts;
  }, [users]);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      const matchDepartment = departmentFilter === 'all' || user.department === departmentFilter;

      return matchSearch && matchRole && matchStatus && matchDepartment;
    });
  }, [users, searchQuery, roleFilter, statusFilter, departmentFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, departmentFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      admins: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      regularUsers: users.filter(u => u.role === 'user').length,
    };
  }, [users]);

  const getRoleBadge = (role: string) => {
    const styles: any = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels: any = {
      admin: 'Admin',
      manager: 'Manager',
      user: 'User',
    };
    return labels[role] || role;
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Người dùng</h1>
          <p className="text-gray-600">Danh sách người dùng trong hệ thống</p>
        </div>
        {currentUser?.role === 'admin' && (
          <Link href="/dashboard/users/new" className="btn btn-primary">
            <FiPlus className="inline mr-2" />
            Thêm người dùng
          </Link>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FiUsers size={24} />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-sm text-blue-100">Tổng số</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FiUserCheck size={24} />
            <span className="text-2xl font-bold">{stats.active}</span>
          </div>
          <p className="text-sm text-green-100">Hoạt động</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <FiUserX size={24} />
            <span className="text-2xl font-bold">{stats.inactive}</span>
          </div>
          <p className="text-sm text-red-100">Ngừng hoạt động</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">ADMIN</span>
            <span className="text-2xl font-bold">{stats.admins}</span>
          </div>
          <p className="text-sm text-purple-100">Quản trị viên</p>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">MGR</span>
            <span className="text-2xl font-bold">{stats.managers}</span>
          </div>
          <p className="text-sm text-indigo-100">Quản lý</p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">USER</span>
            <span className="text-2xl font-bold">{stats.regularUsers}</span>
          </div>
          <p className="text-sm text-gray-100">Người dùng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, vị trí..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input pl-10 w-full"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pl-10 w-full"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input pl-10 w-full"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}</span> trong tổng số <span className="font-semibold">{filteredUsers.length}</span> người dùng
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        {paginatedUsers.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Không tìm thấy người dùng nào</p>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Người dùng</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Vai trò</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Phòng ban</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                          user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                          user.role === 'manager' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                          'bg-gradient-to-br from-gray-500 to-gray-600'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.position || 'Không xác định'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{user.department || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/users/${user._id}`}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Xem chi tiết"
                        >
                          <FiEye size={18} />
                        </Link>
                        {currentUser?.role === 'admin' && (
                          <Link
                            href={`/dashboard/users/${user._id}/edit`}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 size={18} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-600">
                  Trang <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    <FiChevronLeft size={18} />
                    <span className="hidden sm:inline">Trước</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      const showEllipsis = 
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[2.5rem] h-10 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <FiChevronRight size={18} />
                  </button>
                </div>

                {/* Items per page info */}
                <div className="text-sm text-gray-600 hidden md:block">
                  {ITEMS_PER_PAGE} người / trang
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FiClipboard, FiFileText, FiUsers, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { useDashboard } from '@/contexts/DashboardContext';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { needsRefresh, clearRefresh } = useDashboard();

  const fetchStats = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Listen for refresh trigger from other pages
  useEffect(() => {
    if (needsRefresh) {
      fetchStats(true);
      clearRefresh();
    }
  }, [needsRefresh, fetchStats, clearRefresh]);

  const handleRefresh = () => {
    fetchStats(true);
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  const getStatusCount = (statusArray: any[], status: string) => {
    const item = statusArray?.find((s: any) => s._id === status);
    return item?.count || 0;
  };

  const totalTasks = stats?.taskStats?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
  const totalReports = stats?.reportStats?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Tổng quan hệ thống quản lý công việc</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`card bg-gradient-to-br from-blue-500 to-blue-600 text-white transition-all duration-300 ${refreshing ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tổng công việc</p>
              <p className="text-3xl font-bold mt-2">{totalTasks}</p>
            </div>
            <FiClipboard size={48} className="text-blue-200" />
          </div>
        </div>

        <div className={`card bg-gradient-to-br from-green-500 to-green-600 text-white transition-all duration-300 ${refreshing ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Hoàn thành</p>
              <p className="text-3xl font-bold mt-2">
                {getStatusCount(stats?.taskStats, 'completed')}
              </p>
            </div>
            <FiClipboard size={48} className="text-green-200" />
          </div>
        </div>

        <div className={`card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white transition-all duration-300 ${refreshing ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Đang xử lý</p>
              <p className="text-3xl font-bold mt-2">
                {getStatusCount(stats?.taskStats, 'in-progress')}
              </p>
            </div>
            <FiClipboard size={48} className="text-yellow-200" />
          </div>
        </div>

        <div className={`card bg-gradient-to-br from-red-500 to-red-600 text-white transition-all duration-300 ${refreshing ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Quá hạn</p>
              <p className="text-3xl font-bold mt-2">{stats?.overdueTasks || 0}</p>
            </div>
            <FiAlertCircle size={48} className="text-red-200" />
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Công việc gần đây</h2>
          <Link href="/dashboard/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Xem tất cả →
          </Link>
        </div>

        {stats?.recentTasks && stats.recentTasks.length > 0 ? (
          <div className="space-y-3">
            {stats.recentTasks.map((task: any) => (
              <div key={task._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-600">
                    Giao cho: {task.assignedTo?.name || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    task.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Chưa có công việc nào</p>
        )}
      </div>

      {/* Reports Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Báo cáo</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng báo cáo</span>
              <span className="font-semibold">{totalReports}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đã duyệt</span>
              <span className="font-semibold text-green-600">
                {getStatusCount(stats?.reportStats, 'approved')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chờ duyệt</span>
              <span className="font-semibold text-yellow-600">
                {getStatusCount(stats?.reportStats, 'submitted')}
              </span>
            </div>
          </div>
          <Link 
            href="/dashboard/reports" 
            className="mt-4 block text-center btn btn-primary w-full"
          >
            Xem báo cáo
          </Link>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ưu tiên công việc</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Khẩn cấp</span>
              <span className="font-semibold text-red-600">
                {getStatusCount(stats?.tasksByPriority, 'urgent')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cao</span>
              <span className="font-semibold text-orange-600">
                {getStatusCount(stats?.tasksByPriority, 'high')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Trung bình</span>
              <span className="font-semibold text-yellow-600">
                {getStatusCount(stats?.tasksByPriority, 'medium')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Thấp</span>
              <span className="font-semibold">
                {getStatusCount(stats?.tasksByPriority, 'low')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

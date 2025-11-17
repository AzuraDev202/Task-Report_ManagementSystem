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
    
    // Auto refresh every 60 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 60000);

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Dashboard</h1>
          <p className="text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Tổng quan hệ thống quản lý công việc
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              🕒 {lastUpdate.toLocaleTimeString('vi-VN')}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`card bg-gradient-to-br from-blue-500 to-blue-600 text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${refreshing ? 'opacity-50 scale-95' : 'opacity-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Tổng công việc</p>
              <p className="text-4xl font-bold mt-2">{totalTasks}</p>
              <p className="text-blue-200 text-xs mt-2">• Tất cả các tasks</p>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <FiClipboard size={40} className="text-white" />
            </div>
          </div>
        </div>

        <div className={`card bg-gradient-to-br from-green-500 to-emerald-600 text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${refreshing ? 'opacity-50 scale-95' : 'opacity-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Hoàn thành</p>
              <p className="text-4xl font-bold mt-2">
                {getStatusCount(stats?.taskStats, 'completed')}
              </p>
              <p className="text-green-200 text-xs mt-2">• Đã xong</p>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <FiClipboard size={40} className="text-white" />
            </div>
          </div>
        </div>

        <div className={`card bg-gradient-to-br from-amber-500 to-orange-600 text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${refreshing ? 'opacity-50 scale-95' : 'opacity-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Đang xử lý</p>
              <p className="text-4xl font-bold mt-2">
                {getStatusCount(stats?.taskStats, 'in-progress')}
              </p>
              <p className="text-amber-200 text-xs mt-2">• Đang tiến hành</p>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <FiClipboard size={40} className="text-white" />
            </div>
          </div>
        </div>

        <div className={`card bg-gradient-to-br from-red-500 to-rose-600 text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${refreshing ? 'opacity-50 scale-95' : 'opacity-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Quá hạn</p>
              <p className="text-4xl font-bold mt-2">{stats?.overdueTasks || 0}</p>
              <p className="text-red-200 text-xs mt-2">• Cần xử lý</p>
            </div>
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <FiAlertCircle size={40} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            Công việc gần đây
          </h2>
          <Link href="/dashboard/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
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

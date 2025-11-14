'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useDashboard } from '@/contexts/DashboardContext';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const { needsRefresh, clearRefresh, triggerRefresh } = useDashboard();

  const fetchReports = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchReports();
  }, [fetchReports]);

  // Listen for refresh trigger
  useEffect(() => {
    if (needsRefresh) {
      fetchReports(true);
      clearRefresh();
    }
  }, [needsRefresh, fetchReports, clearRefresh]);

  const handleRefresh = () => {
    fetchReports(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(reports.map(report => report._id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports([...selectedReports, reportId]);
    } else {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedReports.length === 0) {
      alert('Vui lòng chọn ít nhất một báo cáo để xóa');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedReports.length} báo cáo đã chọn?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const deletePromises = selectedReports.map(reportId =>
        fetch(`/api/reports/${reportId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;

      if (successCount > 0) {
        alert(`Đã xóa thành công ${successCount}/${selectedReports.length} báo cáo!`);
        setSelectedReports([]);
        triggerRefresh();
        fetchReports(true);
      } else {
        alert('Không thể xóa báo cáo');
      }
    } catch (error) {
      console.error('Error deleting reports:', error);
      alert('Đã xảy ra lỗi khi xóa báo cáo');
    }
  };

  const handleDelete = async (reportId: string, reportTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa báo cáo "${reportTitle}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Xóa báo cáo thành công!');
        triggerRefresh();
        fetchReports(true);
      } else {
        const data = await response.json();
        alert(data.message || 'Không thể xóa báo cáo');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Đã xảy ra lỗi khi xóa báo cáo');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Báo cáo</h1>
          <p className="text-gray-600">Quản lý báo cáo công việc</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && selectedReports.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="btn btn-danger flex items-center gap-2"
            >
              <FiTrash2 />
              Xóa đã chọn ({selectedReports.length})
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
          {user?.role === 'user' && (
            <Link href="/dashboard/reports/new" className="btn btn-primary">
              <FiPlus className="inline mr-2" />
              Tạo báo cáo mới
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        {user?.role === 'admin' && reports.length > 0 && (
          <div className="p-4 border-b">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedReports.length === reports.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Chọn tất cả</span>
            </label>
          </div>
        )}
        {reports.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Chưa có báo cáo nào</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start gap-3">
                  {user?.role === 'admin' && (
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report._id)}
                        onChange={(e) => handleSelectReport(report._id, e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <Link href={`/dashboard/reports/${report._id}`} className="flex-1">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{report.task?.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{report.content}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(report._id, report.title);
                        }}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Xóa"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span>Người tạo: {report.user?.name}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

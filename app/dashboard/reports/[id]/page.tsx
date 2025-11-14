'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUser, FiClock, FiCheckCircle, FiXCircle, FiFile, FiDownload } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useDashboard } from '@/contexts/DashboardContext';

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { triggerRefresh } = useDashboard();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

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
        setReport(data.data);
        setComments(data.data.comments || '');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (newStatus: string) => {
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
          status: newStatus,
          comments: comments 
        }),
      });

      if (response.ok) {
        // Trigger dashboard refresh
        triggerRefresh();
        fetchReport();
      }
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setUpdating(false);
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

  const getStatusText = (status: string) => {
    const text: any = {
      draft: 'Nháp',
      submitted: 'Đã nộp',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    };
    return text[status] || status;
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!report) {
    return <div className="text-center py-12">Không tìm thấy báo cáo</div>;
  }

  const canReview = user?.role === 'manager' && report.status === 'submitted';
  const canEdit = report.user?._id === user?.id && (report.status === 'draft' || report.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports" className="text-gray-600 hover:text-gray-900">
          <FiArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết Báo cáo</h1>
          <p className="text-gray-600">Thông tin báo cáo công việc</p>
        </div>
        {canEdit && (
          <Link href={`/dashboard/reports/${params.id}/edit`} className="btn btn-primary">
            Chỉnh sửa
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                {getStatusText(report.status)}
              </span>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Công việc liên quan</p>
              <p className="font-medium text-gray-900">{report.task?.title}</p>
            </div>

            <div className="prose max-w-none">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Nội dung báo cáo</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{report.content}</p>
            </div>

            {report.attachments && report.attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Tài liệu đính kèm ({report.attachments.length})
                </h3>
                <div className="space-y-2">
                  {report.attachments.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                      <a
                        href={`/uploads/reports/${file.filename}`}
                        download={file.originalName}
                        className="ml-3 text-blue-500 hover:text-blue-700 flex-shrink-0"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FiDownload size={20} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {report.comments && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nhận xét từ quản lý</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{report.comments}</p>
            </div>
          )}

          {canReview && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Duyệt báo cáo</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhận xét
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="input"
                  rows={4}
                  placeholder="Nhập nhận xét về báo cáo..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateReportStatus('approved')}
                  disabled={updating}
                  className="btn btn-primary flex items-center justify-center gap-2"
                >
                  <FiCheckCircle />
                  Phê duyệt
                </button>
                <button
                  onClick={() => updateReportStatus('rejected')}
                  disabled={updating}
                  className="btn btn-danger flex items-center justify-center gap-2"
                >
                  <FiXCircle />
                  Từ chối
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
                  <p className="text-sm text-gray-500">Người tạo</p>
                  <p className="font-medium text-gray-900">{report.user?.name}</p>
                  <p className="text-sm text-gray-600">{report.user?.email}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FiClock className="mr-3 mt-1 text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Ngày tạo</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
              </div>

              {report.submittedDate && (
                <div className="flex items-start">
                  <FiClock className="mr-3 mt-1 text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Ngày nộp</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(report.submittedDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              )}

              {report.reviewedDate && (
                <div className="flex items-start">
                  <FiUser className="mr-3 mt-1 text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Người duyệt</p>
                    <p className="font-medium text-gray-900">{report.reviewedBy?.name}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(report.reviewedDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { FiBell, FiCheckCircle, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <FiBell className="text-blue-600" size={24} />;
      case 'task_updated':
        return <FiClock className="text-yellow-600" size={24} />;
      case 'report_submitted':
        return <FiCheckCircle className="text-green-600" size={24} />;
      case 'report_reviewed':
        return <FiCheckCircle className="text-purple-600" size={24} />;
      default:
        return <FiBell className="text-gray-600" size={24} />;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thông báo</h1>
          <p className="text-gray-600">
            Bạn có {unreadCount} thông báo chưa đọc
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAsRead()}
            className="btn btn-secondary"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <FiBell className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`flex items-start p-4 rounded-lg border transition-colors ${
                  notification.isRead
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
                onClick={() => !notification.isRead && markAsRead(notification._id)}
                style={{ cursor: notification.isRead ? 'default' : 'pointer' }}
              >
                <div className="flex-shrink-0 mr-4">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <FiClock className="mr-1" size={12} />
                    {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0">
                    <span className="inline-block w-3 h-3 bg-blue-600 rounded-full"></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiCheck, FiClock, FiClipboard, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 60 seconds (reduced from 30s)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
        
        // successResponse wraps data in { success, message, data }
        const responseData = data.data || {};
        const allNotifications = responseData.notifications || [];
        setNotifications(allNotifications.slice(0, 5)); // Show only 5 latest
        
        // Count unread notifications
        const unread = responseData.unreadCount || 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
        body: JSON.stringify({
          notificationId: notificationId || undefined,
        }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    await markAsRead();
    setLoading(false);
  };

  const deleteAllNotifications = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả thông báo?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <FiClipboard className="text-blue-500" size={20} />;
      case 'task_updated':
        return <FiClipboard className="text-orange-500" size={20} />;
      case 'task_completed':
        return <FiCheckCircle className="text-green-500" size={20} />;
      case 'report_submitted':
        return <FiFileText className="text-blue-500" size={20} />;
      case 'report_reviewed':
        return <FiFileText className="text-purple-500" size={20} />;
      default:
        return <FiBell className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <FiBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Thông báo
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiBell size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification._id);
                      }
                      if (notification.link) {
                        setIsOpen(false);
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <FiClock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </span>
                          {!notification.isRead && (
                            <span className="text-xs text-blue-600 font-medium ml-auto">
                              Mới
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={deleteAllNotifications}
                  disabled={loading}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Xóa tất cả
                </button>
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Xem tất cả
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

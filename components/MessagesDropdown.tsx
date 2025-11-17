'use client';

import { useState, useEffect, useRef } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import Link from 'next/link';

export default function MessagesDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();

    // Only refresh every 60 seconds (reduced from 30s)
    const interval = setInterval(fetchUnreadCount, 60000);
    
    // Listen for custom event from MessagesComponent (primary update method)
    const handleUpdate = () => {
      fetchUnreadCount(true); // Bypass cache to get fresh count
    };
    window.addEventListener('unreadMessagesUpdate', handleUpdate);
    
    // Listen for token changes (login/logout) to refresh count
    const handleTokenChange = () => {
      // Clear and refetch after a short delay to ensure new user context
      setTimeout(() => {
        setUnreadCount(0);
        setTotalUnread(0);
        fetchUnreadCount(true); // Bypass cache for fresh data
      }, 100);
    };
    window.addEventListener('tokenChange', handleTokenChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('unreadMessagesUpdate', handleUpdate);
      window.removeEventListener('tokenChange', handleTokenChange);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async (bypassCache = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUnreadCount(0);
        setTotalUnread(0);
        return;
      }

      const url = bypassCache 
        ? '/api/messages/unread/count?refresh=true'
        : '/api/messages/unread/count';

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (res.status === 401) {
        setUnreadCount(0);
        setTotalUnread(0);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.count); // Number of conversations with unread messages
        setTotalUnread(data.totalUnread || data.count); // Total unread messages
      }
    } catch (error) {
      console.error('Fetch unread count error:', error);
      setUnreadCount(0);
      setTotalUnread(0);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
      >
        <FiMessageSquare size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Tin nhắn</h3>
            {unreadCount > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-blue-600 font-medium">
                  {unreadCount} cuộc trò chuyện có tin nhắn mới
                </p>
                {totalUnread > unreadCount && (
                  <p className="text-xs text-gray-500">
                    Tổng {totalUnread} tin nhắn chưa đọc
                  </p>
                )}
              </div>
            )}
            {unreadCount === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Không có tin nhắn mới
              </p>
            )}
          </div>
          <div className="p-4">
            <Link
              href="/dashboard/messages"
              onClick={() => setIsOpen(false)}
              className="block w-full px-4 py-2 text-center text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition"
            >
              Mở tin nhắn
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

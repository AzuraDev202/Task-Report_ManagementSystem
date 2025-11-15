'use client';

import { useEffect, useState } from 'react';
import MessagesComponent from '@/components/MessagesComponent';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Messages page: checking token...', token ? 'exists' : 'missing');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log('Messages page: user data from API:', data);

        // API returns {success, message, data: {...}} format
        const userData = data.user || data.data;
        
        if (!userData) {
          console.log('No user data found, redirecting to login');
          router.push('/login');
          return;
        }

        // Prevent Admin from accessing messages
        if (userData.role === 'admin') {
          alert('Admin không có quyền truy cập tin nhắn');
          router.push('/dashboard');
          return;
        }

        console.log('Messages page: setting current user:', userData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Fetch user error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('Messages page: currentUser is null, not rendering component');
    return null;
  }

  console.log('Messages page: rendering MessagesComponent with userId:', currentUser.id || currentUser.userId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">💬 Tin nhắn</h1>
        <p className="text-gray-600">
          Giao tiếp với các thành viên trong team
        </p>
      </div>

      <MessagesComponent currentUserId={currentUser.id || currentUser.userId || currentUser._id} />
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FiHome, 
  FiClipboard, 
  FiFileText, 
  FiUsers, 
  FiBell, 
  FiLogOut,
  FiMenu,
  FiX,
  FiMessageSquare
} from 'react-icons/fi';
import { DashboardProvider } from '@/contexts/DashboardContext';
import NotificationDropdown from '@/components/NotificationDropdown';
import MessagesDropdown from '@/components/MessagesDropdown';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Công việc', href: '/dashboard/tasks', icon: FiClipboard },
    { name: 'Báo cáo', href: '/dashboard/reports', icon: FiFileText },
    ...(user.role === 'admin' || user.role === 'manager' 
      ? [{ name: 'Người dùng', href: '/dashboard/users', icon: FiUsers }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h1 className="text-xl font-bold text-primary-600">
              Task Manager
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <FiX size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3" size={20} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <FiLogOut className="mr-3" size={20} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <FiMenu size={24} />
            </button>

            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-semibold text-gray-900">
                Xin chào, {user.name}
              </h2>
            </div>

            {user.role !== 'admin' && (
              <div className="flex items-center gap-2">
                <MessagesDropdown />
                <NotificationDropdown />
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <DashboardProvider>
            {children}
          </DashboardProvider>
        </main>
      </div>
    </div>
  );
}

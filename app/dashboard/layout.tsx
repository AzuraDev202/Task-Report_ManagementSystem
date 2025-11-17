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
    // Clear all user-specific data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear deletedConversations for all users (cleanup)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('deletedConversations_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Trigger custom event for socket disconnection
    window.dispatchEvent(new Event('tokenChange'));
    
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm z-20 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 w-64 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">✓</span>
              </div>
              Task Manager
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white/20 p-1 rounded transition"
            >
              <FiX size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 rounded-xl transition-all duration-200 font-medium group"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="p-2 mr-3 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                  <item.icon size={18} />
                </div>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center mb-3 p-3 bg-white rounded-xl shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium group"
            >
              <FiLogOut className="mr-2 group-hover:scale-110 transition-transform" size={18} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiMenu size={24} />
            </button>

            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
          <div className="animate-fade-in">
            <DashboardProvider>
              {children}
            </DashboardProvider>
          </div>
        </main>
      </div>
    </div>
  );
}

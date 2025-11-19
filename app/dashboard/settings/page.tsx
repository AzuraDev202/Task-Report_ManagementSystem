'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiLock, FiCamera, FiSave } from 'react-icons/fi';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.user || data.data;
        setCurrentUser(user);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          department: user.department || '',
          position: user.position || '',
        });
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      let avatarUrl = currentUser.avatar;

      // Upload avatar if a new file is selected
      if (selectedFile) {
        console.log('Uploading file:', selectedFile.name);
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataUpload,
        });

        const uploadData = await uploadRes.json();
        console.log('Upload response:', uploadData);

        if (uploadRes.ok && uploadData.success) {
          avatarUrl = uploadData.data.url; // Get URL from data object
          console.log('New avatar URL:', avatarUrl);
        } else {
          setMessage({ type: 'error', text: uploadData.message || 'Upload ảnh thất bại!' });
          setSaving(false);
          return;
        }
      }

      // Update user profile
      console.log('Updating user with avatar:', avatarUrl);
      const res = await fetch(`/api/users/${currentUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          avatar: avatarUrl,
        }),
      });

      const data = await res.json();
      console.log('Update response:', data);

      if (res.ok) {
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        // Update localStorage with response data
        const updatedUser = data.data || data;
        console.log('Updated user:', updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setAvatarPreview(null);
        setSelectedFile(null);
        
        // Trigger event to update sidebar avatar
        window.dispatchEvent(new Event('userUpdated'));
        
        // Force re-render with new avatar
        setTimeout(() => {
          fetchUserData();
        }, 100);
      } else {
        setMessage({ type: 'error', text: data.message || 'Cập nhật thất bại!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Đã xảy ra lỗi!' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự!' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${currentUser._id}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Đổi mật khẩu thất bại!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Đã xảy ra lỗi!' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh!' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Kích thước ảnh không được vượt quá 5MB!' });
      return;
    }

    // Store file and show preview
    setSelectedFile(file);
    setMessage({ type: '', text: '' });
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cài đặt tài khoản</h1>
        <p className="text-gray-600">Quản lý thông tin cá nhân và bảo mật</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Avatar Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Ảnh đại diện</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-3xl ${
              (avatarPreview || currentUser?.avatar)
                ? 'bg-transparent' 
                : currentUser?.role === 'admin' 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : currentUser?.role === 'manager'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600'
            } shadow-lg`}>
              {(avatarPreview || currentUser?.avatar) ? (
                <img
                  src={avatarPreview || currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                currentUser?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <label 
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
            >
              <FiCamera size={20} />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={saving}
              />
            </label>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{currentUser?.name}</h3>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
            <p className="text-xs text-gray-400 mt-2">
              Định dạng: JPG, PNG, GIF (Tối đa 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Thông tin cá nhân</h2>
        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiUser className="inline mr-2" />
                Họ và tên *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiMail className="inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiPhone className="inline mr-2" />
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                placeholder="0912345678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiBriefcase className="inline mr-2" />
                Phòng ban
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiBriefcase className="inline mr-2" />
                Chức vụ
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              <FiSave className="inline mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Đổi mật khẩu</h2>
        <form onSubmit={handleSubmitPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiLock className="inline mr-2" />
              Mật khẩu hiện tại *
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiLock className="inline mr-2" />
              Mật khẩu mới *
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="input"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiLock className="inline mr-2" />
              Xác nhận mật khẩu mới *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="input"
              required
              minLength={6}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              <FiLock className="inline mr-2" />
              {saving ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="card bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Thông tin tài khoản</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Vai trò:</span>
            <span className={`font-medium px-3 py-1 rounded-full ${
              currentUser?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
              currentUser?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {currentUser?.role === 'admin' ? 'Admin' : 
               currentUser?.role === 'manager' ? 'Manager' : 'User'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ngày tạo:</span>
            <span className="font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">{new Date(currentUser?.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Trạng thái:</span>
            <span className={`font-medium px-3 py-1 rounded-full ${
              currentUser?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {currentUser?.isActive ? 'Hoạt động' : 'Không hoạt động'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

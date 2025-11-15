'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiUser, FiMessageSquare, FiUserPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  isLastMessageFromMe: boolean;
  unreadCount: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatar?: string;
}

interface MessagesComponentProps {
  currentUserId: string;
}

export default function MessagesComponent({ currentUserId }: MessagesComponentProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserInfo, setOtherUserInfo] = useState<any>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching conversations, token:', token ? 'exists' : 'missing');
      if (!token) {
        console.log('No token found, skipping fetch');
        return;
      }

      const res = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Conversations response status:', res.status);
      const data = await res.json();
      console.log('Conversations data:', data);
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
    }
  };

  // Fetch messages with specific user
  const fetchMessages = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setOtherUserInfo(data.otherUser);
        // Update conversation list (mark as read)
        fetchConversations();
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedUser,
          content: newMessage.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.message]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // Select conversation
  const handleSelectUser = (userId: string) => {
    setSelectedUser(userId);
    fetchMessages(userId);
    setShowNewChatModal(false);
  };

  // Delete conversation
  const handleDeleteConversation = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation
    
    if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này? Tất cả tin nhắn sẽ bị xóa vĩnh viễn.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/messages/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Remove from conversations list
        setConversations(conversations.filter(c => c.userId !== userId));
        
        // Clear selected if this was the selected conversation
        if (selectedUser === userId) {
          setSelectedUser(null);
          setMessages([]);
          setOtherUserInfo(null);
        }
        
        alert('Đã xóa cuộc trò chuyện');
      } else {
        alert('Không thể xóa cuộc trò chuyện');
      }
    } catch (error) {
      console.error('Delete conversation error:', error);
      alert('Không thể xóa cuộc trò chuyện');
    }
  };

  // Fetch available users for new chat
  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/messages/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setAvailableUsers(data.users);
      }
    } catch (error) {
      console.error('Fetch available users error:', error);
    }
  };

  // Open new chat modal
  const handleNewChat = () => {
    setShowNewChatModal(true);
    fetchAvailableUsers();
  };

  // Filter users based on search
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial load
  useEffect(() => {
    console.log('MessagesComponent mounted, fetching conversations...');
    fetchConversations();
    setLoading(false);

    // Auto refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('Auto refresh conversations...');
      fetchConversations();
      if (selectedUser) {
        fetchMessages(selectedUser);
      }
    }, 10000);

    return () => {
      console.log('MessagesComponent unmounting, clearing interval');
      clearInterval(interval);
    };
  }, [selectedUser]);

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <>
      <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-md overflow-hidden">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiMessageSquare className="text-blue-500" />
              Tin nhắn
            </h2>
            <button
              onClick={handleNewChat}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition"
              title="Tin nhắn mới"
            >
              <FiUserPlus size={20} />
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiMessageSquare className="mx-auto text-4xl mb-2 text-gray-300" />
              <p className="mb-4">Chưa có cuộc hội thoại nào</p>
              <button
                onClick={handleNewChat}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Bắt đầu trò chuyện
              </button>
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
              <div
                key={conv.userId}
                className={`relative group w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                  selectedUser === conv.userId ? 'bg-blue-50' : ''
                }`}
              >
                <button
                  onClick={() => handleSelectUser(conv.userId)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {conv.avatar ? (
                        <img
                          src={conv.avatar}
                          alt={conv.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FiUser size={24} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {conv.name}
                        </h3>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {conv.role === 'manager' ? '🏢 Manager' : '👤 User'}
                    </p>
                    <p
                      className={`text-sm truncate ${
                        conv.unreadCount > 0 && !conv.isLastMessageFromMe
                          ? 'text-gray-900 font-semibold'
                          : 'text-gray-600'
                      }`}
                    >
                      {conv.isLastMessageFromMe ? 'Bạn: ' : ''}
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(conv.lastMessageTime), 'HH:mm - dd/MM/yyyy', {
                        locale: vi,
                      })}
                    </p>
                  </div>
                </div>
              </button>
              
              {/* Delete button */}
              <button
                onClick={(e) => handleDeleteConversation(conv.userId, e)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa cuộc trò chuyện"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser && otherUserInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {otherUserInfo.avatar ? (
                    <img
                      src={otherUserInfo.avatar}
                      alt={otherUserInfo.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FiUser size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {otherUserInfo.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {otherUserInfo.role === 'manager' ? '🏢 Manager' : '👤 User'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  Chưa có tin nhắn. Bắt đầu cuộc hội thoại!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender._id === currentUserId;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isMe
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: vi })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-gray-200 bg-white"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  maxLength={1000}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiSend />
                  Gửi
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {newMessage.length}/1000 ký tự
              </p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FiMessageSquare className="mx-auto text-6xl mb-4" />
              <p className="text-lg">Chọn một cuộc hội thoại để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* New Chat Modal */}
    {showNewChatModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Tin nhắn mới</h3>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4">
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy người dùng
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user._id)}
                      className="w-full p-3 hover:bg-gray-50 rounded-lg transition text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <FiUser size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {user.name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role === 'manager' ? '🏢 Manager' : '👤 User'}
                          {user.department && ` • ${user.department}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

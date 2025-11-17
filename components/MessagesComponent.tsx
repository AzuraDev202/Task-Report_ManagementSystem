'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { FiSend, FiUser, FiMessageSquare, FiUserPlus, FiSearch, FiTrash2, FiPaperclip, FiImage, FiSmile, FiUsers, FiMoreVertical, FiLogOut, FiInfo, FiCornerUpLeft, FiX, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { RiMessengerLine } from 'react-icons/ri';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { useSocket } from '@/context/SocketContext';
import ConversationItem from './ConversationItem';
import MessageBubble from './MessageBubble';
import ReactionPicker from './ReactionPicker';
import ReactionSummary from './ReactionSummary';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">Loading...</div>
});

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
  attachments?: Array<{
    filename: string;
    originalName: string;
    path: string;
    mimetype: string;
    size: number;
  }>;
  isRead: boolean;
  createdAt: string;
  // New fields for Messenger-like features
  reactions?: Array<{
    userId: string;
    type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
    createdAt: Date;
  }>;
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      name: string;
    };
  };
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
  seenBy?: Array<{
    userId: string;
    seenAt: Date;
  }>;
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
  isGroup?: boolean;
  groupId?: string;
  members?: string[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  avatar?: string;
  isOnline?: boolean;
  lastActive?: string;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  createdBy: string;
  createdAt: string;
}

interface MessagesComponentProps {
  currentUserId: string;
}

export default function MessagesComponent({ currentUserId }: MessagesComponentProps) {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserInfo, setOtherUserInfo] = useState<any>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  // New states for Messenger-like features
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userLastSeen, setUserLastSeen] = useState<Map<string, Date>>(new Map());
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: boolean}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const conversationsCacheRef = useRef<{ data: Conversation[]; timestamp: number } | null>(null);
  const updateBadgeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced badge update to prevent excessive calls
  const debouncedUpdateBadge = useCallback(() => {
    if (updateBadgeDebounceRef.current) {
      clearTimeout(updateBadgeDebounceRef.current);
    }
    updateBadgeDebounceRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdate'));
    }, 500); // Wait 500ms before updating badge
  }, []);

  // Memoized conversations cache with 30s TTL
  const getCachedConversations = useCallback(() => {
    const cache = conversationsCacheRef.current;
    if (cache && Date.now() - cache.timestamp < 30000) {
      return cache.data;
    }
    return null;
  }, []);

  const setCachedConversations = useCallback((data: Conversation[]) => {
    conversationsCacheRef.current = {
      data,
      timestamp: Date.now()
    };
  }, []);

  // Fetch conversations with caching
  const fetchConversations = useCallback(async (skipCache = false) => {
    // Check cache first (unless explicitly skipped)
    if (!skipCache) {
      const cached = getCachedConversations();
      if (cached) {
        setConversations(cached);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      // Get list of deleted conversation IDs from localStorage (per user)
      const deletedConversationsKey = `deletedConversations_${currentUserId}`;
      const deletedConversations = JSON.parse(localStorage.getItem(deletedConversationsKey) || '[]');

      // Fetch 1-1 conversations
      const res = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      let allConversations: Conversation[] = [];
      
      if (data.success) {
        // Filter out deleted conversations
        allConversations = data.conversations.filter((conv: Conversation) => 
          !deletedConversations.includes(conv.userId)
        );
      }

      // Fetch group conversations
      try {
        const groupRes = await fetch('/api/groups', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          
          if (groupData.success && groupData.data) {
            // Convert groups to conversation format and filter deleted
            const groupConversations: Conversation[] = groupData.data
              .filter((group: any) => !deletedConversations.includes(group._id))
              .map((group: any) => ({
                userId: group._id,
                name: group.name,
                email: '',
                role: 'group',
                avatar: group.avatar || '',
                lastMessage: '',
                lastMessageTime: group.updatedAt || group.createdAt,
                isLastMessageFromMe: false,
                unreadCount: 0,
                isGroup: true,
                groupId: group._id,
                members: group.members.map((m: any) => m._id || m),
              }));
            
            allConversations = [...allConversations, ...groupConversations];
          }
        }
      } catch (groupError) {
        console.error('Fetch groups error:', groupError);
      }

      setConversations(allConversations);
      setCachedConversations(allConversations);
    } catch (error) {
      console.error('Fetch conversations error:', error);
    }
  }, [getCachedConversations, setCachedConversations]);

  // Fetch messages with specific user - memoized
  const fetchMessages = useCallback(async (userId: string) => {
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
        
        // Update the specific conversation's unreadCount to 0 immediately
        setConversations(prev => 
          prev.map(conv => 
            conv.userId === userId 
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
        
        // Update badge immediately (server has marked messages as read)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdate'));
        }, 500);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  }, []);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedUser || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Check if this is a group chat
      const selectedConv = conversations.find(c => c.userId === selectedUser);
      const isGroup = selectedConv?.isGroup;

      const formData = new FormData();
      
      if (isGroup) {
        // For group messages
        formData.append('groupId', selectedUser);
      } else {
        // For 1-1 messages
        formData.append('receiverId', selectedUser);
      }
      
      formData.append('content', newMessage.trim());
      
      // Append files
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Use different endpoint for group messages
      const endpoint = isGroup ? '/api/groups/messages' : '/api/messages';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.message]);
        setNewMessage('');
        setSelectedFiles([]);
        setShowEmojiPicker(false);
        
        // Remove from deleted conversations list if it was there
        const deletedConversationsKey = `deletedConversations_${currentUserId}`;
        const deletedConversations = JSON.parse(localStorage.getItem(deletedConversationsKey) || '[]');
        if (deletedConversations.includes(selectedUser)) {
          const updated = deletedConversations.filter((id: string) => id !== selectedUser);
          localStorage.setItem(deletedConversationsKey, JSON.stringify(updated));
        }
        
        // Don't fetch conversations here - socket will update it
        // This reduces unnecessary API calls
      } else {
        alert(data.message || 'Không thể gửi tin nhắn');
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator with throttling
  const handleTyping = useCallback(() => {
    if (!socket || !selectedUser) return;

    const selectedConv = conversations.find(c => c.userId === selectedUser);
    const isGroup = selectedConv?.isGroup;

    // Emit typing event
    socket.emit('typing', {
      userId: currentUserId,
      conversationId: selectedUser,
      isGroup: isGroup || false
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        userId: currentUserId,
        conversationId: selectedUser,
        isGroup: isGroup || false
      });
    }, 3000);
  }, [socket, selectedUser, conversations, currentUserId]);

  // Show browser notification
  const showNotification = (title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body.substring(0, 100), // Limit body length
        icon: icon || '/logo.png',
        badge: '/logo.png',
        tag: 'message-notification',
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  };

  // Delete single message (for me only)
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Xóa tin nhắn này? (Chỉ xóa phía bạn)')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/messages/delete/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        // Remove message from UI
        setMessages(messages.filter(m => m._id !== messageId));
        
        // Refresh conversations to update last message
        fetchConversations();
      } else {
        alert(data.error || 'Không thể xóa tin nhắn');
      }
    } catch (error) {
      console.error('Delete message error:', error);
      alert('Không thể xóa tin nhắn');
    }
  };

  // Add reaction to message
  const handleAddReaction = async (messageId: string, reactionType: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/messages/message/${messageId}/reaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reactionType }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        // Update message in local state
        setMessages(prevMessages =>
          prevMessages.map(m =>
            m._id === messageId ? { ...m, reactions: data.message.reactions } : m
          )
        );
      }
    } catch (error) {
      console.error('Add reaction error:', error);
    }
  };

  // Remove reaction from message
  const handleRemoveReaction = async (messageId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/messages/message/${messageId}/reaction`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success && data.message) {
        // Update message in local state
        setMessages(prevMessages =>
          prevMessages.map(m =>
            m._id === messageId ? { ...m, reactions: data.message.reactions } : m
          )
        );
      }
    } catch (error) {
      console.error('Remove reaction error:', error);
    }
  };

  // Select conversation
  const handleSelectUser = async (userId: string) => {
    setSelectedUser(userId);
    
    // Check if conversation exists
    const existingConv = conversations.find(c => c.userId === userId);
    
    // Track if this conversation has unread messages to trigger badge update
    const hadUnreadMessages = existingConv && existingConv.unreadCount > 0;
    
    if (!existingConv) {
      // This is a new conversation - create a temporary conversation immediately
      const selectedUserData = availableUsers.find(u => u._id === userId);
      if (selectedUserData) {
        const tempConversation: Conversation = {
          userId: selectedUserData._id,
          name: selectedUserData.name,
          email: selectedUserData.email,
          role: selectedUserData.role,
          avatar: selectedUserData.avatar || '',
          lastMessage: '',
          lastMessageTime: new Date().toISOString(),
          isLastMessageFromMe: false,
          unreadCount: 0,
          isGroup: false,
        };
        
        // Add temporary conversation to the list immediately
        setConversations(prev => [tempConversation, ...prev]);
        
        // Set otherUserInfo immediately for the chat area
        setOtherUserInfo({
          _id: selectedUserData._id,
          name: selectedUserData.name,
          email: selectedUserData.email,
          role: selectedUserData.role,
          avatar: selectedUserData.avatar,
        });
      }
    } else {
      // Conversation exists - update unreadCount to 0
      setConversations(prev => 
        prev.map(conv => 
          conv.userId === userId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    }
    
    // Check if this is a group chat
    const selectedConv = conversations.find(c => c.userId === userId);
    if (selectedConv?.isGroup) {
      // For group chat, set otherUserInfo from conversation data
      setOtherUserInfo({
        _id: selectedConv.userId,
        name: selectedConv.name,
        email: selectedConv.email || '',
        role: 'group',
        avatar: selectedConv.avatar,
      });
      // Fetch group messages
      fetchGroupMessages(userId);
    } else {
      // For 1-1 chat, fetch messages normally
      fetchMessages(userId);
    }
    
    // If conversation had unread messages, update badge after database updates
    if (hadUnreadMessages) {
      // Wait for server to mark messages as read and database to commit
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdate'));
      }, 600);
    }
    
    setShowNewChatModal(false);
    setShowEmojiPicker(false);
    setSelectedFiles([]);
  };

  // Fetch group messages - memoized
  const fetchGroupMessages = useCallback(async (groupId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/groups/messages?groupId=${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        
        // Update the specific conversation's unreadCount to 0 immediately
        setConversations(prev => 
          prev.map(conv => 
            conv.userId === groupId 
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
        
        // Update badge immediately (server has marked messages as read)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdate'));
        }, 500);
      }
    } catch (error) {
      console.error('Fetch group messages error:', error);
    }
  }, []);

  // Handle emoji select - memoized
  const handleEmojiClick = useCallback((emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  }, []);

  // Handle file selection - memoized
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  // Remove selected file - memoized
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle image selection - memoized
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
      );
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  // Delete conversation (for me only)
  const handleDeleteConversation = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation
    
    // Check if this is a group
    const selectedConv = conversations.find(c => c.userId === userId);
    const isGroup = selectedConv?.isGroup;
    
    const confirmMessage = isGroup 
      ? 'Xóa toàn bộ tin nhắn trong nhóm này? (Chỉ xóa phía bạn, các thành viên khác vẫn thấy tin nhắn)'
      : 'Xóa toàn bộ cuộc trò chuyện này? (Chỉ xóa phía bạn, người kia vẫn thấy tin nhắn)';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (isGroup) {
        // For group: delete all messages for this user only
        const res = await fetch(`/api/groups/${userId}/delete-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          // Add to deleted conversations list in localStorage
          const deletedConversationsKey = `deletedConversations_${currentUserId}`;
          const deletedConversations = JSON.parse(localStorage.getItem(deletedConversationsKey) || '[]');
          if (!deletedConversations.includes(userId)) {
            deletedConversations.push(userId);
            localStorage.setItem(deletedConversationsKey, JSON.stringify(deletedConversations));
          }
          
          // Remove from conversations list locally
          setConversations(conversations.filter(c => c.userId !== userId));
          
          // Clear selected if this was the selected conversation
          if (selectedUser === userId) {
            setSelectedUser(null);
            setMessages([]);
            setOtherUserInfo(null);
          }
          
          const data = await res.json();
          alert(data.message || `Đã xóa ${data.updatedCount} tin nhắn khỏi phía bạn`);
        } else {
          alert('Không thể xóa tin nhắn');
        }
      } else {
        // For 1-1: delete all messages for current user only
        const res = await fetch(`/api/messages/${userId}/delete-conversation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          // Add to deleted conversations list in localStorage
          const deletedConversationsKey = `deletedConversations_${currentUserId}`;
          const deletedConversations = JSON.parse(localStorage.getItem(deletedConversationsKey) || '[]');
          if (!deletedConversations.includes(userId)) {
            deletedConversations.push(userId);
            localStorage.setItem(deletedConversationsKey, JSON.stringify(deletedConversations));
          }
          
          // Remove from conversations list
          setConversations(conversations.filter(c => c.userId !== userId));
          
          // Clear selected if this was the selected conversation
          if (selectedUser === userId) {
            setSelectedUser(null);
            setMessages([]);
            setOtherUserInfo(null);
          }
          
          const data = await res.json();
          alert(data.message || 'Đã xóa cuộc trò chuyện khỏi phía bạn');
        } else {
          alert('Không thể xóa cuộc trò chuyện');
        }
      }
    } catch (error) {
      console.error('Delete conversation error:', error);
      alert('Không thể xóa cuộc trò chuyện');
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (!selectedUser || !confirm('Bạn có chắc muốn rời khỏi nhóm này? Bạn sẽ không thể xem hoặc gửi tin nhắn nữa.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`/api/groups/${selectedUser}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Remove from conversations list
        setConversations(conversations.filter(c => c.userId !== selectedUser));
        
        // Clear selected
        setSelectedUser(null);
        setMessages([]);
        setOtherUserInfo(null);
        setShowGroupMenu(false);
        
        alert('Đã rời khỏi nhóm');
      } else {
        const data = await res.json();
        alert(data.message || 'Không thể rời khỏi nhóm');
      }
    } catch (error) {
      console.error('Leave group error:', error);
      alert('Không thể rời khỏi nhóm');
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
    setShowNewGroupModal(false);
    fetchAvailableUsers();
  };

  // Open new group modal
  const handleNewGroup = () => {
    setShowNewGroupModal(true);
    setShowNewChatModal(false);
    setSelectedMembers([]);
    setGroupName('');
    setGroupDescription('');
    fetchAvailableUsers();
  };

  // Toggle member selection for group
  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) {
      alert('Vui lòng nhập tên nhóm và chọn ít nhất 2 thành viên');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          members: selectedMembers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Immediately add the new group to the conversation list for the creator
        const newGroupConversation: Conversation = {
          userId: data.data._id,
          name: data.data.name,
          email: '',
          role: 'group',
          avatar: data.data.avatar || '',
          lastMessage: '',
          lastMessageTime: data.data.createdAt,
          isLastMessageFromMe: false,
          unreadCount: 0,
          isGroup: true,
          groupId: data.data._id,
          members: data.data.members.map((m: any) => m._id || m),
        };
        
        setConversations(prev => [newGroupConversation, ...prev]);
        
        setShowNewGroupModal(false);
        setGroupName('');
        setGroupDescription('');
        setSelectedMembers([]);
        alert('Tạo nhóm thành công!');
      } else {
        alert(data.message || 'Không thể tạo nhóm');
      }
    } catch (error) {
      alert('Không thể tạo nhóm');
    }
  };

  // Filter users based on search and filters - memoized
  const filteredUsers = useMemo(() => {
    return availableUsers.filter(user => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.department?.toLowerCase().includes(searchLower) ||
        user.position?.toLowerCase().includes(searchLower);
      
      // Department filter
      const matchDepartment = filterDepartment === 'all' || user.department === filterDepartment;
      
      // Role filter
      const matchRole = filterRole === 'all' || user.role === filterRole;
      
      // Online filter
      const matchOnline = !showOnlineOnly || user.isOnline;
      
      return matchSearch && matchDepartment && matchRole && matchOnline;
    });
  }, [availableUsers, searchQuery, filterDepartment, filterRole, showOnlineOnly]);

  // Get unique departments - memoized
  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(availableUsers.map(u => u.department).filter(Boolean))) as string[];
  }, [availableUsers]);

  // Group users by department for better display - memoized
  const usersByDepartment = useMemo(() => {
    return filteredUsers.reduce((acc, user) => {
      const dept = user.department || 'Chưa phân loại';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(user);
      return acc;
    }, {} as Record<string, User[]>);
  }, [filteredUsers]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket.io event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join user's personal room
    socket.emit('join', currentUserId);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Listen for new 1-1 messages
    socket.on('newMessage', (data: { message: Message; senderId: string }) => {
      // Remove sender from deleted conversations list (new message should restore conversation)
      const deletedConversations = JSON.parse(localStorage.getItem('deletedConversations') || '[]');
      if (deletedConversations.includes(data.senderId)) {
        const updated = deletedConversations.filter((id: string) => id !== data.senderId);
        localStorage.setItem('deletedConversations', JSON.stringify(updated));
      }
      
      // If this message is for the current conversation, add it
      if (selectedUser && (data.senderId === selectedUser || data.message.sender._id === selectedUser)) {
        setMessages(prev => [...prev, data.message]);
      }
      
      // Show browser notification if user is not on the page or not viewing this chat
      if (document.hidden || selectedUser !== data.senderId) {
        showNotification(
          data.message.sender.name,
          data.message.content || '[File đính kèm]',
          data.message.sender.avatar
        );
      }
      
      // Wait a bit for server to save the message, then refresh conversations
      setTimeout(() => {
        fetchConversations(true);
        // Update badge after conversations are refreshed
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdate'));
      }, 200);
    });

    // Listen for new group messages
    socket.on('newGroupMessage', (data: { message: Message; groupId: string; senderId: string }) => {
      // Remove group from deleted conversations list (new message should restore conversation)
      const deletedConversations = JSON.parse(localStorage.getItem('deletedConversations') || '[]');
      if (deletedConversations.includes(data.groupId)) {
        const updated = deletedConversations.filter((id: string) => id !== data.groupId);
        localStorage.setItem('deletedConversations', JSON.stringify(updated));
      }
      
      // If this is for the current group conversation, add it
      if (selectedUser && selectedUser === data.groupId) {
        setMessages(prev => [...prev, data.message]);
      }
      
      // Show notification for group messages if not viewing the group
      if (document.hidden || selectedUser !== data.groupId) {
        const groupConv = conversations.find(c => c.userId === data.groupId);
        showNotification(
          `${groupConv?.name || 'Nhóm'} - ${data.message.sender.name}`,
          data.message.content || '[File đính kèm]',
          groupConv?.avatar
        );
      }
      
      // Wait a bit for server to save the message, then refresh conversations
      setTimeout(() => {
        fetchConversations(true);
        // Update badge after conversations are refreshed
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdate'));
      }, 200);
    });

    // Listen for typing indicators
    socket.on('userTyping', ({ userId }: { userId: string; conversationId: string }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: true }));
    });

    socket.on('userStoppedTyping', ({ userId }: { userId: string; conversationId: string }) => {
      setTypingUsers(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    });

    // Listen for group created event
    socket.on('groupCreated', ({ group, creatorId }: { group: any; creatorId: string }) => {
      // Only add group for members who didn't create it (creator already added it locally)
      if (creatorId !== currentUserId) {
        const newGroupConversation: Conversation = {
          userId: group._id,
          name: group.name,
          email: '',
          role: 'group',
          avatar: group.avatar || '',
          lastMessage: '',
          lastMessageTime: group.createdAt,
          isLastMessageFromMe: false,
          unreadCount: 0,
          isGroup: true,
          groupId: group._id,
          members: group.members.map((m: any) => m._id || m),
        };
        
        setConversations(prev => [newGroupConversation, ...prev]);
        
        // Show notification
        showNotification(
          'Nhóm mới',
          `Bạn đã được thêm vào nhóm "${group.name}"`,
          group.avatar
        );
      }
    });

    return () => {
      socket.off('newMessage');
      socket.off('newGroupMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      socket.off('groupCreated');
    };
  }, [socket, isConnected, currentUserId, selectedUser]);

  // Join/leave group rooms when selecting conversations
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const selectedConv = conversations.find(c => c.userId === selectedUser);
    
    if (selectedConv?.isGroup) {
      // Join group room
      socket.emit('joinGroup', selectedUser);

      return () => {
        // Leave group room on cleanup
        socket.emit('leaveGroup', selectedUser);
      };
    }
  }, [socket, selectedUser, conversations]);

  // Initial load and reload when user changes
  useEffect(() => {
    // Clear cache and state when user changes
    conversationsCacheRef.current = null;
    setConversations([]);
    setSelectedUser(null);
    setMessages([]);
    setOtherUserInfo(null);
    
    // Fetch fresh conversations
    fetchConversations(true);
    setLoading(false);
  }, [currentUserId, fetchConversations]);

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl shadow-2xl overflow-hidden border border-white/50 backdrop-blur-xl">
      {/* Conversations List */}
      <div className="w-96 border-r border-gray-200/50 flex flex-col bg-white/80 backdrop-blur-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/30">
                <RiMessengerLine className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Tin nhắn
                </h2>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-[1.02]"
            >
              <FiUserPlus size={18} />
              <span>Trò chuyện 1-1</span>
            </button>
            <button
              onClick={handleNewGroup}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white rounded-xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 transition-all duration-300 font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transform hover:scale-[1.02]"
            >
              <FiUsers size={18} />
              <span>Tạo nhóm</span>
            </button>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 mb-4 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-md">
                <FiMessageSquare className="text-blue-500" size={28} />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1.5">Chưa có cuộc hội thoại nào</h3>
              <p className="text-sm text-gray-500 max-w-xs">Bắt đầu trò chuyện với đồng nghiệp của bạn</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.userId}
                  conversation={conv}
                  isSelected={selectedUser === conv.userId}
                  onClick={() => handleSelectUser(conv.userId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
        {selectedUser && otherUserInfo ? (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b border-gray-200/50 bg-gradient-to-r from-white to-blue-50/30 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full ${
                      otherUserInfo.role === 'group' 
                        ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600' 
                        : 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
                    } flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-white`}>
                      {otherUserInfo.role === 'group' ? (
                        <FiUsers size={22} />
                      ) : otherUserInfo.avatar ? (
                        <img
                          src={otherUserInfo.avatar}
                          alt={otherUserInfo.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FiUser size={22} />
                      )}
                    </div>
                    {otherUserInfo.role !== 'group' && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {otherUserInfo.name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      {otherUserInfo.role === 'group' ? (
                        <>
                          <FiUsers size={12} />
                          <span>Nhóm chat</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {otherUserInfo.role === 'manager' ? '🏢 Manager' : '👤 User'} • Đang hoạt động
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Group Menu - Only show for groups */}
                {otherUserInfo.role === 'group' ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowGroupMenu(!showGroupMenu)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Tùy chọn nhóm"
                    >
                      <FiMoreVertical size={20} className="text-gray-600" />
                    </button>

                    {showGroupMenu && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowGroupMenu(false)}
                        />
                        
                        {/* Menu */}
                        <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                          <button
                            onClick={() => {
                              setShowGroupMenu(false);
                              // TODO: Show group info modal
                              alert('Tính năng thông tin nhóm đang được phát triển');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                          >
                            <FiInfo size={18} className="text-blue-500" />
                            <span className="font-medium">Thông tin nhóm</span>
                          </button>
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          <button
                            onClick={(e) => {
                              setShowGroupMenu(false);
                              handleDeleteConversation(selectedUser!, e);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center gap-3 text-orange-600 transition-colors"
                          >
                            <FiTrash2 size={18} />
                            <span className="font-medium">Xóa toàn bộ tin nhắn</span>
                          </button>
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          <button
                            onClick={() => {
                              setShowGroupMenu(false);
                              handleLeaveGroup();
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
                          >
                            <FiLogOut size={18} />
                            <span className="font-medium">Rời khỏi nhóm</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleDeleteConversation(selectedUser!, e)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                    title="Xóa toàn bộ cuộc trò chuyện (chỉ phía bạn)"
                  >
                    <FiTrash2 size={20} className="text-gray-400 group-hover:text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white/50 to-blue-50/20">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <FiMessageSquare className="text-blue-500" size={36} />
                  </div>
                  <p className="text-gray-500 text-sm">Chưa có tin nhắn. Bắt đầu cuộc hội thoại!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isMe={msg.sender._id === currentUserId}
                    isGroupChat={otherUserInfo?.role === 'group'}
                    currentUserId={currentUserId}
                    onDelete={() => handleDeleteMessage(msg._id)}
                    onReaction={handleAddReaction}
                    onRemoveReaction={handleRemoveReaction}
                  />
                ))
              )}
              
              {/* Typing indicator */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex justify-start mb-4 px-4">
                  <div className="bg-gray-200 rounded-2xl px-4 py-2 max-w-[70%]">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-5 border-t border-gray-200/50 bg-white backdrop-blur-md"
            >
              {/* Selected files preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg text-sm"
                    >
                      <span className="text-gray-700 truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-end">
                {/* File upload buttons */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Đính kèm file"
                  >
                    <FiPaperclip size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Đính kèm ảnh"
                  >
                    <FiImage size={20} />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    accept="image/*"
                  />

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Chọn emoji"
                    >
                      <FiSmile size={20} />
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden">
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          width={320}
                          height={400}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Nhập tin nhắn..."
                  maxLength={1000}
                  className="flex-1 px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white transition-colors shadow-sm"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-[1.02]"
                >
                  <FiSend />
                  Gửi
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {newMessage.length}/1000 ký tự
                {selectedFiles.length > 0 && ` • ${selectedFiles.length} file đính kèm`}
              </p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="text-center relative">
              {/* Decorative circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5">
                  <FiMessageSquare className="text-4xl text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2.5">
                  Bắt đầu trò chuyện
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                  Chọn một cuộc hội thoại từ danh sách bên trái hoặc tạo cuộc hội thoại mới để bắt đầu
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 animate-fade-in p-4 pt-8 sm:pt-12 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto mb-8 flex flex-col overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <FiUsers className="text-xl sm:text-2xl" />
                <span className="hidden sm:inline">Tạo nhóm mới</span>
                <span className="sm:hidden">Tạo nhóm</span>
              </h3>
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {/* Group Info */}
              <div className="mb-3 sm:mb-4 space-y-2.5 sm:space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Tên nhóm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Nhập tên nhóm..."
                    maxLength={100}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base text-gray-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Mô tả về nhóm..."
                    maxLength={500}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none text-sm sm:text-base text-gray-700 bg-white"
                  />
                </div>
              </div>

              {/* Members Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Chọn thành viên <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(Tối thiểu 2)</span>
                </label>
                <div className="text-xs text-gray-500 mb-2 sm:mb-3 bg-emerald-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span>Đã chọn: <span className="font-semibold text-emerald-700">{selectedMembers.length}</span> thành viên</span>
                  <span className="text-gray-400">Tìm thấy: {filteredUsers.length}</span>
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 sm:mb-3">
                  {/* Department Filter */}
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-gray-700 bg-white"
                  >
                    <option value="all">📂 Phòng ban</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  {/* Role Filter */}
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-gray-700 bg-white"
                  >
                    <option value="all">👥 Vai trò</option>
                    <option value="manager">Manager</option>
                    <option value="user">Nhân viên</option>
                  </select>

                  {/* Online Filter */}
                  <label className="col-span-2 flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition bg-white">
                    <input
                      type="checkbox"
                      checked={showOnlineOnly}
                      onChange={(e) => setShowOnlineOnly(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">Online</span>
                    <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
                  </label>
                </div>

                {/* Search */}
                <div className="relative mb-2 sm:mb-3">
                  <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, phòng ban, chức vụ..."
                    defaultValue={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm sm:text-base text-gray-700 bg-white"
                  />
                </div>

                {/* User List - Grouped by Department */}
                <div className="max-h-32 sm:max-h-40 overflow-y-auto border-2 border-gray-100 rounded-xl p-1.5 sm:p-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">
                      <div className="mb-2">🔍</div>
                      <div>Không tìm thấy người dùng phù hợp</div>
                      <div className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(usersByDepartment).map(([department, users]) => (
                        <div key={department}>
                          {/* Department Header */}
                          <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-2 py-1 rounded-lg mb-1 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              📂 {department}
                            </span>
                            <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded-full font-semibold">
                              {users.length}
                            </span>
                          </div>
                          
                          {/* Users in Department */}
                          <div className="space-y-1">
                            {users.map((user) => (
                              <label
                                key={user._id}
                                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                                  selectedMembers.includes(user._id)
                                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200'
                                    : 'hover:bg-gray-50 border-2 border-transparent'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedMembers.includes(user._id)}
                                  onChange={() => toggleMemberSelection(user._id)}
                                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 flex-shrink-0"
                                />
                                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                  {user.avatar ? (
                                    <img
                                      src={user.avatar}
                                      alt={user.name}
                                      className="w-full h-full rounded-lg sm:rounded-xl object-cover"
                                    />
                                  ) : (
                                    <FiUser size={14} className="sm:w-4 sm:h-4" />
                                  )}
                                  {/* Online indicator */}
                                  {user.isOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-semibold text-gray-800 truncate text-xs sm:text-sm leading-tight">
                                      {user.name}
                                    </h4>
                                    {user.isOnline && (
                                      <span className="text-xs text-green-600 flex-shrink-0">●</span>
                                    )}
                                  </div>
                                  {user.position && (
                                    <p className="text-xs text-gray-600 truncate leading-tight font-medium">
                                      {user.position}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-600 truncate hidden sm:block leading-tight">
                                    {user.email}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    user.role === 'manager' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {user.role === 'manager' ? '🏢' : '👤'}
                                  </span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-white transition font-medium text-sm sm:text-base"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedMembers.length < 2}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white rounded-xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-medium shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <FiUsers className="text-base sm:text-lg" />
                <span className="hidden sm:inline">Tạo nhóm</span>
                <span className="sm:hidden">Tạo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 animate-fade-in pt-8 sm:pt-12 pb-8 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 my-auto overflow-hidden animate-slide-in">
          {/* Header with gradient */}
          <div className="p-5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FiMessageSquare className="text-2xl" />
              Tin nhắn mới
            </h3>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              ✕
            </button>
          </div>
          
          <div className="p-5">
            {/* Filters */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
              >
                <option value="all">📂 Phòng ban</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
              >
                <option value="all">👥 Vai trò</option>
                <option value="manager">Manager</option>
                <option value="user">Nhân viên</option>
              </select>

              <label className="flex items-center gap-1.5 px-2 py-2 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm bg-white">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs text-gray-700 font-medium">Online</span>
                <span className="w-2 h-2 bg-green-500 rounded-full ml-auto"></span>
              </label>
            </div>

            {/* Search input */}
            <div className="relative mb-4">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, phòng ban, chức vụ..."
                defaultValue={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm hover:border-gray-300 text-gray-700 bg-white"
              />
            </div>

            {/* Result count */}
            <div className="text-xs text-gray-500 mb-3 px-1">
              Tìm thấy <span className="font-semibold text-blue-600">{filteredUsers.length}</span> người
            </div>

            {/* User list - Grouped by Department */}
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-3xl">🔍</div>
                  </div>
                  <p className="text-gray-500 mb-1">Không tìm thấy người dùng</p>
                  <p className="text-xs text-gray-400">Thử thay đổi bộ lọc hoặc từ khóa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(usersByDepartment).map(([department, users]) => (
                    <div key={department}>
                      {/* Department Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg mb-2 flex items-center justify-between shadow-sm">
                        <span className="text-sm font-bold text-blue-700">
                          📂 {department}
                        </span>
                        <span className="text-xs text-blue-700 bg-white px-2 py-1 rounded-full font-semibold">
                          {users.length}
                        </span>
                      </div>
                      
                      {/* Users */}
                      <div className="space-y-1.5">
                        {users.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => handleSelectUser(user._id)}
                            className="w-full p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 rounded-xl transition-all text-left flex items-center gap-3 border border-transparent hover:border-blue-200 hover:shadow-md group"
                          >
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md group-hover:shadow-lg transition-shadow">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full rounded-xl object-cover"
                                  />
                                ) : (
                                  <FiUser size={24} />
                                )}
                              </div>
                              {/* Online indicator */}
                              {user.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-gray-800 truncate text-base group-hover:text-blue-600 transition">
                                  {user.name}
                                </h4>
                                {user.isOnline && (
                                  <span className="text-xs text-green-600 font-medium">● Online</span>
                                )}
                              </div>
                              {user.position && (
                                <p className="text-sm text-gray-700 truncate font-medium">
                                  {user.position}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 truncate">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  user.role === 'manager' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {user.role === 'manager' ? '🏢 Manager' : '👤 User'}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

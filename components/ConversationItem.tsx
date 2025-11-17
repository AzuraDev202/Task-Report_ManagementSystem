'use client';

import React, { memo, useMemo } from 'react';
import { FiUser, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ConversationItemProps {
  conversation: {
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
  };
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem = memo<ConversationItemProps>(({
  conversation,
  isSelected,
  onClick
}) => {
  // Memoize formatted time
  const formattedTime = useMemo(() => {
    try {
      const date = new Date(conversation.lastMessageTime);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return format(date, 'HH:mm', { locale: vi });
      } else if (diffDays < 7) {
        return format(date, 'EEE', { locale: vi });
      } else {
        return format(date, 'dd/MM', { locale: vi });
      }
    } catch {
      return '';
    }
  }, [conversation.lastMessageTime]);

  // Memoize avatar initials
  const avatarInitials = useMemo(() => {
    return conversation.name.charAt(0).toUpperCase();
  }, [conversation.name]);

  // Memoize truncated message
  const truncatedMessage = useMemo(() => {
    const msg = conversation.lastMessage || 'Chưa có tin nhắn';
    return msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
  }, [conversation.lastMessage]);

  return (
    <div
      onClick={onClick}
      className={`p-4 hover:bg-blue-50/80 cursor-pointer transition-all duration-200 border-l-4 ${
        isSelected
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50/30 border-l-blue-500'
          : 'border-l-transparent'
      } group`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {conversation.avatar ? (
            <img
              src={conversation.avatar}
              alt={conversation.name}
              className="w-12 h-12 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full ${
              conversation.isGroup
                ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600'
                : 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
            } flex items-center justify-center text-white font-semibold shadow-lg`}>
              {conversation.isGroup ? <FiUsers size={20} /> : avatarInitials}
            </div>
          )}
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold truncate ${
              conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {conversation.name}
            </h3>
            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
              {formattedTime}
            </span>
          </div>
          <p className={`text-sm truncate ${
            conversation.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
          }`}>
            {conversation.isLastMessageFromMe && 'Bạn: '}
            {truncatedMessage}
          </p>
        </div>
      </div>
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;

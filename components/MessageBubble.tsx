'use client';

import React, { memo, useMemo, useState, useRef } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FiTrash2, FiPaperclip, FiCornerUpLeft, FiMoreVertical, FiCheck, FiCheckCircle } from 'react-icons/fi';
import ReactionPicker from './ReactionPicker';
import ReactionSummary from './ReactionSummary';

interface MessageBubbleProps {
  message: {
    _id: string;
    sender: {
      _id: string;
      name: string;
      avatar?: string;
    };
    content: string;
    attachments?: Array<{
      filename: string;
      originalName: string;
      path: string;
      mimetype: string;
      size: number;
    }>;
    createdAt: string;
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
  };
  isMe: boolean;
  isGroupChat: boolean;
  currentUserId: string;
  onDelete: (messageId: string) => void;
  onReply?: (message: any) => void;
  onReaction?: (messageId: string, reactionType: string) => void;
  onRemoveReaction?: (messageId: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

const MessageBubble = memo<MessageBubbleProps>(({
  message,
  isMe,
  isGroupChat,
  currentUserId,
  onDelete,
  onReply,
  onReaction,
  onRemoveReaction,
  onScrollToMessage
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPickerBelow, setShowPickerBelow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize formatted time
  const formattedTime = useMemo(() => {
    return format(new Date(message.createdAt), 'HH:mm', { locale: vi });
  }, [message.createdAt]);

  // Memoize avatar initials
  const avatarInitials = useMemo(() => {
    return message.sender.name.charAt(0).toUpperCase();
  }, [message.sender.name]);

  // Check if current user reacted
  const userReaction = message.reactions?.find(r => r.userId === currentUserId);

  const handleReactionButtonClick = () => {
    // Check if message is near top of screen
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      // If less than 250px from top, show picker below
      const shouldShowBelow = spaceAbove < 250;
      setShowPickerBelow(shouldShowBelow);
    }
    setShowReactionPicker(!showReactionPicker);
  };

  const handleReactionSelect = (reactionType: string) => {
    if (userReaction) {
      if (userReaction.type === reactionType) {
        onRemoveReaction?.(message._id);
      } else {
        onReaction?.(message._id, reactionType);
      }
    } else {
      onReaction?.(message._id, reactionType);
    }
    setShowReactionPicker(false);
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!isMe || !message.status) return null;
    
    switch (message.status) {
      case 'sending':
        return <span className="text-xs opacity-60">⏱</span>;
      case 'sent':
        return <FiCheck size={14} className="opacity-60" />;
      case 'delivered':
        return <FiCheckCircle size={14} className="opacity-60" />;
      case 'seen':
        return <FiCheckCircle size={14} className="text-blue-300" />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div className={`flex gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar - only for group messages from others */}
        {isGroupChat && !isMe && (
          <div className="flex-shrink-0">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className="w-8 h-8 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                {avatarInitials}
              </div>
            )}
          </div>
        )}

        <div>
          {/* Sender name for group messages */}
          {isGroupChat && !isMe && (
            <p className="text-xs text-gray-600 font-semibold mb-1 ml-1">
              {message.sender.name}
            </p>
          )}
          
          <div className="relative group overflow-visible" style={{ zIndex: showReactionPicker ? 9997 : 'auto' }}>
            {/* Action buttons - shows on hover */}
            <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 ${
              isMe ? 'left-[-100px]' : 'right-[-100px]'
            }`}>
              <button
                onClick={handleReactionButtonClick}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600"
                title="Thả cảm xúc"
              >
                😊
              </button>
              <button
                onClick={() => onReply?.(message)}
                className="p-1.5 rounded-full hover:bg-gray-200"
                title="Trả lời"
              >
                <FiCornerUpLeft size={14} className="text-gray-600" />
              </button>
              <button
                onClick={() => onDelete(message._id)}
                className="p-1.5 rounded-full hover:bg-red-100"
                title="Xóa"
              >
                <FiTrash2 size={14} className="text-red-500" />
              </button>
            </div>

            {/* Reaction picker */}
            {showReactionPicker && (
              <div className={`absolute z-[9999] ${
                showPickerBelow ? 'top-full mt-2' : 'bottom-full mb-2'
              } ${
                isMe ? 'right-0' : 'left-0'
              }`}>
                <ReactionPicker
                  onSelect={handleReactionSelect}
                  onClose={() => setShowReactionPicker(false)}
                />
              </div>
            )}

            <div
              className={`rounded-2xl px-4 py-3 shadow-md relative ${
                isMe
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200/50'
              }`}
            >
              {/* Reply preview */}
              {message.replyTo && (
                <div
                  onClick={() => onScrollToMessage?.(message.replyTo!._id)}
                  className={`mb-2 p-2 rounded-lg cursor-pointer border-l-4 ${
                    isMe 
                      ? 'bg-white/20 border-white/50' 
                      : 'bg-gray-100 border-blue-500'
                  }`}
                >
                  <p className={`text-xs font-semibold mb-1 ${isMe ? 'text-white/90' : 'text-blue-600'}`}>
                    {message.replyTo.sender.name}
                  </p>
                  <p className={`text-xs line-clamp-2 ${isMe ? 'text-white/80' : 'text-gray-600'}`}>
                    {message.replyTo.content}
                  </p>
                </div>
              )}

              {message.content && message.content !== '[File đính kèm]' && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((file, index) => {
                    const isImage = file.mimetype.startsWith('image/');
                    return (
                      <div key={index}>
                        {isImage ? (
                          <a
                            href={file.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={file.path}
                              alt={file.originalName}
                              className="max-w-full rounded border-2 border-white/20 hover:opacity-90 transition"
                              style={{ maxHeight: '300px' }}
                              loading="lazy"
                            />
                          </a>
                        ) : (
                          <a
                            href={file.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 hover:bg-gray-200'
                            } transition-colors`}
                          >
                            <FiPaperclip size={16} />
                            <span className="text-sm truncate flex-1">{file.originalName}</span>
                            <span className="text-xs opacity-70">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Time and status */}
              <div className={`flex items-center gap-1 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-xs ${isMe ? 'text-white/80' : 'text-gray-500'}`}>
                  {formattedTime}
                </span>
                {getStatusIcon()}
              </div>
            </div>

            {/* Reactions summary */}
            {message.reactions && message.reactions.length > 0 && (
              <ReactionSummary
                reactions={message.reactions}
                currentUserId={currentUserId}
                onReactionClick={() => setShowReactionPicker(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;

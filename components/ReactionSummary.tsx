'use client';

import React from 'react';

interface Reaction {
  userId: string;
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
  createdAt: Date;
}

interface ReactionSummaryProps {
  reactions: Reaction[];
  currentUserId: string;
  onReactionClick?: () => void;
}

const reactionEmojis: Record<string, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠',
};

function ReactionSummary({ reactions, currentUserId, onReactionClick }: ReactionSummaryProps) {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by type
  const grouped = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.type]) acc[reaction.type] = [];
    acc[reaction.type].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  // Get top 3 most used reactions
  const topReactions = Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  const totalCount = reactions.length;
  const userReacted = reactions.some(r => r.userId === currentUserId);

  return (
    <button
      onClick={onReactionClick}
      className={`
        absolute -bottom-3 right-2 flex items-center gap-1 px-2 py-1 rounded-full
        bg-white border-2 shadow-md hover:shadow-lg transition-all transform hover:scale-110
        ${userReacted ? 'border-blue-500' : 'border-gray-200'}
      `}
    >
      {/* Show top reaction emojis */}
      <div className="flex items-center -space-x-1">
        {topReactions.map(([type]) => (
          <span key={type} className="text-sm">
            {reactionEmojis[type]}
          </span>
        ))}
      </div>
      
      {/* Reaction count */}
      {totalCount > 0 && (
        <span className={`text-xs font-semibold ${userReacted ? 'text-blue-600' : 'text-gray-600'}`}>
          {totalCount}
        </span>
      )}
    </button>
  );
}

export default ReactionSummary;

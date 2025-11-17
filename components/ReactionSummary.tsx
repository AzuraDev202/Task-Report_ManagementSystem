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
    <div
      onClick={onReactionClick}
      className={`
        absolute -bottom-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
        bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer
      `}
    >
      {/* Show top reaction emojis */}
      <div className="flex items-center">
        {topReactions.map(([type]) => (
          <span key={type} className="text-base leading-none">
            {reactionEmojis[type]}
          </span>
        ))}
      </div>
      
      {/* Reaction count */}
      {totalCount > 1 && (
        <span className="text-[10px] font-semibold ml-0.5 text-gray-600">
          {totalCount}
        </span>
      )}
    </div>
  );
}

export default ReactionSummary;

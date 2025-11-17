'use client';

import React, { useState } from 'react';

interface ReactionPickerProps {
  onSelect: (reaction: string) => void;
  onClose: () => void;
}

const reactions = [
  { type: 'like', emoji: '👍', label: 'Thích' },
  { type: 'love', emoji: '❤️', label: 'Yêu thích' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Buồn' },
  { type: 'angry', emoji: '😠', label: 'Phẫn nộ' },
];

function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Reaction picker */}
      <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-2 py-2 flex items-center gap-1 animate-scale-in z-[9999] relative">
        {reactions.map((reaction) => (
          <button
            key={reaction.type}
            onClick={() => {
              onSelect(reaction.type);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all duration-200 transform hover:scale-125"
          >
            <span className="text-2xl">{reaction.emoji}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

export default ReactionPicker;

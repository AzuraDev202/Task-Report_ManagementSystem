// Message utilities for reactions, reply, and status

export const handleReaction = async (
  messageId: string,
  reactionType: string,
  token: string
) => {
  try {
    const res = await fetch(`/api/messages/${messageId}/reaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reactionType }),
    });
    
    const data = await res.json();
    return { success: data.success, reactions: data.data };
  } catch (error) {
    console.error('Reaction error:', error);
    return { success: false };
  }
};

export const removeReaction = async (
  messageId: string,
  token: string
) => {
  try {
    const res = await fetch(`/api/messages/${messageId}/reaction`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await res.json();
    return { success: data.success };
  } catch (error) {
    console.error('Remove reaction error:', error);
    return { success: false };
  }
};

export const markMessageSeen = async (
  messageId: string,
  token: string
) => {
  try {
    const res = await fetch(`/api/messages/${messageId}/seen`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await res.json();
    return { success: data.success };
  } catch (error) {
    console.error('Mark seen error:', error);
    return { success: false };
  }
};

export const getMessageStatusIcon = (status?: string) => {
  switch (status) {
    case 'sending':
      return '⏱️';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'seen':
      return '✓✓';
    default:
      return '';
  }
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN');
};

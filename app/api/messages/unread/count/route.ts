import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';

// In-memory cache for unread counts (5 second TTL)
const countCache = new Map<string, { count: number; totalUnread: number; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

// GET /api/messages/unread/count - Get count of conversations with unread messages
export const GET = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    // Check if user exists
    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admin has no messages
    if (user.role === 'admin') {
      return NextResponse.json({
        success: true,
        count: 0,
        totalUnread: 0,
      });
    }

    // Check if bypass cache is requested
    const url = new URL(req.url);
    const bypassCache = url.searchParams.get('refresh') === 'true';

    // Check cache first (unless bypassed)
    const cacheKey = user.id;
    if (!bypassCache) {
      const cached = countCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({
          success: true,
          count: cached.count,
          totalUnread: cached.totalUnread,
        }, {
          headers: {
            'Cache-Control': 'private, max-age=5',
          }
        });
      }
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(user.id);

    // Count unique conversations (senders) with unread messages
    const unreadConversations = await Message.aggregate([
      {
        $match: {
          receiver: userId,
          isRead: false,
          deletedBy: { $ne: userId }
        }
      },
      {
        $group: {
          _id: '$sender' // Group by sender to count unique conversations
        }
      },
      {
        $count: 'count'
      }
    ]);

    // Get total unread count
    const totalUnread = await Message.countDocuments({
      receiver: userId,
      isRead: false,
      deletedBy: { $ne: userId }
    });

    const conversationCount = unreadConversations.length > 0 ? unreadConversations[0].count : 0;

    // Store in cache
    countCache.set(cacheKey, {
      count: conversationCount,
      totalUnread,
      timestamp: Date.now()
    });

    // Clean old cache entries (older than 1 minute)
    const now = Date.now();
    for (const [key, value] of countCache.entries()) {
      if (now - value.timestamp > 60000) {
        countCache.delete(key);
      }
    }

    return NextResponse.json({
      success: true,
      count: conversationCount, // Number of conversations with unread messages
      totalUnread, // Total number of unread messages
    }, {
      headers: {
        'Cache-Control': 'private, max-age=5',
      }
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy số tin nhắn chưa đọc' },
      { status: 500 }
    );
  }
});

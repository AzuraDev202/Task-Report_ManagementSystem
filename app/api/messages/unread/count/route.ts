import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import { withAuth } from '@/lib/middleware';

// GET /api/messages/unread/count - Get unread messages count
export const GET = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    await connectDB();

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
      });
    }

    const count = await Message.countDocuments({
      receiver: user.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy số tin nhắn chưa đọc' },
      { status: 500 }
    );
  }
});

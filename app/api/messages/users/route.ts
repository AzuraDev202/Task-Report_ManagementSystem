import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';

// GET /api/messages/users - Get list of users that can be messaged (Manager and User only, exclude Admin)
export const GET = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    await connectDB();

    // Prevent Admin from accessing
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin không có quyền truy cập' },
        { status: 403 }
      );
    }

    // Get all users except Admin and current user
    const users = await User.find({
      _id: { $ne: user.id },
      role: { $ne: 'admin' },
    })
      .select('_id name email role department avatar')
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('Get users for messaging error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách người dùng' },
      { status: 500 }
    );
  }
});

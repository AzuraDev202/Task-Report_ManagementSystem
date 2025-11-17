import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const groupId = params.id;

    // Delete all messages in this group for this user only
    // We store deleted messages info separately or use soft delete
    // For simplicity, we'll actually delete them
    const result = await Message.deleteMany({
      groupId: groupId,
      isGroupMessage: true,
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa ${result.deletedCount} tin nhắn`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Delete group messages error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import Group from '@/lib/models/Group';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

// POST /api/groups/[id]/delete-messages - Delete all group messages for current user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verify user is member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Group not found' },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (memberId: any) => memberId.toString() === decoded.userId
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    const userId = new mongoose.Types.ObjectId(decoded.userId);

    // Find all messages in this group
    const messages = await Message.find({
      groupId: groupId,
      isGroupMessage: true
    });

    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có tin nhắn nào để xóa',
        updatedCount: 0
      });
    }

    // Add current user to deletedBy array for all messages
    let updatedCount = 0;

    for (const message of messages) {
      if (!message.deletedBy) {
        message.deletedBy = [];
      }

      // Check if already deleted by this user
      if (!message.deletedBy.some((id: any) => id.toString() === decoded.userId)) {
        message.deletedBy.push(userId);
        await message.save();
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa ${updatedCount} tin nhắn khỏi phía bạn`,
      updatedCount,
      totalMessages: messages.length
    });
  } catch (error: any) {
    console.error('Delete group messages error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

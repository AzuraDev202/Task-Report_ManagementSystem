import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';

// DELETE /api/messages/delete/[id] - Delete message for current user only
export const DELETE = withAuth(async (req: NextRequest, { user, params }: any) => {
  try {
    await connectDB();

    const messageId = params.id;

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return NextResponse.json(
        { error: 'Tin nhắn không tồn tại' },
        { status: 404 }
      );
    }

    // Check if user is sender or receiver
    const userId = new mongoose.Types.ObjectId(user.id);
    const isSender = message.sender.toString() === user.id;
    const isReceiver = message.receiver?.toString() === user.id;
    const isGroupMember = message.isGroupMessage; // Will verify group membership if needed

    if (!isSender && !isReceiver && !isGroupMember) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa tin nhắn này' },
        { status: 403 }
      );
    }

    // Add user to deletedBy array
    if (!message.deletedBy) {
      message.deletedBy = [];
    }

    if (!message.deletedBy.some((id: any) => id.toString() === user.id)) {
      message.deletedBy.push(userId);
      await message.save();
    }

    // If both sender and receiver have deleted, permanently delete the message
    const bothDeleted = message.sender.toString() === user.id && 
                       message.receiver && 
                       message.deletedBy.length >= 2;

    if (bothDeleted) {
      await Message.findByIdAndDelete(messageId);
      return NextResponse.json({
        success: true,
        message: 'Tin nhắn đã bị xóa hoàn toàn',
        permanentlyDeleted: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tin nhắn đã bị xóa khỏi phía bạn',
    });
  } catch (error: any) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Không thể xóa tin nhắn' },
      { status: 500 }
    );
  }
});

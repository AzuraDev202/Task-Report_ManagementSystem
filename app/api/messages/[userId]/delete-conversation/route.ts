import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';

// POST /api/messages/[userId]/delete-conversation - Delete entire conversation for current user
export const POST = withAuth(async (req: NextRequest, { user, params }: any) => {
  try {
    await connectDB();

    const otherUserId = params.userId;

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = new mongoose.Types.ObjectId(user.id);
    const otherUserObjectId = new mongoose.Types.ObjectId(otherUserId);

    // Find all messages in this conversation
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserObjectId },
        { sender: otherUserObjectId, receiver: userId }
      ]
    });

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy cuộc trò chuyện' },
        { status: 404 }
      );
    }

    // Add current user to deletedBy array for all messages
    let updatedCount = 0;
    let permanentlyDeletedCount = 0;

    for (const message of messages) {
      if (!message.deletedBy) {
        message.deletedBy = [];
      }

      // Check if already deleted by this user
      if (!message.deletedBy.some((id: any) => id.toString() === user.id)) {
        message.deletedBy.push(userId);
        
        // If both users have deleted, permanently delete the message
        const bothDeleted = message.deletedBy.length >= 2 &&
                           message.deletedBy.some((id: any) => id.toString() === message.sender.toString()) &&
                           message.deletedBy.some((id: any) => id.toString() === message.receiver?.toString());

        if (bothDeleted) {
          await Message.findByIdAndDelete(message._id);
          permanentlyDeletedCount++;
        } else {
          await message.save();
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cuộc trò chuyện đã được xóa khỏi phía bạn',
      updatedCount,
      permanentlyDeletedCount,
      totalMessages: messages.length
    });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Không thể xóa cuộc trò chuyện' },
      { status: 500 }
    );
  }
});

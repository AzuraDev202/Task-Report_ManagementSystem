import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';
import { decrypt } from '@/lib/encryption';
import { cacheHeaders, jsonResponse, errorResponse } from '@/lib/utils/apiHelpers';

// GET /api/messages/[userId] - Get conversation with specific user
export const GET = withAuth(
  async (req: NextRequest, { user, params }: any) => {
    try {
      await connectDB();

      // Prevent Admin from accessing messages
      if (user.role === 'admin') {
        return NextResponse.json(
          { error: 'Admin không có quyền truy cập tin nhắn' },
          { status: 403 }
        );
      }

      const otherUserId = params.userId;

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
        return NextResponse.json(
          { error: 'User ID không hợp lệ' },
          { status: 400 }
        );
      }

      // Check if other user exists and is not admin
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) {
        return NextResponse.json(
          { error: 'Người dùng không tồn tại' },
          { status: 404 }
        );
      }

      if (otherUser.role === 'admin') {
        return NextResponse.json(
          { error: 'Không thể xem tin nhắn với Admin' },
          { status: 403 }
        );
      }

      // Get all messages between current user and other user
      const messages = await Message.find({
        $or: [
          { sender: user.id, receiver: otherUserId },
          { sender: otherUserId, receiver: user.id },
        ],
        // Exclude messages deleted by current user
        deletedBy: { $ne: user.id }
      })
        .sort({ createdAt: 1 })
        .populate('sender', 'name email role avatar')
        .populate('receiver', 'name email role avatar')
        .populate({
          path: 'replyTo',
          select: 'content sender',
          populate: {
            path: 'sender',
            select: 'name'
          }
        });

      // Mark messages from other user as read
      await Message.updateMany(
        {
          sender: otherUserId,
          receiver: user.id,
          isRead: false,
        },
        {
          isRead: true,
        }
      );

      // Decrypt content for all messages
      const decryptedMessages = messages.map(msg => {
        const msgObj = msg.toObject();
        msgObj.content = decrypt(msgObj.content);
        // Decrypt replyTo content if exists
        if (msgObj.replyTo && msgObj.replyTo.content) {
          msgObj.replyTo.content = decrypt(msgObj.replyTo.content);
        }
        return msgObj;
      });

      return jsonResponse({
        success: true,
        messages: decryptedMessages,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          avatar: otherUser.avatar,
        },
      }, { status: 200, cache: true, maxAge: 10 }); // Cache for 10 seconds (shorter as messages update frequently)
    } catch (error: any) {
      console.error('Get conversation error:', error);
      return errorResponse('Không thể lấy cuộc hội thoại', 500);
    }
  }
);

// DELETE /api/messages/[userId] - Delete conversation with specific user
export const DELETE = withAuth(
  async (req: NextRequest, { user, params }: any) => {
    try {
      await connectDB();

      // Prevent Admin from accessing messages
      if (user.role === 'admin') {
        return NextResponse.json(
          { error: 'Admin không có quyền truy cập tin nhắn' },
          { status: 403 }
        );
      }

      const otherUserId = params.userId;

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
        return NextResponse.json(
          { error: 'User ID không hợp lệ' },
          { status: 400 }
        );
      }

      // Check if other user exists and is not admin
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) {
        return NextResponse.json(
          { error: 'Người dùng không tồn tại' },
          { status: 404 }
        );
      }

      if (otherUser.role === 'admin') {
        return NextResponse.json(
          { error: 'Không thể xóa tin nhắn với Admin' },
          { status: 403 }
        );
      }

      // Delete all messages between current user and other user
      const result = await Message.deleteMany({
        $or: [
          { sender: user.id, receiver: otherUserId },
          { sender: otherUserId, receiver: user.id },
        ],
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa cuộc trò chuyện',
        deletedCount: result.deletedCount,
      });
    } catch (error: any) {
      console.error('Delete conversation error:', error);
      return NextResponse.json(
        { error: 'Không thể xóa cuộc trò chuyện' },
        { status: 500 }
      );
    }
  }
);

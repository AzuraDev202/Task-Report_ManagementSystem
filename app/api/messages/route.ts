import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';
import { encrypt, decrypt } from '@/lib/encryption';

// GET /api/messages - Get conversations list with last message
export const GET = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    await connectDB();

    // Prevent Admin from accessing messages
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin không có quyền truy cập tin nhắn' },
        { status: 403 }
      );
    }

    const userId = new mongoose.Types.ObjectId(user.id);

    // Get all unique users that current user has conversation with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $project: {
          userId: '$_id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          role: '$userInfo.role',
          avatar: '$userInfo.avatar',
          lastMessage: '$lastMessage.content',
          lastMessageTime: '$lastMessage.createdAt',
          isLastMessageFromMe: {
            $eq: ['$lastMessage.sender', userId],
          },
          unreadCount: 1,
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    // Decrypt lastMessage content for each conversation
    const decryptedConversations = conversations.map(conv => ({
      ...conv,
      lastMessage: conv.lastMessage ? decrypt(conv.lastMessage) : '',
    }));

    return NextResponse.json({
      success: true,
      conversations: decryptedConversations,
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Không thể lấy danh sách hội thoại' },
      { status: 500 }
    );
  }
});

// POST /api/messages - Send a new message
export const POST = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    await connectDB();

    // Prevent Admin from sending messages
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin không có quyền gửi tin nhắn' },
        { status: 403 }
      );
    }

    const { receiverId, content } = await req.json();

    // Validate input
    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Receiver và nội dung tin nhắn là bắt buộc' },
        { status: 400 }
      );
    }

    // Check if receiver exists and is not admin
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return NextResponse.json(
        { error: 'Người nhận không tồn tại' },
        { status: 404 }
      );
    }

    if (receiver.role === 'admin') {
      return NextResponse.json(
        { error: 'Không thể gửi tin nhắn cho Admin' },
        { status: 403 }
      );
    }

    // Cannot send message to yourself
    if (receiverId === user.id) {
      return NextResponse.json(
        { error: 'Không thể gửi tin nhắn cho chính mình' },
        { status: 400 }
      );
    }

    // Create message with encrypted content
    const encryptedContent = encrypt(content.trim());
    const message = await Message.create({
      sender: user.id,
      receiver: receiverId,
      content: encryptedContent,
    });

    // Populate sender info
    await message.populate('sender', 'name email role avatar');
    await message.populate('receiver', 'name email role avatar');

    // Decrypt content before sending back
    const messageObj = message.toObject();
    messageObj.content = decrypt(messageObj.content);

    return NextResponse.json({
      success: true,
      message: messageObj,
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Không thể gửi tin nhắn' },
      { status: 500 }
    );
  }
});

// PUT /api/messages - Mark messages as read
export const PUT = withAuth(async (req: NextRequest, { user }: any) => {
  try {
    await connectDB();

    const { senderId } = await req.json();

    if (!senderId) {
      return NextResponse.json(
        { error: 'Sender ID là bắt buộc' },
        { status: 400 }
      );
    }

    // Mark all messages from senderId to current user as read
    await Message.updateMany(
      {
        sender: senderId,
        receiver: user.id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Đã đánh dấu tin nhắn là đã đọc',
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { error: 'Không thể đánh dấu đã đọc' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';
import mongoose from 'mongoose';
import { encrypt, decrypt } from '@/lib/encryption';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { cacheHeaders, jsonResponse, errorResponse } from '@/lib/utils/apiHelpers';

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
          // Exclude messages deleted by current user
          deletedBy: { $ne: userId }
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

    return jsonResponse({
      success: true,
      conversations: decryptedConversations,
    }, { status: 200, cache: true, maxAge: 30 }); // Cache for 30 seconds
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return errorResponse('Không thể lấy danh sách hội thoại', 500);
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

    const formData = await req.formData();
    const receiverId = formData.get('receiverId') as string;
    const content = formData.get('content') as string;
    const replyToId = formData.get('replyToId') as string;
    const files = formData.getAll('files') as File[];

    // Validate input
    if (!receiverId || (!content?.trim() && files.length === 0)) {
      return NextResponse.json(
        { error: 'Receiver và nội dung tin nhắn hoặc file là bắt buộc' },
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

    // Handle file uploads
    const attachments = [];
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
      
      // Ensure upload directory exists
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          return NextResponse.json(
            { error: `File ${file.name} vượt quá 10MB` },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filepath = path.join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        
        attachments.push({
          filename,
          originalName: file.name,
          path: `/uploads/messages/${filename}`,
          mimetype: file.type,
          size: file.size,
        });
      }
    }

    // Create message with encrypted content
    const encryptedContent = content?.trim() ? encrypt(content.trim()) : '';
    const messageData: any = {
      sender: user.id,
      receiver: receiverId,
      content: encryptedContent || '[File đính kèm]',
    };

    if (attachments.length > 0) {
      messageData.attachments = attachments;
    }

    // Add reply information if provided
    if (replyToId) {
      messageData.replyTo = replyToId;
    }

    const message = await Message.create(messageData);

    // Populate sender and receiver info
    await message.populate('sender', 'name email role avatar');
    await message.populate('receiver', 'name email role avatar');
    
    // Populate replyTo message with sender info
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        select: 'content sender',
        populate: {
          path: 'sender',
          select: 'name'
        }
      });
    }

    // Decrypt content before sending back
    const messageObj = message.toObject();
    messageObj.content = messageObj.content ? decrypt(messageObj.content) : '';
    
    // Decrypt replyTo content if exists and is populated (not just ObjectId)
    if (messageObj.replyTo && typeof messageObj.replyTo === 'object' && 'content' in messageObj.replyTo && typeof messageObj.replyTo.content === 'string') {
      messageObj.replyTo.content = decrypt(messageObj.replyTo.content);
    }

    // Emit Socket.io event for realtime updates
    try {
      const io = (global as any).io;
      if (io) {
        // Emit to receiver's room
        io.to(`user:${receiverId}`).emit('newMessage', {
          message: messageObj,
          senderId: user.id
        });
        console.log(`Emitted newMessage to user:${receiverId}`);
      }
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
      // Don't fail the request if socket emit fails
    }

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

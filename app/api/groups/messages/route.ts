import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const groupId = formData.get('groupId') as string;
    const content = formData.get('content') as string;
    const files = formData.getAll('files') as File[];

    if (!groupId) {
      return NextResponse.json(
        { success: false, message: 'Group ID is required' },
        { status: 400 }
      );
    }

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

    // Handle file uploads
    const attachments = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const filename = `${Date.now()}-${file.name}`;
          const filepath = join(process.cwd(), 'public', 'uploads', filename);
          await writeFile(filepath, buffer);

          attachments.push({
            filename,
            originalName: file.name,
            path: `/uploads/${filename}`,
            mimetype: file.type,
            size: file.size,
          });
        }
      }
    }

    // Create group message
    const message = await Message.create({
      sender: decoded.userId,
      groupId: groupId,
      content: content || '[File đính kèm]',
      attachments,
      isGroupMessage: true,
    });

    await message.populate('sender', 'name email role avatar');

    // Update group's updatedAt
    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

    // Emit Socket.io event for realtime group updates
    try {
      const io = (global as any).io;
      if (io) {
        // Emit to group room
        io.to(`group:${groupId}`).emit('newGroupMessage', {
          message: message.toObject(),
          groupId: groupId,
          senderId: decoded.userId
        });
        console.log(`Emitted newGroupMessage to group:${groupId}`);
      }
    } catch (socketError) {
      console.error('Socket emit error:', socketError);
      // Don't fail the request if socket emit fails
    }

    return NextResponse.json({
      success: true,
      message: message,
    });
  } catch (error: any) {
    console.error('Send group message error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { success: false, message: 'Group ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user is member of the group
    const group = await Group.findById(groupId).populate('members', 'name email avatar');
    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Group not found' },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (member: any) => member._id.toString() === decoded.userId
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Get group messages
    const messages = await Message.find({
      groupId: groupId,
      isGroupMessage: true,
      // Exclude messages deleted by current user
      deletedBy: { $ne: decoded.userId }
    })
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      messages,
      group,
    });
  } catch (error: any) {
    console.error('Get group messages error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

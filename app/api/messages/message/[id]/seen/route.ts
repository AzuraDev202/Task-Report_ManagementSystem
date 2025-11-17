import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import dbConnect from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import { Server as SocketIOServer } from 'socket.io';

// GET socket.io instance
let io: SocketIOServer;
if (typeof window === 'undefined') {
  const { io: socketIO } = require('@/server');
  io = socketIO;
}

// Mark message as seen
export const POST = withAuth(async (
  request: NextRequest,
  { params, user }: { params: { id: string }; user: any }
) => {
  try {
    await dbConnect();
    const messageId = params.id;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Don't mark own messages as seen
    if (message.sender.toString() === user.id) {
      return NextResponse.json({
        success: true,
        message: 'Cannot mark own message as seen'
      });
    }

    // Initialize seenBy array if not exists
    if (!message.seenBy) {
      message.seenBy = [];
    }

    // Check if already seen by this user
    const alreadySeen = message.seenBy.some(
      (s: any) => s.userId.toString() === user.id
    );

    if (!alreadySeen) {
      // Add to seenBy array
      message.seenBy.push({
        userId: user.id,
        seenAt: new Date()
      });

      // Update status to 'seen' if it was 'delivered' or 'sent'
      if (message.status !== 'seen') {
        message.status = 'seen';
      }

      await message.save();

      // Emit socket event to sender
      const conversationId = message.isGroupMessage ? message.groupId : message.receiver;
      if (io && conversationId) {
        io.to(conversationId.toString()).emit('messageSeen', {
          messageId: message._id,
          seenBy: message.seenBy,
          status: message.status,
          userId: user.id
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: message
    });

  } catch (error: any) {
    console.error('Mark as seen error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark as seen' },
      { status: 500 }
    );
  }
});

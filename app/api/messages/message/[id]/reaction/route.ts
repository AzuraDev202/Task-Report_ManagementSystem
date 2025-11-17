import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import dbConnect from '@/lib/mongodb';
import Message from '@/lib/models/Message';

// Add reaction to message
export const POST = withAuth(async (
  request: NextRequest,
  { params, user }: { params: { id: string }; user: any }
) => {
  try {
    await dbConnect();
    
    const { reactionType } = await request.json();
    const messageId = params.id;

    // Validate reaction type
    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // Find message and add reaction
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Initialize reactions array if not exists
    if (!message.reactions) {
      message.reactions = [];
    }

    // Check if user already reacted
    const existingReactionIndex = message.reactions.findIndex(
      (r: any) => r.userId.toString() === user.id
    );

    if (existingReactionIndex > -1) {
      // Update existing reaction
      message.reactions[existingReactionIndex].type = reactionType;
      message.reactions[existingReactionIndex].createdAt = new Date();
    } else {
      // Add new reaction
      message.reactions.push({
        userId: user.id,
        type: reactionType,
        createdAt: new Date()
      });
    }

    await message.save();

    // Socket.io events will be handled by client-side socket connection
    return NextResponse.json({
      success: true,
      message: message
    });

  } catch (error: any) {
    console.error('Add reaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add reaction' },
      { status: 500 }
    );
  }
});

// Remove reaction from message
export const DELETE = withAuth(async (
  request: NextRequest,
  { params, user }: { params: { id: string }; user: any }
) => {
  try {
    await dbConnect();
    const messageId = params.id;

    // Find message and remove reaction
    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Remove user's reaction
    if (message.reactions) {
      message.reactions = message.reactions.filter(
        (r: any) => r.userId.toString() !== user.id
      );
    }

    await message.save();

    // Socket.io events will be handled by client-side socket connection
    return NextResponse.json({
      success: true,
      message: message
    });

  } catch (error: any) {
    console.error('Remove reaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove reaction' },
      { status: 500 }
    );
  }
});

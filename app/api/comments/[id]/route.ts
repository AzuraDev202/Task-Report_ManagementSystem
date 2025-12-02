import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

// GET /api/comments/[id] - Get a specific comment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse('Invalid token', 401);
    }

    await connectDB();

    const comment = await Comment.findById(params.id)
      .populate('user', 'name email avatar')
      .populate('task', 'title');

    if (!comment) {
      return errorResponse('Comment not found', 404);
    }

    return successResponse(comment, 'Comment retrieved successfully');
  } catch (error: any) {
    console.error('Get comment error:', error);
    return errorResponse(error.message || 'Failed to retrieve comment', 500);
  }
}

// PUT /api/comments/[id] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse('Invalid token', 401);
    }

    await connectDB();

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return errorResponse('Content is required', 400);
    }

    // Find comment
    const comment = await Comment.findById(params.id);
    if (!comment) {
      return errorResponse('Comment not found', 404);
    }

    // Check if user is the comment owner
    if (comment.user.toString() !== decoded.userId) {
      return errorResponse('You can only edit your own comments', 403);
    }

    // Update comment
    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email avatar')
      .populate('task', 'title');

    return successResponse(updatedComment, 'Comment updated successfully');
  } catch (error: any) {
    console.error('Update comment error:', error);
    return errorResponse(error.message || 'Failed to update comment', 500);
  }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse('Invalid token', 401);
    }

    await connectDB();

    // Find comment
    const comment = await Comment.findById(params.id);
    if (!comment) {
      return errorResponse('Comment not found', 404);
    }

    // Check if user is the comment owner or admin
    if (comment.user.toString() !== decoded.userId && decoded.role !== 'admin') {
      return errorResponse('You can only delete your own comments', 403);
    }

    // Delete comment
    await Comment.findByIdAndDelete(params.id);

    return successResponse(null, 'Comment deleted successfully');
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return errorResponse(error.message || 'Failed to delete comment', 500);
  }
}

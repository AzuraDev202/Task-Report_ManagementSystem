import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/lib/models/Comment';
import Task from '@/lib/models/Task';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

// GET /api/comments - Get all comments (with optional task filter)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    const query = taskId ? { task: taskId } : {};
    
    const comments = await Comment.find(query)
      .populate('user', 'name email avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 });

    return successResponse(comments, 'Comments retrieved successfully');
  } catch (error: any) {
    console.error('Get comments error:', error);
    return errorResponse(error.message || 'Failed to retrieve comments', 500);
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
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
    const { task, content } = body;

    // Validate required fields
    if (!task || !content) {
      return errorResponse('Task and content are required', 400);
    }

    // Check if task exists
    const taskExists = await Task.findById(task);
    if (!taskExists) {
      return errorResponse('Task not found', 404);
    }

    // Create comment
    const comment = await Comment.create({
      task,
      user: decoded.userId,
      content,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email avatar')
      .populate('task', 'title');

    return successResponse(populatedComment, 'Comment created successfully', 201);
  } catch (error: any) {
    console.error('Create comment error:', error);
    return errorResponse(error.message || 'Failed to create comment', 500);
  }
}

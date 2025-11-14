import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import Notification from '@/lib/models/Notification';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';

// GET all tasks
async function getHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const assignedBy = searchParams.get('assignedBy');

    const filter: any = {};
    
    // Regular users can only see tasks assigned to them or by them
    if (request.user?.role === 'user') {
      filter.$or = [
        { assignedTo: request.user.userId },
        { assignedBy: request.user.userId },
      ];
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (assignedBy) filter.assignedBy = assignedBy;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    return successResponse(tasks);
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return errorResponse('Failed to get tasks', 500, error.message);
  }
}

// POST create new task
async function postHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { title, description, assignedTo, priority, dueDate, tags, attachments } = await request.json();

    if (!title || !description || !assignedTo || !dueDate) {
      return errorResponse('Title, description, assignedTo, and dueDate are required');
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: request.user?.userId,
      priority: priority || 'medium',
      dueDate,
      tags,
      attachments: attachments || [],
    });

    // Create notification for assigned user
    await Notification.create({
      user: assignedTo,
      type: 'task_assigned',
      title: 'Công việc mới được giao',
      message: `Bạn được giao công việc mới: "${title}"`,
      link: `/dashboard/tasks/${task._id}`,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');

    return successResponse(populatedTask, 'Task created successfully', 201);
  } catch (error: any) {
    console.error('Create task error:', error);
    return errorResponse('Failed to create task', 500, error.message);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler, ['manager']);

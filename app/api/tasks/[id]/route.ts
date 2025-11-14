import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import Notification from '@/lib/models/Notification';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/apiResponse';

// GET task by ID
async function getHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const task = await Task.findById(params.id)
      .populate('assignedTo', 'name email avatar department position')
      .populate('assignedBy', 'name email avatar');

    if (!task) {
      return notFoundResponse('Task not found');
    }

    // Check if user has permission to view this task
    const assignedToId = typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo._id.toString();
    const assignedById = typeof task.assignedBy === 'string' ? task.assignedBy : task.assignedBy._id.toString();
    
    if (
      request.user?.role === 'user' &&
      assignedToId !== request.user.userId &&
      assignedById !== request.user.userId
    ) {
      return errorResponse('You do not have permission to view this task', 403);
    }

    return successResponse(task);
  } catch (error: any) {
    console.error('Get task error:', error);
    return errorResponse('Failed to get task', 500, error.message);
  }
}

// PUT update task
async function putHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Admin cannot update tasks (only delete)
    if (request.user?.role === 'admin') {
      return errorResponse('Admin cannot update tasks. Only manager and user can update.', 403);
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, tags, assignedTo, attachments } = body;

    const task = await Task.findById(params.id)
      .populate('assignedTo', 'name')
      .populate('assignedBy', 'name');

    if (!task) {
      return notFoundResponse('Task not found');
    }

    const oldStatus = task.status;
    const wasEdited = title || description || priority || dueDate || tags || assignedTo || attachments;

    // Store original IDs and names before save (populated fields will be lost after save)
    const assignedToId = typeof task.assignedTo === 'string' ? task.assignedTo : task.assignedTo._id;
    const assignedById = typeof task.assignedBy === 'string' ? task.assignedBy : task.assignedBy._id;
    const assignedToName = typeof task.assignedTo === 'string' ? 'User' : task.assignedTo.name;
    const assignedByName = typeof task.assignedBy === 'string' ? 'Manager' : task.assignedBy.name;

    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (tags) task.tags = tags;
    if (assignedTo) task.assignedTo = assignedTo;
    if (attachments !== undefined) task.attachments = attachments;

    if (status) {
      task.status = status;
      if (status === 'in-progress' && !task.startDate) {
        task.startDate = new Date();
      }
      if (status === 'completed' && !task.completedDate) {
        task.completedDate = new Date();
      }
    }

    await task.save();

    // Create notifications based on who updated and what changed
    const isManager = request.user?.role === 'admin' || request.user?.role === 'manager';
    const isUser = request.user?.role === 'user';

    // Case 1: User completed task -> notify Manager
    if (isUser && status === 'completed' && oldStatus !== 'completed') {
      await Notification.create({
        user: assignedById,
        type: 'task_completed',
        title: 'Công việc đã hoàn thành',
        message: `${assignedToName} đã hoàn thành công việc "${task.title}"`,
        link: `/dashboard/tasks/${task._id}`,
      });
    }

    // Case 2: User updated task status (not completed) -> notify Manager
    if (isUser && status && status !== 'completed' && oldStatus !== status) {
      await Notification.create({
        user: assignedById,
        type: 'task_updated',
        title: 'Cập nhật công việc',
        message: `${assignedToName} đã cập nhật trạng thái công việc "${task.title}" thành ${status}`,
        link: `/dashboard/tasks/${task._id}`,
      });
    }

    // Case 3: Manager edited task -> notify User
    if (isManager && wasEdited) {
      await Notification.create({
        user: assignedToId,
        type: 'task_updated',
        title: 'Công việc được cập nhật',
        message: `Công việc "${task.title}" đã được chỉnh sửa bởi ${assignedByName}`,
        link: `/dashboard/tasks/${task._id}`,
      });
    }

    const updatedTask = await Task.findById(params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');

    return successResponse(updatedTask, 'Task updated successfully');
  } catch (error: any) {
    console.error('Update task error:', error);
    return errorResponse('Failed to update task', 500, error.message);
  }
}

// DELETE task (admin only)
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Only admin can delete tasks
    if (request.user?.role !== 'admin') {
      return errorResponse('Only admin can delete tasks', 403);
    }

    const task = await Task.findByIdAndDelete(params.id);

    if (!task) {
      return notFoundResponse('Task not found');
    }

    return successResponse(null, 'Task deleted successfully');
  } catch (error: any) {
    console.error('Delete task error:', error);
    return errorResponse('Failed to delete task', 500, error.message);
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler, ['admin']);

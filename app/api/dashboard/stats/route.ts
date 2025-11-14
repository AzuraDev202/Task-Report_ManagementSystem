import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import Report from '@/lib/models/Report';
import User from '@/lib/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

async function getHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const userId = request.user?.userId ? new mongoose.Types.ObjectId(request.user.userId) : null;

    const userFilter = request.user?.role === 'user' 
      ? { $or: [{ assignedTo: userId }, { assignedBy: userId }] }
      : {};

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const tasksByPriority = await Task.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get report statistics
    const reportFilter = request.user?.role === 'user' 
      ? { user: userId }
      : {};

    const reportStats = await Report.aggregate([
      { $match: reportFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get user count (admin/manager only)
    let userCount = 0;
    if (request.user?.role === 'admin' || request.user?.role === 'manager') {
      userCount = await User.countDocuments({ isActive: true });
    }

    // Get recent tasks
    const recentTasks = await Task.find(userFilter)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get overdue tasks
    const overdueTasks = await Task.find({
      ...userFilter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] },
    }).countDocuments();

    return successResponse({
      taskStats,
      tasksByPriority,
      reportStats,
      userCount,
      recentTasks,
      overdueTasks,
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return errorResponse('Failed to get dashboard statistics', 500, error.message);
  }
}

export const GET = withAuth(getHandler);

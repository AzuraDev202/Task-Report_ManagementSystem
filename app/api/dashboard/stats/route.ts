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
    const userRole = request.user?.role;

    // Filter based on role
    // Admin: sees everything
    // User/Manager: only sees tasks assigned to them or created by them
    const taskFilter = (userRole === 'admin') 
      ? {}
      : { $or: [{ assignedTo: userId }, { assignedBy: userId }] };

    // Get task statistics
    const taskStats = await Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const tasksByPriority = await Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get report statistics
    // Admin: sees all reports
    // User/Manager: only sees their own reports
    const reportFilter = (userRole === 'admin') 
      ? {}
      : { user: userId };

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
    if (userRole === 'admin' || userRole === 'manager') {
      userCount = await User.countDocuments({ isActive: true });
    }

    // Get recent tasks
    const recentTasks = await Task.find(taskFilter)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get overdue tasks
    const overdueTasks = await Task.find({
      ...taskFilter,
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

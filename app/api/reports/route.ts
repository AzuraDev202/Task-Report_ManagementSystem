import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Report from '@/lib/models/Report';
import Notification from '@/lib/models/Notification';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';

// GET all reports
async function getHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const taskId = searchParams.get('taskId');
    const userId = searchParams.get('userId');

    const filter: any = {};

    // Regular users can only see their own reports
    if (request.user?.role === 'user') {
      filter.user = request.user.userId;
    }

    if (status) filter.status = status;
    if (taskId) filter.task = taskId;
    if (userId) filter.user = userId;

    const reports = await Report.find(filter)
      .populate('task', 'title description status priority')
      .populate('user', 'name email avatar')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(reports);
  } catch (error: any) {
    console.error('Get reports error:', error);
    return errorResponse('Failed to get reports', 500, error.message);
  }
}

// POST create new report
async function postHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    // Admin cannot create reports (only delete)
    if (request.user?.role === 'admin') {
      return errorResponse('Admin cannot create reports', 403);
    }

    const { task, title, content, status, attachments } = await request.json();

    if (!task || !title || !content) {
      return errorResponse('Task, title, and content are required');
    }

    const report = await Report.create({
      task,
      user: request.user?.userId,
      title,
      content,
      status: status || 'draft',
      submittedDate: status === 'submitted' ? new Date() : undefined,
      attachments: attachments || [],
    });

    // Create notification for manager if submitted
    if (status === 'submitted') {
      const Task = (await import('@/lib/models/Task')).default;
      const User = (await import('@/lib/models/User')).default;
      const taskDoc = await Task.findById(task).populate('assignedBy', 'name');
      const userDoc = await User.findById(request.user?.userId).select('name');
      
      if (taskDoc && taskDoc.assignedBy && userDoc) {
        const managerId = typeof taskDoc.assignedBy === 'string' ? taskDoc.assignedBy : taskDoc.assignedBy._id;
        const userName = userDoc.name;
        
        await Notification.create({
          user: managerId,
          type: 'report_submitted',
          title: 'Báo cáo mới được nộp',
          message: `${userName} đã nộp báo cáo "${title}" để duyệt`,
          link: `/dashboard/reports/${report._id}`,
        });
      }
    }

    const populatedReport = await Report.findById(report._id)
      .populate('task', 'title description')
      .populate('user', 'name email avatar');

    return successResponse(populatedReport, 'Report created successfully', 201);
  } catch (error: any) {
    console.error('Create report error:', error);
    return errorResponse('Failed to create report', 500, error.message);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

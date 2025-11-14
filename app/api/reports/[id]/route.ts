import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Report from '@/lib/models/Report';
import Notification from '@/lib/models/Notification';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/apiResponse';

// GET report by ID
async function getHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const report = await Report.findById(params.id)
      .populate('task', 'title description status priority')
      .populate('user', 'name email avatar department')
      .populate('reviewedBy', 'name email avatar');

    if (!report) {
      return notFoundResponse('Report not found');
    }

    // Check permissions
    const reportUserId = typeof report.user === 'string' ? report.user : report.user._id.toString();
    
    if (
      request.user?.role === 'user' &&
      reportUserId !== request.user.userId
    ) {
      return errorResponse('You do not have permission to view this report', 403);
    }

    return successResponse(report);
  } catch (error: any) {
    console.error('Get report error:', error);
    return errorResponse('Failed to get report', 500, error.message);
  }
}

// PUT update report
async function putHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Admin cannot update reports (only delete)
    if (request.user?.role === 'admin') {
      return errorResponse('Admin cannot update reports. Only manager and user can update.', 403);
    }

    const body = await request.json();
    const { title, content, status, comments, attachments } = body;

    const report = await Report.findById(params.id)
      .populate('user', 'name');

    if (!report) {
      return notFoundResponse('Report not found');
    }

    // Store user ID and name before save
    const reportUserId = typeof report.user === 'string' ? report.user : report.user._id;
    const reportUserName = typeof report.user === 'string' ? 'User' : report.user.name;

    // Update fields
    if (title) report.title = title;
    if (content) report.content = content;
    if (comments) report.comments = comments;
    if (attachments !== undefined) report.attachments = attachments;

    if (status) {
      report.status = status;
      
      if (status === 'submitted' && !report.submittedDate) {
        report.submittedDate = new Date();
      }
      
      if ((status === 'approved' || status === 'rejected') && !report.reviewedDate) {
        report.reviewedBy = request.user?.userId;
        report.reviewedDate = new Date();

        // Notify user about review
        const statusText = status === 'approved' ? 'đã được duyệt' : 'bị từ chối';
        await Notification.create({
          user: reportUserId,
          type: 'report_reviewed',
          title: 'Báo cáo được xem xét',
          message: `Báo cáo "${report.title}" của bạn ${statusText}`,
          link: `/dashboard/reports/${report._id}`,
        });
      }
    }

    await report.save();

    const updatedReport = await Report.findById(params.id)
      .populate('task', 'title description')
      .populate('user', 'name email avatar')
      .populate('reviewedBy', 'name email avatar');

    return successResponse(updatedReport, 'Report updated successfully');
  } catch (error: any) {
    console.error('Update report error:', error);
    return errorResponse('Failed to update report', 500, error.message);
  }
}

// DELETE report (admin only)
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Only admin can delete reports
    if (request.user?.role !== 'admin') {
      return errorResponse('Only admin can delete reports', 403);
    }

    const report = await Report.findById(params.id);

    if (!report) {
      return notFoundResponse('Report not found');
    }

    await report.deleteOne();

    return successResponse(null, 'Report deleted successfully');
  } catch (error: any) {
    console.error('Delete report error:', error);
    return errorResponse('Failed to delete report', 500, error.message);
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler, ['admin']);

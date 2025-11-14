import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

// GET user notifications
async function getHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');

    const userObjectId = new mongoose.Types.ObjectId(request.user?.userId);
    
    const filter: any = { user: userObjectId };
    if (isRead !== null) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: userObjectId,
      isRead: false,
    });

    return successResponse({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return errorResponse('Failed to get notifications', 500, error.message);
  }
}

// PUT mark notification as read
async function putHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { notificationId } = await request.json();

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    } else {
      // Mark all as read
      const userObjectId = new mongoose.Types.ObjectId(request.user?.userId);
      await Notification.updateMany(
        { user: userObjectId, isRead: false },
        { isRead: true }
      );
    }

    return successResponse(null, 'Notification(s) marked as read');
  } catch (error: any) {
    console.error('Update notification error:', error);
    return errorResponse('Failed to update notification', 500, error.message);
  }
}

// DELETE delete all notifications for user
async function deleteHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const userObjectId = new mongoose.Types.ObjectId(request.user?.userId);
    
    const result = await Notification.deleteMany({ user: userObjectId });

    return successResponse(
      { deletedCount: result.deletedCount },
      'All notifications deleted successfully'
    );
  } catch (error: any) {
    console.error('Delete notifications error:', error);
    return errorResponse('Failed to delete notifications', 500, error.message);
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';

async function getHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const user = await User.findById(request.user?.userId).select('-password');
    
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error: any) {
    console.error('Get profile error:', error);
    return errorResponse('Failed to get profile', 500, error.message);
  }
}

async function putHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { name, department, position, avatar } = await request.json();

    const user = await User.findByIdAndUpdate(
      request.user?.userId,
      { name, department, position, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user, 'Profile updated successfully');
  } catch (error: any) {
    console.error('Update profile error:', error);
    return errorResponse('Failed to update profile', 500, error.message);
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);

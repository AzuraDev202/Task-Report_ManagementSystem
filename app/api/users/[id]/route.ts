import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/apiResponse';

// GET user by ID
async function getHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const user = await User.findById(params.id).select('-password');

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    return errorResponse('Failed to get user', 500, error.message);
  }
}

// PUT update user
async function putHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, role, department, position, isActive, password } = body;

    const updateData: any = {
      name,
      email,
      role,
      department,
      position,
      isActive,
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await User.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(user, 'User updated successfully');
  } catch (error: any) {
    console.error('Update user error:', error);
    return errorResponse('Failed to update user', 500, error.message);
  }
}

// DELETE user
async function deleteHandler(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const user = await User.findByIdAndDelete(params.id);

    if (!user) {
      return notFoundResponse('User not found');
    }

    return successResponse(null, 'User deleted successfully');
  } catch (error: any) {
    console.error('Delete user error:', error);
    return errorResponse('Failed to delete user', 500, error.message);
  }
}

export const GET = withAuth(getHandler, ['admin', 'manager']);
export const PUT = withAuth(putHandler, ['admin']);
export const DELETE = withAuth(deleteHandler, ['admin']);

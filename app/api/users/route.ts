import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/apiResponse';

// GET all users (admin/manager only)
async function getHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const isActive = searchParams.get('isActive');

    const filter: any = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== null) filter.isActive = isActive === 'true';

    // Manager and User cannot see Admin accounts
    if (request.user.role !== 'admin') {
      filter.role = { $ne: 'admin' };
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    return successResponse(users);
  } catch (error: any) {
    console.error('Get users error:', error);
    return errorResponse('Failed to get users', 500, error.message);
  }
}

// POST create new user (admin only)
async function postHandler(request: AuthenticatedRequest) {
  try {
    await connectDB();

    const { name, email, password, role, department, position } = await request.json();

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      department,
      position,
    });

    const userResponse: any = user.toObject();
    delete userResponse.password;

    return successResponse(userResponse, 'User created successfully', 201);
  } catch (error: any) {
    console.error('Create user error:', error);
    return errorResponse('Failed to create user', 500, error.message);
  }
}

export const GET = withAuth(getHandler, ['admin', 'manager']);
export const POST = withAuth(postHandler, ['admin']);

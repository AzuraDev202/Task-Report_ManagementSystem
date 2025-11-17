import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, department, position, phone } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user - always with role 'user' for public registration
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user', // Always 'user' for public registration, admin can change later
      department,
      position,
      phone,
    });

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          phone: user.phone,
        },
        token,
      },
      'User registered successfully',
      201
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return errorResponse('Registration failed', 500, error.message);
  }
}

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { comparePassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function POST(request: NextRequest) {
  try {
    console.log('Login attempt started');
    
    // Check environment variables
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined');
      return errorResponse('Server configuration error', 500);
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return errorResponse('Server configuration error', 500);
    }

    await connectDB();
    console.log('Database connected');

    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      console.log('User not found or inactive:', email);
      return errorResponse('Invalid email or password', 401);
    }

    console.log('User found:', user.email, 'Role:', user.role);

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return errorResponse('Invalid email or password', 401);
    }

    console.log('Password valid, generating token');

    // Generate token
    const token = generateToken(user._id.toString(), user.email, user.role);

    console.log('Login successful for:', email);

    return successResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        avatar: user.avatar,
      },
      token,
    }, 'Login successful');
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return errorResponse('Login failed', 500, error.message);
  }
}

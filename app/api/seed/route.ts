import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    console.log('Seed API called');
    
    // Check environment
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not defined');
      return Response.json({ error: 'MONGODB_URI not configured' }, { status: 500 });
    }
    
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@company.com' });
    if (adminExists) {
      console.log('Admin already exists');
      return Response.json({ 
        message: 'Seed data already exists',
        admin: {
          email: 'admin@company.com',
          role: adminExists.role,
          isActive: adminExists.isActive
        }
      });
    }

    console.log('Creating admin user...');
    // Create admin user
    const adminPassword = await hashPassword('Admin123!');
    const admin = await User.create({
      name: 'Administrator',
      email: 'admin@company.com',
      password: adminPassword,
      role: 'admin',
      department: 'IT',
      position: 'System Admin',
      phone: '0123456789',
      isActive: true,
    });

    console.log('Admin user created successfully');

    return Response.json({ 
      message: 'Seed data created successfully',
      users: [
        { email: 'admin@company.com', password: 'Admin123!', role: 'admin' },
      ],
      success: true
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

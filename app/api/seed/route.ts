import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@company.com' });
    if (adminExists) {
      return Response.json({ message: 'Seed data already exists' });
    }

    // Create admin user
    const adminPassword = await hashPassword('Admin123!');
    await User.create({
      name: 'Administrator',
      email: 'admin@company.com',
      password: adminPassword,
      role: 'admin',
      department: 'IT',
      position: 'System Admin',
      phone: '0123456789',
      isActive: true,
    });

    return Response.json({ 
      message: 'Seed data created successfully',
      users: [
        { email: 'admin@company.com', password: 'Admin123!', role: 'admin' },
      ]
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

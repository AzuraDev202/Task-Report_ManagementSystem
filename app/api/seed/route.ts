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
      isActive: true,
    });

    // Create manager user
    const managerPassword = await hashPassword('Manager123!');
    await User.create({
      name: 'Manager User',
      email: 'manager@company.com',
      password: managerPassword,
      role: 'manager',
      department: 'Operations',
      position: 'Project Manager',
      isActive: true,
    });

    // Create regular user
    const userPassword = await hashPassword('User123!');
    await User.create({
      name: 'Regular User',
      email: 'user@company.com',
      password: userPassword,
      role: 'user',
      department: 'Development',
      position: 'Developer',
      isActive: true,
    });

    return Response.json({ 
      message: 'Seed data created successfully',
      users: [
        { email: 'admin@company.com', password: 'Admin123!', role: 'admin' },
        { email: 'manager@company.com', password: 'Manager123!', role: 'manager' },
        { email: 'user@company.com', password: 'User123!', role: 'user' },
      ]
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

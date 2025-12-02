import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {}
    };

    // Check MongoDB connection
    try {
      await connectDB();
      health.checks.mongodb = 'connected';
    } catch (dbError: any) {
      health.checks.mongodb = 'failed';
      health.checks.mongodbError = dbError.message;
      health.status = 'error';
    }

    // Check environment variables
    health.checks.env = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
    };

    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
      health.status = 'error';
      health.checks.envStatus = 'missing required variables';
    }

    const statusCode = health.status === 'ok' ? 200 : 500;

    return Response.json(health, { status: statusCode });
  } catch (error: any) {
    return Response.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';
import { cacheHeaders, jsonResponse, errorResponse } from '@/lib/utils/apiHelpers';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, description, members } = body;

    // Validate input
    if (!name || !members || members.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Tên nhóm và ít nhất 2 thành viên là bắt buộc' },
        { status: 400 }
      );
    }

    // Create group with creator as admin
    const group = await Group.create({
      name,
      description: description || '',
      members: [...members, decoded.userId], // Add creator to members
      admins: [decoded.userId], // Creator is admin
      createdBy: decoded.userId,
    });

    // Populate group data for socket emission
    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email avatar')
      .populate('admins', 'name email')
      .populate('createdBy', 'name email');

    // Emit socket event to all members
    if ((global as any).io) {
      const allMembers = [...members, decoded.userId];
      allMembers.forEach((memberId: string) => {
        (global as any).io.to(`user:${memberId}`).emit('groupCreated', {
          group: populatedGroup,
          creatorId: decoded.userId,
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tạo nhóm thành công',
      data: populatedGroup,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all groups where user is a member
    const groups = await Group.find({
      members: decoded.userId,
    })
      .populate('members', 'name email avatar')
      .populate('admins', 'name email')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    return jsonResponse({
      success: true,
      data: groups,
    }, { status: 200, cache: true, maxAge: 30 }); // Cache for 30 seconds
  } catch (error: any) {
    return errorResponse(error.message || 'Lỗi server', 500);
  }
}

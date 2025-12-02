import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Group from '@/lib/models/Group';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const groupId = params.id;
    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(
      (memberId: any) => memberId.toString() === decoded.userId
    );

    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'You are not a member of this group' },
        { status: 400 }
      );
    }

    // Remove user from members
    group.members.splice(memberIndex, 1);

    // If user is admin, remove from admins too
    const adminIndex = group.admins.findIndex(
      (adminId: any) => adminId.toString() === decoded.userId
    );
    if (adminIndex !== -1) {
      group.admins.splice(adminIndex, 1);
    }

    // If no members left, delete the group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return NextResponse.json({
        success: true,
        message: 'Left group successfully. Group was deleted as no members remain.',
      });
    }

    // If no admins left but members exist, make the first member an admin
    if (group.admins.length === 0 && group.members.length > 0) {
      group.admins.push(group.members[0]);
    }

    await group.save();

    return NextResponse.json({
      success: true,
      message: 'Left group successfully',
    });
  } catch (error: any) {
    console.error('Leave group error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

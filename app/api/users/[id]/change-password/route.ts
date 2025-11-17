import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

async function postHandler(req: NextRequest, { user, params }: any) {
  try {
    await connectDB();

    const { userId } = params;
    const { currentPassword, newPassword } = await req.json();

    // Only allow users to change their own password
    if (user.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Bạn chỉ có thể đổi mật khẩu của chính mình' },
        { status: 403 }
      );
    }

    // Find user
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu hiện tại không đúng' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    existingUser.password = hashedPassword;
    await existingUser.save();

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi đổi mật khẩu' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);

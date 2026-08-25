import prisma from '../config/prisma';
import { RegisterDTO, LoginDTO, AuthResponse, SafeUser } from '../types/auth.types';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { OtpService } from './otp.service';
import { MailService } from './mail.service';

export class AuthService {
  static async register(dto: RegisterDTO): Promise<AuthResponse> {
    const { name, email, password } = dto;

    if (!name || !email || !password) {
      throw new AppError('Vui lòng điền đầy đủ họ tên, email và mật khẩu.', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc sử dụng email khác.', 409);
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'student',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        stats: {
          create: {
            totalCardsStudied: 0,
            totalStudyTimeSeconds: 0,
            totalXp: 0,
            streakDays: 1,
            sessionsCompleted: 0,
            averageAccuracy: 100.0,
          },
        },
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const { passwordHash: _, ...safeUser } = newUser;

    return {
      user: {
        ...safeUser,
        role: safeUser.role as any,
        createdAt: safeUser.createdAt.toISOString(),
        updatedAt: safeUser.updatedAt.toISOString(),
      },
      token,
    };
  }

  static async login(dto: LoginDTO): Promise<AuthResponse> {
    const { email, password } = dto;

    if (!email || !password) {
      throw new AppError('Vui lòng nhập đầy đủ email và mật khẩu', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new AppError('Tài khoản với email này chưa tồn tại trong hệ thống. Vui lòng đăng ký tài khoản mới.', 404);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Mật khẩu không chính xác. Vui lòng kiểm tra lại hoặc chọn Quên mật khẩu.', 401);
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { passwordHash: _, ...safeUser } = user;

    return {
      user: {
        ...safeUser,
        role: safeUser.role as any,
        createdAt: safeUser.createdAt.toISOString(),
        updatedAt: safeUser.updatedAt.toISOString(),
      },
      token,
    };
  }

  static async getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    const { passwordHash: _, ...safeUser } = user;
    return {
      ...safeUser,
      role: safeUser.role as any,
      createdAt: safeUser.createdAt.toISOString(),
      updatedAt: safeUser.updatedAt.toISOString(),
    };
  }

  static async requestPasswordReset(email: string): Promise<{ message: string; devOtp?: string }> {
    if (!email) {
      throw new AppError('Vui lòng nhập địa chỉ email', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new AppError('Không tìm thấy tài khoản với email này', 404);
    }

    const otp = OtpService.generateOtp(cleanEmail, 10);
    await MailService.sendOtpEmail(cleanEmail, otp, user.name);

    return {
      message: 'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn',
      ...(process.env.NODE_ENV === 'development' ? { devOtp: otp } : {}),
    };
  }

  static async verifyOtp(email: string, otp: string): Promise<{ message: string; valid: boolean }> {
    if (!email || !otp) {
      throw new AppError('Vui lòng cung cấp đầy đủ email và mã OTP', 400);
    }

    const isValid = OtpService.verifyOtp(email, otp);
    if (!isValid) {
      throw new AppError('Mã OTP không chính xác hoặc đã hết hạn', 400);
    }

    return { message: 'Mã OTP hợp lệ', valid: true };
  }

  static async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    if (!email || !otp || !newPassword) {
      throw new AppError('Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const isValid = OtpService.consumeOtp(cleanEmail, otp);
    if (!isValid) {
      throw new AppError('Mã OTP không chính xác hoặc đã hết hạn', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' };
  }
}


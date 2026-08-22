import prisma from '../config/prisma';
import { RegisterDTO, LoginDTO, AuthResponse, SafeUser } from '../types/auth.types';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/appError';

export class AuthService {
  static async register(dto: RegisterDTO): Promise<AuthResponse> {
    const { name, email, password } = dto;

    if (!name || !email || !password) {
      throw new AppError('Tất cả các trường (name, email, password) là bắt buộc', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Email này đã được sử dụng', 400);
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
      throw new AppError('Email hoặc mật khẩu không chính xác', 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401);
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
}

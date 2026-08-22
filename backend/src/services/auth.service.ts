import { db } from '../models/db';
import { RegisterDTO, LoginDTO, AuthResponse, SafeUser, User } from '../types/auth.types';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/appError';

export class AuthService {
  static async register(dto: RegisterDTO): Promise<AuthResponse> {
    const { name, email, password } = dto;

    if (!name || !email || !password) {
      throw new AppError('Tất cả các trường (name, email, password) là bắt buộc', 400);
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      throw new AppError('Email này đã được sử dụng', 400);
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'student',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.createUser(newUser);

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const { passwordHash: _, ...safeUser } = newUser;

    // Initialize stats for new user
    db.updateUserStats({
      userId: newUser.id,
      totalCardsStudied: 0,
      totalStudyTimeSeconds: 0,
      totalXp: 0,
      streakDays: 1,
      lastStudyDate: new Date().toISOString(),
      sessionsCompleted: 0,
      averageAccuracy: 100,
    });

    return { user: safeUser, token };
  }

  static async login(dto: LoginDTO): Promise<AuthResponse> {
    const { email, password } = dto;

    if (!email || !password) {
      throw new AppError('Vui lòng nhập đầy đủ email và mật khẩu', 400);
    }

    const user = db.findUserByEmail(email);
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

    return { user: safeUser, token };
  }

  static async getMe(userId: string): Promise<SafeUser> {
    const user = db.findUserById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const db_1 = require("../models/db");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const appError_1 = require("../utils/appError");
class AuthService {
    static async register(dto) {
        const { name, email, password } = dto;
        if (!name || !email || !password) {
            throw new appError_1.AppError('Tất cả các trường (name, email, password) là bắt buộc', 400);
        }
        const existingUser = db_1.db.findUserByEmail(email);
        if (existingUser) {
            throw new appError_1.AppError('Email này đã được sử dụng', 400);
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        const newUser = {
            id: `user-${Date.now()}`,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            role: 'student',
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        db_1.db.createUser(newUser);
        const token = (0, jwt_1.signToken)({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
        });
        const { passwordHash: _, ...safeUser } = newUser;
        // Initialize stats for new user
        db_1.db.updateUserStats({
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
    static async login(dto) {
        const { email, password } = dto;
        if (!email || !password) {
            throw new appError_1.AppError('Vui lòng nhập đầy đủ email và mật khẩu', 400);
        }
        const user = db_1.db.findUserByEmail(email);
        if (!user) {
            throw new appError_1.AppError('Email hoặc mật khẩu không chính xác', 401);
        }
        const isMatch = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!isMatch) {
            throw new appError_1.AppError('Email hoặc mật khẩu không chính xác', 401);
        }
        const token = (0, jwt_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser, token };
    }
    static async getMe(userId) {
        const user = db_1.db.findUserById(userId);
        if (!user) {
            throw new appError_1.AppError('Người dùng không tồn tại', 404);
        }
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
    }
}
exports.AuthService = AuthService;

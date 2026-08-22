"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const appError_1 = require("../utils/appError");
class AuthService {
    static async register(dto) {
        const { name, email, password } = dto;
        if (!name || !email || !password) {
            throw new appError_1.AppError('Tất cả các trường (name, email, password) là bắt buộc', 400);
        }
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });
        if (existingUser) {
            throw new appError_1.AppError('Email này đã được sử dụng', 400);
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        const newUser = await prisma_1.default.user.create({
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
        const token = (0, jwt_1.signToken)({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
        });
        const { passwordHash: _, ...safeUser } = newUser;
        return {
            user: {
                ...safeUser,
                role: safeUser.role,
                createdAt: safeUser.createdAt.toISOString(),
                updatedAt: safeUser.updatedAt.toISOString(),
            },
            token,
        };
    }
    static async login(dto) {
        const { email, password } = dto;
        if (!email || !password) {
            throw new appError_1.AppError('Vui lòng nhập đầy đủ email và mật khẩu', 400);
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });
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
        return {
            user: {
                ...safeUser,
                role: safeUser.role,
                createdAt: safeUser.createdAt.toISOString(),
                updatedAt: safeUser.updatedAt.toISOString(),
            },
            token,
        };
    }
    static async getMe(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new appError_1.AppError('Người dùng không tồn tại', 404);
        }
        const { passwordHash: _, ...safeUser } = user;
        return {
            ...safeUser,
            role: safeUser.role,
            createdAt: safeUser.createdAt.toISOString(),
            updatedAt: safeUser.updatedAt.toISOString(),
        };
    }
}
exports.AuthService = AuthService;

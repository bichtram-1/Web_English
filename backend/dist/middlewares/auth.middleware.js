"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const appError_1 = require("../utils/appError");
const requireAuth = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new appError_1.AppError('Vui lòng đăng nhập để tiếp tục (Thiếu Access Token)', 401));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (err) {
        return next(new appError_1.AppError('Token không hợp lệ hoặc đã hết hạn', 401));
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = (0, jwt_1.verifyToken)(token);
        }
        catch {
            // Ignore invalid token in optional mode
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;

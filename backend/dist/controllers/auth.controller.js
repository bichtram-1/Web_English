"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const apiResponse_1 = require("../utils/apiResponse");
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            return apiResponse_1.ApiResponseHandler.created(res, result, 'Đăng ký tài khoản thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            return apiResponse_1.ApiResponseHandler.success(res, result, 'Đăng nhập thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async getMe(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return apiResponse_1.ApiResponseHandler.error(res, 'Chưa xác thực người dùng', 401);
            }
            const user = await auth_service_1.AuthService.getMe(userId);
            return apiResponse_1.ApiResponseHandler.success(res, user, 'Lấy thông tin người dùng thành công');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;

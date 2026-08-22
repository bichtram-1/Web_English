import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponseHandler } from '../utils/apiResponse';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      return ApiResponseHandler.created(res, result, 'Đăng ký tài khoản thành công');
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      return ApiResponseHandler.success(res, result, 'Đăng nhập thành công');
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponseHandler.error(res, 'Chưa xác thực người dùng', 401);
      }
      const user = await AuthService.getMe(userId);
      return ApiResponseHandler.success(res, user, 'Lấy thông tin người dùng thành công');
    } catch (err) {
      next(err);
    }
  }
}

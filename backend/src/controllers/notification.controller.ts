import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { ApiResponseHandler } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const email = req.user?.email;
      if (!userId || !email) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      const notifications = await NotificationService.getNotificationsForUser(userId, email);
      return ApiResponseHandler.success(res, notifications, 'Lấy danh sách thông báo thành công');
    } catch (err) {
      next(err);
    }
  }

  static async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const email = req.user?.email;
      const name = (req.user as any)?.name || (email ? email.split('@')[0] : 'Thành viên');
      if (!userId || !email) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      const result = await NotificationService.acceptInvite(id, { userId, email, name });
      return ApiResponseHandler.success(res, result, 'Đã chấp nhận lời mời tham gia');
    } catch (err) {
      next(err);
    }
  }

  static async declineInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const email = req.user?.email;
      if (!userId || !email) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      const name = (req.user as any)?.name || (email ? email.split('@')[0] : 'Thành viên');
      const result = await NotificationService.declineInvite(id, { userId, email, name });
      return ApiResponseHandler.success(res, result, 'Đã từ chối lời mời');
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const email = req.user?.email;
      if (!userId || !email) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      await NotificationService.markAllAsRead(userId, email);
      return ApiResponseHandler.success(res, { success: true }, 'Đã đánh dấu đã đọc');
    } catch (err) {
      next(err);
    }
  }
}

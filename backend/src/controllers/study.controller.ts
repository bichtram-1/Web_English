import { Request, Response, NextFunction } from 'express';
import { StudyService } from '../services/study.service';
import { ApiResponseHandler } from '../utils/apiResponse';

export class StudyController {
  static async submitSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || 'guest-user';
      const session = await StudyService.recordSession(userId, req.body);
      return ApiResponseHandler.created(res, session, 'Ghi nhận kết quả học tập thành công');
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponseHandler.success(res, [], 'Chưa đăng nhập');
      }
      const history = await StudyService.getHistory(userId);
      return ApiResponseHandler.success(res, history, 'Lấy lịch sử học tập thành công');
    } catch (err) {
      next(err);
    }
  }

  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponseHandler.success(
          res,
          {
            userId: '',
            totalCardsStudied: 0,
            totalStudyTimeSeconds: 0,
            totalXp: 0,
            streakDays: 0,
            lastStudyDate: null,
            sessionsCompleted: 0,
            averageAccuracy: 0,
          },
          'Chưa đăng nhập'
        );
      }
      const stats = await StudyService.getStats(userId);
      return ApiResponseHandler.success(res, stats, 'Lấy thống kê cá nhân thành công');
    } catch (err) {
      next(err);
    }
  }
}

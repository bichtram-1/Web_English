import { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/stats.service';
import { ApiResponseHandler } from '../utils/apiResponse';

export class StatsController {
  static async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await StatsService.getPlatformSummary();
      return ApiResponseHandler.success(res, summary, 'Lấy tổng quan hệ thống thành công');
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const leaderboard = await StatsService.getLeaderboard(limit);
      return ApiResponseHandler.success(res, leaderboard, 'Lấy bảng xếp hạng thành công');
    } catch (err) {
      next(err);
    }
  }
}

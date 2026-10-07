import { Request, Response, NextFunction } from 'express';
import { N8nService } from '../services/n8n.service';
import { ApiResponseHandler } from '../utils/apiResponse';

export class N8nController {
  /**
   * POST /api/v1/automation/n8n/daily-vocab
   */
  static async createDailyVocab(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await N8nService.createDailyVocab(req.body);
      ApiResponseHandler.created(
        res,
        result,
        'Tự động tạo bộ thẻ từ vựng và gửi thông báo thành công từ n8n.'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/automation/n8n/broadcast-reminder
   */
  static async broadcastReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await N8nService.broadcastReminder(req.body);
      ApiResponseHandler.success(res, result, 'Gửi thông báo nhắc nhở tự động thành công.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/automation/n8n/srs-due
   */
  static async getSrsDueUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await N8nService.getSrsDueUsers();
      ApiResponseHandler.success(res, result, 'Lấy danh sách học viên cần ôn tập SRS thành công.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/automation/n8n/status
   */
  static async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await N8nService.getAutomationStatus();
      ApiResponseHandler.success(res, result, 'Trạng thái module tự động hóa n8n đang hoạt động tốt.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/automation/n8n/webhook
   */
  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await N8nService.handleWebhook(req.body);
      ApiResponseHandler.success(res, result, 'Webhook n8n đã được tiếp nhận và xử lý.');
    } catch (err) {
      next(err);
    }
  }
}


import { Request, Response, NextFunction } from 'express';
import { DeckService } from '../services/deck.service';
import { ApiResponseHandler } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export class DeckController {
  static async getAllDecks(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, creatorId } = req.query;
      const decks = await DeckService.getAllDecks({
        search: search as string,
        category: category as string,
        creatorId: creatorId as string,
      });
      return ApiResponseHandler.success(res, decks, 'Lấy danh sách bộ thẻ thành công', 200, {
        total: decks.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDeckById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deck = await DeckService.getDeckById(id);
      return ApiResponseHandler.success(res, deck, 'Lấy thông tin bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async createDeck(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new AppError('Vui lòng đăng nhập để tạo bộ thẻ', 401);
      }
      const creatorName = req.user.email ? req.user.email.split('@')[0] : 'LinguaUser';
      const creatorId = req.user.userId;
      const deck = await DeckService.createDeck(req.body, creatorName, creatorId);
      return ApiResponseHandler.created(res, deck, 'Tạo bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async updateDeck(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập để chỉnh sửa bộ thẻ', 401);
      }
      const updated = await DeckService.updateDeck(id, req.body, userId, userRole);
      return ApiResponseHandler.success(res, updated, 'Cập nhật bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async deleteDeck(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập để xóa bộ thẻ', 401);
      }
      await DeckService.deleteDeck(id, userId, userRole);
      return ApiResponseHandler.success(res, { deleted: true, id }, 'Xóa bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }
}


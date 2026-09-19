import { Request, Response, NextFunction } from 'express';
import { CollectionService } from '../services/collection.service';
import { ApiResponseHandler } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export class CollectionController {
  static async getAllCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, userId } = req.query;
      const collections = await CollectionService.getAllCollections({
        search: search as string,
        userId: userId as string,
        currentUserId: req.user?.userId,
        currentUserRole: req.user?.role,
        currentUserEmail: req.user?.email,
      });
      return ApiResponseHandler.success(res, collections, 'Lấy danh sách bộ thẻ thành công', 200, {
        total: collections.length,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCollectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const collection = await CollectionService.getCollectionById(
        id,
        req.user?.userId,
        req.user?.role,
        req.user?.email
      );
      return ApiResponseHandler.success(res, collection, 'Lấy thông tin danh sách bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async createCollection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw new AppError('Vui lòng đăng nhập để tạo danh sách bộ thẻ', 401);
      }
      const creatorName = req.user.email ? req.user.email.split('@')[0] : 'Người dùng';
      const creatorId = req.user.userId;
      const collection = await CollectionService.createCollection(req.body, creatorName, creatorId);
      return ApiResponseHandler.created(res, collection, 'Tạo danh sách bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async updateCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập để chỉnh sửa danh sách bộ thẻ', 401);
      }
      const updated = await CollectionService.updateCollection(id, req.body, userId, userRole, req.user?.email);
      return ApiResponseHandler.success(res, updated, 'Cập nhật danh sách bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async deleteCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập để xóa danh sách bộ thẻ', 401);
      }
      await CollectionService.deleteCollection(id, userId, userRole);
      return ApiResponseHandler.success(res, { deleted: true, id }, 'Xóa danh sách bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async addDeck(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { deckId } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      if (!deckId) {
        throw new AppError('Thiếu deckId', 400);
      }
      const updated = await CollectionService.addDeckToCollection(id, deckId, userId, userRole);
      return ApiResponseHandler.success(res, updated, 'Đã thêm bộ thẻ vào danh sách');
    } catch (err) {
      next(err);
    }
  }

  static async removeDeck(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, deckId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      const updated = await CollectionService.removeDeckFromCollection(id, deckId, userId, userRole);
      return ApiResponseHandler.success(res, updated, 'Đã xóa bộ thẻ khỏi danh sách');
    } catch (err) {
      next(err);
    }
  }

  static async inviteCollaborator(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      const { email, name, role } = req.body;
      if (!email) {
        throw new AppError('Thiếu email cộng tác viên', 400);
      }
      const updated = await CollectionService.inviteCollaborator(
        id,
        { email, name, role: role || 'viewer', userId: req.body.userId },
        userId,
        userRole
      );
      return ApiResponseHandler.success(res, updated, 'Đã mời cộng tác viên thành công');
    } catch (err) {
      next(err);
    }
  }

  static async removeCollaborator(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, email } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      const updated = await CollectionService.removeCollaborator(id, email, userId, userRole);
      return ApiResponseHandler.success(res, updated, 'Đã xóa cộng tác viên');
    } catch (err) {
      next(err);
    }
  }

  static async updateCollaboratorRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, email } = req.params;
      const { role } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId) {
        throw new AppError('Vui lòng đăng nhập', 401);
      }
      if (!role || (role !== 'viewer' && role !== 'editor')) {
        throw new AppError('Vai trò không hợp lệ', 400);
      }
      const updated = await CollectionService.updateCollaboratorRole(id, email, role, userId, userRole);
      return ApiResponseHandler.success(res, updated, 'Đã cập nhật vai trò cộng tác viên');
    } catch (err) {
      next(err);
    }
  }

  static async joinCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const email = req.user?.email;
      if (!userId || !email) {
        throw new AppError('Vui lòng đăng nhập để tham gia danh sách bộ thẻ', 401);
      }
      const role = (req.body.role === 'editor' ? 'editor' : 'viewer') as 'viewer' | 'editor';
      const name = req.body.name || (email ? email.split('@')[0] : 'Thành viên');

      const updated = await CollectionService.joinCollection(id, { userId, email, name }, role);
      return ApiResponseHandler.success(res, updated, 'Đã tham gia danh sách bộ thẻ thành công');
    } catch (err) {
      next(err);
    }
  }
}

import { db } from '../models/db';
import { Deck, CreateDeckDTO, UpdateDeckDTO } from '../types/deck.types';
import { AppError } from '../utils/appError';

export class DeckService {
  static async getAllDecks(options?: {
    search?: string;
    category?: string;
    creatorId?: string;
  }): Promise<Deck[]> {
    let list = db.decks;

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.creator.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }

    if (options?.category && options.category !== 'All') {
      list = list.filter((d) => d.category.toLowerCase() === options.category?.toLowerCase());
    }

    if (options?.creatorId) {
      list = list.filter((d) => d.creatorId === options.creatorId);
    }

    return list;
  }

  static async getDeckById(id: string): Promise<Deck> {
    const deck = db.findDeckById(id);
    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }
    return deck;
  }

  static async createDeck(dto: CreateDeckDTO, creatorName = 'LinguaUser', creatorId?: string): Promise<Deck> {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new AppError('Tiêu đề bộ thẻ không được để trống', 400);
    }

    const cards = dto.cards || [];
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title: dto.title.trim(),
      description: dto.description?.trim() || '',
      creator: creatorName,
      creatorId,
      itemCount: cards.length,
      category: dto.category || 'Beginner',
      color: dto.color || 'from-indigo-500 to-violet-600',
      isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
      cards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return db.createDeck(newDeck);
  }

  static async updateDeck(id: string, dto: UpdateDeckDTO, userId?: string): Promise<Deck> {
    const existing = db.findDeckById(id);
    if (!existing) {
      throw new AppError('Không tìm thấy bộ thẻ để cập nhật', 404);
    }

    if (userId && existing.creatorId && existing.creatorId !== userId) {
      throw new AppError('Bạn không có quyền chỉnh sửa bộ thẻ này', 403);
    }

    const cards = dto.cards !== undefined ? dto.cards : existing.cards;
    const updates: Partial<Deck> = {
      ...dto,
      cards,
      itemCount: cards.length,
    };

    const updated = db.updateDeck(id, updates);
    if (!updated) {
      throw new AppError('Không thể cập nhật bộ thẻ', 500);
    }
    return updated;
  }

  static async deleteDeck(id: string, userId?: string): Promise<boolean> {
    const existing = db.findDeckById(id);
    if (!existing) {
      throw new AppError('Không tìm thấy bộ thẻ để xóa', 404);
    }

    if (userId && existing.creatorId && existing.creatorId !== userId) {
      throw new AppError('Bạn không có quyền xóa bộ thẻ này', 403);
    }

    return db.deleteDeck(id);
  }
}

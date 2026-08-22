"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeckService = void 0;
const db_1 = require("../models/db");
const appError_1 = require("../utils/appError");
class DeckService {
    static async getAllDecks(options) {
        let list = db_1.db.decks;
        if (options?.search) {
            const q = options.search.toLowerCase();
            list = list.filter((d) => d.title.toLowerCase().includes(q) ||
                d.creator.toLowerCase().includes(q) ||
                (d.description && d.description.toLowerCase().includes(q)));
        }
        if (options?.category && options.category !== 'All') {
            list = list.filter((d) => d.category.toLowerCase() === options.category?.toLowerCase());
        }
        if (options?.creatorId) {
            list = list.filter((d) => d.creatorId === options.creatorId);
        }
        return list;
    }
    static async getDeckById(id) {
        const deck = db_1.db.findDeckById(id);
        if (!deck) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ', 404);
        }
        return deck;
    }
    static async createDeck(dto, creatorName = 'LinguaUser', creatorId) {
        if (!dto.title || dto.title.trim().length === 0) {
            throw new appError_1.AppError('Tiêu đề bộ thẻ không được để trống', 400);
        }
        const cards = dto.cards || [];
        const newDeck = {
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
        return db_1.db.createDeck(newDeck);
    }
    static async updateDeck(id, dto, userId) {
        const existing = db_1.db.findDeckById(id);
        if (!existing) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ để cập nhật', 404);
        }
        if (userId && existing.creatorId && existing.creatorId !== userId) {
            throw new appError_1.AppError('Bạn không có quyền chỉnh sửa bộ thẻ này', 403);
        }
        const cards = dto.cards !== undefined ? dto.cards : existing.cards;
        const updates = {
            ...dto,
            cards,
            itemCount: cards.length,
        };
        const updated = db_1.db.updateDeck(id, updates);
        if (!updated) {
            throw new appError_1.AppError('Không thể cập nhật bộ thẻ', 500);
        }
        return updated;
    }
    static async deleteDeck(id, userId) {
        const existing = db_1.db.findDeckById(id);
        if (!existing) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ để xóa', 404);
        }
        if (userId && existing.creatorId && existing.creatorId !== userId) {
            throw new appError_1.AppError('Bạn không có quyền xóa bộ thẻ này', 403);
        }
        return db_1.db.deleteDeck(id);
    }
}
exports.DeckService = DeckService;

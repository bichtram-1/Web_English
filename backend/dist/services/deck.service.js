"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeckService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const appError_1 = require("../utils/appError");
const mapCardFromDb = (card) => {
    if (card.type === 'drag_drop') {
        let shuffled = [];
        let correctOrder = [];
        try {
            if (card.shuffledJson)
                shuffled = JSON.parse(card.shuffledJson);
            if (card.correctOrderJson)
                correctOrder = JSON.parse(card.correctOrderJson);
        }
        catch (e) {
            console.error('Error parsing card JSON:', e);
        }
        return {
            id: card.id,
            type: 'drag_drop',
            meaning: card.meaning || '',
            shuffled,
            correctOrder,
        };
    }
    return {
        id: card.id,
        type: 'flashcard',
        front: card.front || '',
        back: card.back || '',
        phonetic: card.phonetic || undefined,
        exampleEn: card.exampleEn || undefined,
        exampleVi: card.exampleVi || undefined,
    };
};
const mapDeckFromDb = (d) => {
    const cards = (d.cards || []).map(mapCardFromDb);
    return {
        id: d.id,
        title: d.title,
        description: d.description || '',
        creator: d.creatorName || (d.creator ? d.creator.name : 'LinguaTeam'),
        creatorId: d.creatorId || undefined,
        itemCount: cards.length || d.itemCount || 0,
        category: d.category,
        color: d.color,
        isPublic: d.isPublic,
        cards,
        createdAt: d.createdAt ? d.createdAt.toISOString() : undefined,
        updatedAt: d.updatedAt ? d.updatedAt.toISOString() : undefined,
    };
};
class DeckService {
    static async getAllDecks(options) {
        const where = {};
        if (options?.search) {
            const q = options.search;
            where.OR = [
                { title: { contains: q } },
                { description: { contains: q } },
                { creatorName: { contains: q } },
            ];
        }
        if (options?.category && options.category !== 'All') {
            where.category = { equals: options.category };
        }
        if (options?.creatorId) {
            where.creatorId = options.creatorId;
        }
        const decks = await prisma_1.default.deck.findMany({
            where,
            include: {
                cards: {
                    orderBy: { orderIndex: 'asc' },
                },
                creator: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return decks.map(mapDeckFromDb);
    }
    static async getDeckById(id) {
        const deck = await prisma_1.default.deck.findUnique({
            where: { id },
            include: {
                cards: {
                    orderBy: { orderIndex: 'asc' },
                },
                creator: true,
            },
        });
        if (!deck) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ', 404);
        }
        return mapDeckFromDb(deck);
    }
    static async createDeck(dto, creatorName = 'LinguaUser', creatorId) {
        if (!dto.title || dto.title.trim().length === 0) {
            throw new appError_1.AppError('Tiêu đề bộ thẻ không được để trống', 400);
        }
        const cardsData = (dto.cards || []).map((c, index) => {
            if (c.type === 'drag_drop') {
                return {
                    type: 'drag_drop',
                    meaning: c.meaning,
                    shuffledJson: JSON.stringify(c.shuffled),
                    correctOrderJson: JSON.stringify(c.correctOrder),
                    orderIndex: index + 1,
                };
            }
            return {
                type: 'flashcard',
                front: c.front,
                back: c.back,
                phonetic: c.phonetic,
                exampleEn: c.exampleEn,
                exampleVi: c.exampleVi,
                orderIndex: index + 1,
            };
        });
        const newDeck = await prisma_1.default.deck.create({
            data: {
                title: dto.title.trim(),
                description: dto.description?.trim() || '',
                creatorName,
                creatorId,
                category: dto.category || 'Beginner',
                color: dto.color || 'from-indigo-500 to-violet-600',
                isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
                itemCount: cardsData.length,
                cards: {
                    create: cardsData,
                },
            },
            include: {
                cards: true,
                creator: true,
            },
        });
        return mapDeckFromDb(newDeck);
    }
    static async updateDeck(id, dto, userId) {
        const existing = await prisma_1.default.deck.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ để cập nhật', 404);
        }
        if (userId && existing.creatorId && existing.creatorId !== userId) {
            throw new appError_1.AppError('Bạn không có quyền chỉnh sửa bộ thẻ này', 403);
        }
        // Update main fields
        await prisma_1.default.deck.update({
            where: { id },
            data: {
                title: dto.title ? dto.title.trim() : undefined,
                description: dto.description !== undefined ? dto.description.trim() : undefined,
                category: dto.category || undefined,
                color: dto.color || undefined,
                isPublic: dto.isPublic !== undefined ? dto.isPublic : undefined,
            },
        });
        // If cards provided, replace cards
        if (dto.cards) {
            await prisma_1.default.card.deleteMany({ where: { deckId: id } });
            const cardsData = dto.cards.map((c, index) => {
                if (c.type === 'drag_drop') {
                    return {
                        deckId: id,
                        type: 'drag_drop',
                        meaning: c.meaning,
                        shuffledJson: JSON.stringify(c.shuffled),
                        correctOrderJson: JSON.stringify(c.correctOrder),
                        orderIndex: index + 1,
                    };
                }
                return {
                    deckId: id,
                    type: 'flashcard',
                    front: c.front,
                    back: c.back,
                    phonetic: c.phonetic,
                    exampleEn: c.exampleEn,
                    exampleVi: c.exampleVi,
                    orderIndex: index + 1,
                };
            });
            await prisma_1.default.card.createMany({
                data: cardsData,
            });
            await prisma_1.default.deck.update({
                where: { id },
                data: { itemCount: cardsData.length },
            });
        }
        return this.getDeckById(id);
    }
    static async deleteDeck(id, userId) {
        const existing = await prisma_1.default.deck.findUnique({ where: { id } });
        if (!existing) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ để xóa', 404);
        }
        if (userId && existing.creatorId && existing.creatorId !== userId) {
            throw new appError_1.AppError('Bạn không có quyền xóa bộ thẻ này', 403);
        }
        await prisma_1.default.deck.delete({ where: { id } });
        return true;
    }
}
exports.DeckService = DeckService;

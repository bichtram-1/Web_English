import prisma from '../config/prisma';
import { Deck, CardItem, CreateDeckDTO, UpdateDeckDTO } from '../types/deck.types';
import { AppError } from '../utils/appError';

const mapCardFromDb = (card: any): CardItem => {
  if (card.type === 'drag_drop') {
    let shuffled = [];
    let correctOrder = [];
    try {
      if (card.shuffledJson) shuffled = JSON.parse(card.shuffledJson);
      if (card.correctOrderJson) correctOrder = JSON.parse(card.correctOrderJson);
    } catch (e) {
      console.error('Error parsing card JSON:', e);
    }
    return {
      id: card.id,
      type: 'drag_drop',
      meaning: card.meaning || '',
      shuffled,
      correctOrder,
      grammarRule: card.grammarRule || undefined,
      grammarExplanation: card.grammarExplanation || undefined,
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

const mapDeckFromDb = (d: any): Deck => {
  const cards: CardItem[] = (d.cards || []).map(mapCardFromDb);
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

export class DeckService {
  static async getAllDecks(options?: {
    search?: string;
    category?: string;
    creatorId?: string;
  }): Promise<Deck[]> {
    const where: any = {};

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

    const decks = await prisma.deck.findMany({
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

  static async getDeckById(id: string): Promise<Deck> {
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        cards: {
          orderBy: { orderIndex: 'asc' },
        },
        creator: true,
      },
    });

    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }

    return mapDeckFromDb(deck);
  }

  static async createDeck(dto: CreateDeckDTO, creatorName = 'LinguaUser', creatorId?: string): Promise<Deck> {
    if (!creatorId) {
      throw new AppError('Vui lòng đăng nhập để tạo bộ thẻ', 401);
    }

    if (!dto.title || dto.title.trim().length === 0) {
      throw new AppError('Tiêu đề bộ thẻ không được để trống', 400);
    }

    let finalCreatorName = creatorName;
    try {
      const user = await prisma.user.findUnique({ where: { id: creatorId } });
      if (user?.name) {
        finalCreatorName = user.name;
      }
    } catch {
      // Fallback to provided creatorName
    }

    const cardsData = (dto.cards || []).map((c, index) => {
      if (c.type === 'drag_drop') {
        return {
          type: 'drag_drop',
          meaning: c.meaning,
          shuffledJson: JSON.stringify(c.shuffled),
          correctOrderJson: JSON.stringify(c.correctOrder),
          grammarRule: c.grammarRule,
          grammarExplanation: c.grammarExplanation,
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

    const newDeck = await prisma.deck.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || '',
        creatorName: finalCreatorName,
        creatorId,
        category: dto.category || 'Beginner',
        color: dto.color || 'from-indigo-500 to-violet-600',
        isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
        itemCount: cardsData.length,
        cards: {
          create: cardsData as any,
        },
      },
      include: {
        cards: true,
        creator: true,
      },
    });

    return mapDeckFromDb(newDeck);
  }

  static async updateDeck(id: string, dto: UpdateDeckDTO, userId?: string, userRole?: string): Promise<Deck> {
    const existing = await prisma.deck.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Không tìm thấy bộ thẻ để cập nhật', 404);
    }

    if (!userId) {
      throw new AppError('Vui lòng đăng nhập để chỉnh sửa bộ thẻ này', 401);
    }

    if (userRole !== 'admin' && (!existing.creatorId || existing.creatorId !== userId)) {
      throw new AppError('Bạn không có quyền chỉnh sửa bộ thẻ này', 403);
    }

    // Update main fields
    await prisma.deck.update({
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
      await prisma.card.deleteMany({ where: { deckId: id } });
      const cardsData = dto.cards.map((c, index) => {
        if (c.type === 'drag_drop') {
          return {
            deckId: id,
            type: 'drag_drop',
            meaning: c.meaning,
            shuffledJson: JSON.stringify(c.shuffled),
            correctOrderJson: JSON.stringify(c.correctOrder),
            grammarRule: c.grammarRule,
            grammarExplanation: c.grammarExplanation,
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

      await prisma.card.createMany({
        data: cardsData as any,
      });

      await prisma.deck.update({
        where: { id },
        data: { itemCount: cardsData.length },
      });
    }

    return this.getDeckById(id);
  }

  static async deleteDeck(id: string, userId?: string, userRole?: string): Promise<boolean> {
    const existing = await prisma.deck.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Không tìm thấy bộ thẻ để xóa', 404);
    }

    if (!userId) {
      throw new AppError('Vui lòng đăng nhập để xóa bộ thẻ này', 401);
    }

    if (userRole !== 'admin' && (!existing.creatorId || existing.creatorId !== userId)) {
      throw new AppError('Bạn không có quyền xóa bộ thẻ này', 403);
    }

    await prisma.deck.delete({ where: { id } });
    return true;
  }
}

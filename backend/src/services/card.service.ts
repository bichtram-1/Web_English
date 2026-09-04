import prisma from '../config/prisma';
import { CardItem, Deck } from '../types/deck.types';
import { AppError } from '../utils/appError';
import { DeckService } from './deck.service';

export class CardService {
  static async addCardToDeck(deckId: string, card: CardItem, userId?: string, userRole?: string): Promise<Deck> {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }

    if (!userId) {
      throw new AppError('Vui lòng đăng nhập để thêm thẻ vào bộ thẻ này', 401);
    }

    if (userRole !== 'admin' && (!deck.creatorId || deck.creatorId !== userId)) {
      throw new AppError('Bạn không có quyền thêm thẻ vào bộ thẻ này', 403);
    }

    if (card.type === 'drag_drop') {
      await prisma.card.create({
        data: {
          deckId,
          type: 'drag_drop',
          meaning: card.meaning,
          shuffledJson: JSON.stringify(card.shuffled),
          correctOrderJson: JSON.stringify(card.correctOrder),
          grammarRule: card.grammarRule,
          grammarExplanation: card.grammarExplanation,
        } as any,
      });
    } else {
      await prisma.card.create({
        data: {
          deckId,
          type: 'flashcard',
          front: card.front,
          back: card.back,
          phonetic: card.phonetic,
          exampleEn: card.exampleEn,
          exampleVi: card.exampleVi,
        },
      });
    }

    await prisma.deck.update({
      where: { id: deckId },
      data: { itemCount: { increment: 1 } },
    });

    return DeckService.getDeckById(deckId);
  }

  static async updateCardInDeck(deckId: string, cardId: number, cardData: Partial<CardItem>, userId?: string, userRole?: string): Promise<Deck> {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }

    if (!userId) {
      throw new AppError('Vui lòng đăng nhập để chỉnh sửa thẻ', 401);
    }

    if (userRole !== 'admin' && (!deck.creatorId || deck.creatorId !== userId)) {
      throw new AppError('Bạn không có quyền chỉnh sửa thẻ trong bộ thẻ này', 403);
    }

    const existing = await prisma.card.findFirst({
      where: { id: cardId, deckId },
    });

    if (!existing) {
      throw new AppError('Không tìm thấy thẻ cần cập nhật', 404);
    }

    const data: any = {};
    if (cardData.type === 'flashcard') {
      if (cardData.front !== undefined) data.front = cardData.front;
      if (cardData.back !== undefined) data.back = cardData.back;
      if (cardData.phonetic !== undefined) data.phonetic = cardData.phonetic;
      if (cardData.exampleEn !== undefined) data.exampleEn = cardData.exampleEn;
      if (cardData.exampleVi !== undefined) data.exampleVi = cardData.exampleVi;
    } else if (cardData.type === 'drag_drop') {
      if (cardData.meaning !== undefined) data.meaning = cardData.meaning;
      if (cardData.shuffled !== undefined) data.shuffledJson = JSON.stringify(cardData.shuffled);
      if (cardData.correctOrder !== undefined) data.correctOrderJson = JSON.stringify(cardData.correctOrder);
      if (cardData.grammarRule !== undefined) data.grammarRule = cardData.grammarRule;
      if (cardData.grammarExplanation !== undefined) data.grammarExplanation = cardData.grammarExplanation;
    }

    await prisma.card.update({
      where: { id: cardId },
      data,
    });

    return DeckService.getDeckById(deckId);
  }

  static async deleteCardFromDeck(deckId: string, cardId: number, userId?: string, userRole?: string): Promise<Deck> {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }

    if (!userId) {
      throw new AppError('Vui lòng đăng nhập để xóa thẻ', 401);
    }

    if (userRole !== 'admin' && (!deck.creatorId || deck.creatorId !== userId)) {
      throw new AppError('Bạn không có quyền xóa thẻ khỏi bộ thẻ này', 403);
    }

    const existing = await prisma.card.findFirst({
      where: { id: cardId, deckId },
    });

    if (!existing) {
      throw new AppError('Không tìm thấy thẻ cần xóa', 404);
    }

    await prisma.card.delete({ where: { id: cardId } });

    await prisma.deck.update({
      where: { id: deckId },
      data: { itemCount: { decrement: 1 } },
    });

    return DeckService.getDeckById(deckId);
  }
}

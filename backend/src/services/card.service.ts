import { db } from '../models/db';
import { CardItem, Deck } from '../types/deck.types';
import { AppError } from '../utils/appError';

export class CardService {
  static async addCardToDeck(deckId: string, card: CardItem): Promise<Deck> {
    const deck = db.findDeckById(deckId);
    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }

    const newId = card.id || deck.cards.length + 1;
    const newCard = { ...card, id: newId };
    const updatedCards = [...deck.cards, newCard];

    const updated = db.updateDeck(deckId, {
      cards: updatedCards,
      itemCount: updatedCards.length,
    });

    if (!updated) {
      throw new AppError('Không thể thêm thẻ', 500);
    }

    return updated;
  }

  static async updateCardInDeck(deckId: string, cardId: number, cardData: Partial<CardItem>): Promise<Deck> {
    const deck = db.findDeckById(deckId);
    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }

    const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new AppError('Không tìm thấy thẻ cần cập nhật', 404);
    }

    const updatedCards = [...deck.cards];
    updatedCards[cardIndex] = { ...updatedCards[cardIndex], ...cardData } as CardItem;

    const updated = db.updateDeck(deckId, {
      cards: updatedCards,
    });

    if (!updated) {
      throw new AppError('Không thể cập nhật thẻ', 500);
    }

    return updated;
  }

  static async deleteCardFromDeck(deckId: string, cardId: number): Promise<Deck> {
    const deck = db.findDeckById(deckId);
    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }

    const updatedCards = deck.cards.filter((c) => c.id !== cardId);

    const updated = db.updateDeck(deckId, {
      cards: updatedCards,
      itemCount: updatedCards.length,
    });

    if (!updated) {
      throw new AppError('Không thể xóa thẻ', 500);
    }

    return updated;
  }
}

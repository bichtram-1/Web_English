"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardService = void 0;
const db_1 = require("../models/db");
const appError_1 = require("../utils/appError");
class CardService {
    static async addCardToDeck(deckId, card) {
        const deck = db_1.db.findDeckById(deckId);
        if (!deck) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ', 404);
        }
        const newId = card.id || deck.cards.length + 1;
        const newCard = { ...card, id: newId };
        const updatedCards = [...deck.cards, newCard];
        const updated = db_1.db.updateDeck(deckId, {
            cards: updatedCards,
            itemCount: updatedCards.length,
        });
        if (!updated) {
            throw new appError_1.AppError('Không thể thêm thẻ', 500);
        }
        return updated;
    }
    static async updateCardInDeck(deckId, cardId, cardData) {
        const deck = db_1.db.findDeckById(deckId);
        if (!deck) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ', 404);
        }
        const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) {
            throw new appError_1.AppError('Không tìm thấy thẻ cần cập nhật', 404);
        }
        const updatedCards = [...deck.cards];
        updatedCards[cardIndex] = { ...updatedCards[cardIndex], ...cardData };
        const updated = db_1.db.updateDeck(deckId, {
            cards: updatedCards,
        });
        if (!updated) {
            throw new appError_1.AppError('Không thể cập nhật thẻ', 500);
        }
        return updated;
    }
    static async deleteCardFromDeck(deckId, cardId) {
        const deck = db_1.db.findDeckById(deckId);
        if (!deck) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ', 404);
        }
        const updatedCards = deck.cards.filter((c) => c.id !== cardId);
        const updated = db_1.db.updateDeck(deckId, {
            cards: updatedCards,
            itemCount: updatedCards.length,
        });
        if (!updated) {
            throw new appError_1.AppError('Không thể xóa thẻ', 500);
        }
        return updated;
    }
}
exports.CardService = CardService;

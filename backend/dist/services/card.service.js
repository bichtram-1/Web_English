"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const appError_1 = require("../utils/appError");
const deck_service_1 = require("./deck.service");
class CardService {
    static async addCardToDeck(deckId, card) {
        const deck = await prisma_1.default.deck.findUnique({ where: { id: deckId } });
        if (!deck) {
            throw new appError_1.AppError('Không tìm thấy bộ thẻ', 404);
        }
        if (card.type === 'drag_drop') {
            await prisma_1.default.card.create({
                data: {
                    deckId,
                    type: 'drag_drop',
                    meaning: card.meaning,
                    shuffledJson: JSON.stringify(card.shuffled),
                    correctOrderJson: JSON.stringify(card.correctOrder),
                },
            });
        }
        else {
            await prisma_1.default.card.create({
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
        await prisma_1.default.deck.update({
            where: { id: deckId },
            data: { itemCount: { increment: 1 } },
        });
        return deck_service_1.DeckService.getDeckById(deckId);
    }
    static async updateCardInDeck(deckId, cardId, cardData) {
        const existing = await prisma_1.default.card.findFirst({
            where: { id: cardId, deckId },
        });
        if (!existing) {
            throw new appError_1.AppError('Không tìm thấy thẻ cần cập nhật', 404);
        }
        const data = {};
        if (cardData.type === 'flashcard') {
            if (cardData.front !== undefined)
                data.front = cardData.front;
            if (cardData.back !== undefined)
                data.back = cardData.back;
            if (cardData.phonetic !== undefined)
                data.phonetic = cardData.phonetic;
            if (cardData.exampleEn !== undefined)
                data.exampleEn = cardData.exampleEn;
            if (cardData.exampleVi !== undefined)
                data.exampleVi = cardData.exampleVi;
        }
        else if (cardData.type === 'drag_drop') {
            if (cardData.meaning !== undefined)
                data.meaning = cardData.meaning;
            if (cardData.shuffled !== undefined)
                data.shuffledJson = JSON.stringify(cardData.shuffled);
            if (cardData.correctOrder !== undefined)
                data.correctOrderJson = JSON.stringify(cardData.correctOrder);
        }
        await prisma_1.default.card.update({
            where: { id: cardId },
            data,
        });
        return deck_service_1.DeckService.getDeckById(deckId);
    }
    static async deleteCardFromDeck(deckId, cardId) {
        const existing = await prisma_1.default.card.findFirst({
            where: { id: cardId, deckId },
        });
        if (!existing) {
            throw new appError_1.AppError('Không tìm thấy thẻ cần xóa', 404);
        }
        await prisma_1.default.card.delete({ where: { id: cardId } });
        await prisma_1.default.deck.update({
            where: { id: deckId },
            data: { itemCount: { decrement: 1 } },
        });
        return deck_service_1.DeckService.getDeckById(deckId);
    }
}
exports.CardService = CardService;

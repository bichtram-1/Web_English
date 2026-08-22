"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardController = void 0;
const card_service_1 = require("../services/card.service");
const apiResponse_1 = require("../utils/apiResponse");
class CardController {
    static async addCard(req, res, next) {
        try {
            const { deckId } = req.params;
            const updatedDeck = await card_service_1.CardService.addCardToDeck(deckId, req.body);
            return apiResponse_1.ApiResponseHandler.created(res, updatedDeck, 'Thêm thẻ thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateCard(req, res, next) {
        try {
            const { deckId, cardId } = req.params;
            const updatedDeck = await card_service_1.CardService.updateCardInDeck(deckId, parseInt(cardId, 10), req.body);
            return apiResponse_1.ApiResponseHandler.success(res, updatedDeck, 'Cập nhật thẻ thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteCard(req, res, next) {
        try {
            const { deckId, cardId } = req.params;
            const updatedDeck = await card_service_1.CardService.deleteCardFromDeck(deckId, parseInt(cardId, 10));
            return apiResponse_1.ApiResponseHandler.success(res, updatedDeck, 'Xóa thẻ thành công');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CardController = CardController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeckController = void 0;
const deck_service_1 = require("../services/deck.service");
const apiResponse_1 = require("../utils/apiResponse");
class DeckController {
    static async getAllDecks(req, res, next) {
        try {
            const { search, category, creatorId } = req.query;
            const decks = await deck_service_1.DeckService.getAllDecks({
                search: search,
                category: category,
                creatorId: creatorId,
            });
            return apiResponse_1.ApiResponseHandler.success(res, decks, 'Lấy danh sách bộ thẻ thành công', 200, {
                total: decks.length,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getDeckById(req, res, next) {
        try {
            const { id } = req.params;
            const deck = await deck_service_1.DeckService.getDeckById(id);
            return apiResponse_1.ApiResponseHandler.success(res, deck, 'Lấy thông tin bộ thẻ thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async createDeck(req, res, next) {
        try {
            const creatorName = req.user?.email.split('@')[0] || 'LinguaUser';
            const creatorId = req.user?.userId;
            const deck = await deck_service_1.DeckService.createDeck(req.body, creatorName, creatorId);
            return apiResponse_1.ApiResponseHandler.created(res, deck, 'Tạo bộ thẻ thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateDeck(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const updated = await deck_service_1.DeckService.updateDeck(id, req.body, userId);
            return apiResponse_1.ApiResponseHandler.success(res, updated, 'Cập nhật bộ thẻ thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteDeck(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            await deck_service_1.DeckService.deleteDeck(id, userId);
            return apiResponse_1.ApiResponseHandler.success(res, { deleted: true, id }, 'Xóa bộ thẻ thành công');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DeckController = DeckController;

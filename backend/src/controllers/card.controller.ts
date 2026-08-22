import { Request, Response, NextFunction } from 'express';
import { CardService } from '../services/card.service';
import { ApiResponseHandler } from '../utils/apiResponse';

export class CardController {
  static async addCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { deckId } = req.params;
      const updatedDeck = await CardService.addCardToDeck(deckId, req.body);
      return ApiResponseHandler.created(res, updatedDeck, 'Thêm thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async updateCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { deckId, cardId } = req.params;
      const updatedDeck = await CardService.updateCardInDeck(deckId, parseInt(cardId, 10), req.body);
      return ApiResponseHandler.success(res, updatedDeck, 'Cập nhật thẻ thành công');
    } catch (err) {
      next(err);
    }
  }

  static async deleteCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { deckId, cardId } = req.params;
      const updatedDeck = await CardService.deleteCardFromDeck(deckId, parseInt(cardId, 10));
      return ApiResponseHandler.success(res, updatedDeck, 'Xóa thẻ thành công');
    } catch (err) {
      next(err);
    }
  }
}

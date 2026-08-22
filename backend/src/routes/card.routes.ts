import { Router } from 'express';
import { CardController } from '../controllers/card.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/:deckId/cards', optionalAuth, CardController.addCard);
router.put('/:deckId/cards/:cardId', optionalAuth, CardController.updateCard);
router.delete('/:deckId/cards/:cardId', optionalAuth, CardController.deleteCard);

export default router;

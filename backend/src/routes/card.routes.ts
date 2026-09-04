import { Router } from 'express';
import { CardController } from '../controllers/card.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/:deckId/cards', requireAuth, CardController.addCard);
router.put('/:deckId/cards/:cardId', requireAuth, CardController.updateCard);
router.delete('/:deckId/cards/:cardId', requireAuth, CardController.deleteCard);

export default router;


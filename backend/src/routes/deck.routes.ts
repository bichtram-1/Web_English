import { Router } from 'express';
import { DeckController } from '../controllers/deck.controller';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuth, DeckController.getAllDecks);
router.get('/:id', optionalAuth, DeckController.getDeckById);
router.post('/', optionalAuth, DeckController.createDeck);
router.put('/:id', optionalAuth, DeckController.updateDeck);
router.delete('/:id', optionalAuth, DeckController.deleteDeck);

export default router;

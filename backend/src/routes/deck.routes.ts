import { Router } from 'express';
import { DeckController } from '../controllers/deck.controller';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuth, DeckController.getAllDecks);
router.get('/:id', optionalAuth, DeckController.getDeckById);
router.post('/', requireAuth, DeckController.createDeck);
router.post('/:id/rate', optionalAuth, DeckController.rateDeck);
router.put('/:id', requireAuth, DeckController.updateDeck);
router.delete('/:id', requireAuth, DeckController.deleteDeck);

export default router;


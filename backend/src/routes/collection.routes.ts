import { Router } from 'express';
import { CollectionController } from '../controllers/collection.controller';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuth, CollectionController.getAllCollections);
router.get('/:id', optionalAuth, CollectionController.getCollectionById);
router.post('/', requireAuth, CollectionController.createCollection);
router.put('/:id', requireAuth, CollectionController.updateCollection);
router.delete('/:id', requireAuth, CollectionController.deleteCollection);

// Deck management within collection
router.post('/:id/decks', requireAuth, CollectionController.addDeck);
router.delete('/:id/decks/:deckId', requireAuth, CollectionController.removeDeck);

// Collaborator management
router.post('/:id/join', requireAuth, CollectionController.joinCollection);
router.post('/:id/collaborators', requireAuth, CollectionController.inviteCollaborator);
router.delete('/:id/collaborators/:email', requireAuth, CollectionController.removeCollaborator);
router.patch('/:id/collaborators/:email', requireAuth, CollectionController.updateCollaboratorRole);

export default router;

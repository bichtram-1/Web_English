import type { Deck, DeckCollection } from '../types/DeckType';
import type { User } from '../types/auth.types';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Check if the currently logged-in user is the original creator of a Deck (or Admin)
 */
export function isDeckCreator(deck: Deck | null | undefined, user: User | null | undefined): boolean {
  if (!deck) return false;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (deck.creatorId) {
    return deck.creatorId === user.id;
  }
  // If no creatorId (legacy decks), ensure generic system names cannot be claimed
  const systemNames = ['linguateam', 'linguauser', 'người dùng', 'learner', 'admin'];
  if (deck.creator && !systemNames.includes(deck.creator.toLowerCase())) {
    if (user.name && deck.creator.toLowerCase() === user.name.toLowerCase()) return true;
    if (user.email && deck.creator.toLowerCase() === user.email.split('@')[0].toLowerCase()) return true;
  }
  return false;
}


/**
 * Check if the user has edit permission for a Deck (Creator OR Collaborator with 'editor' role, OR Editor in a parent Collection)
 */
export function canEditDeck(
  deck: Deck | null | undefined,
  user: User | null | undefined,
  parentCollection?: DeckCollection | null
): boolean {
  if (!deck) return false;
  if (isDeckCreator(deck, user)) return true;
  if (!user) return false;
  
  const collaborator = deck.collaborators?.find(
    (c) =>
      (c.userId && c.userId === user.id) ||
      (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase())
  );
  if (collaborator?.role === 'editor') return true;

  if (parentCollection && canEditCollection(parentCollection, user)) {
    return true;
  }

  // Also check if any stored collection containing this deck allows editing
  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.COLLECTIONS_CACHE) ||
      localStorage.getItem('lingua_deck_collections');
    if (raw) {
      const collections: DeckCollection[] = JSON.parse(raw);
      const isCollectionEditor = collections.some(
        (col) =>
          col.deckIds?.includes(deck.id) &&
          canEditCollection(col, user)
      );
      if (isCollectionEditor) return true;
    }
  } catch {}

  return false;
}

/**
 * Check if the currently logged-in user is the original creator of a Collection (or Admin)
 */
export function isCollectionCreator(collection: DeckCollection | null | undefined, user: User | null | undefined): boolean {
  if (!collection) return false;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (collection.creatorId && collection.creatorId === user.id) return true;
  if (collection.creator && user.name && collection.creator.toLowerCase() === user.name.toLowerCase()) return true;
  if (collection.creator && user.email && collection.creator.toLowerCase() === user.email.split('@')[0].toLowerCase()) return true;
  return false;
}

/**
 * Check if the user has edit permission for a Collection (Creator OR Collaborator with 'editor' role)
 */
export function canEditCollection(collection: DeckCollection | null | undefined, user: User | null | undefined): boolean {
  if (!collection) return false;
  if (isCollectionCreator(collection, user)) return true;
  if (!user) return false;
  
  const collaborator = collection.collaborators?.find(
    (c) =>
      (c.userId && c.userId === user.id) ||
      (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase())
  );
  return collaborator?.role === 'editor';
}

/**
 * Check if the user has view/study permission for a Deck
 * - Public decks: accessible to everyone
 * - Private decks: accessible to creator, collaborators, or parent collection members
 */
export function canViewDeck(
  deck: Deck | null | undefined,
  user: User | null | undefined,
  parentCollection?: DeckCollection | null
): boolean {
  if (!deck) return false;
  // Public deck is visible to everyone
  if (deck.isPublic !== false) return true;
  // Private deck requires login and ownership/access
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (isDeckCreator(deck, user)) return true;

  const collaborator = deck.collaborators?.find(
    (c) =>
      (c.userId && c.userId === user.id) ||
      (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase())
  );
  if (collaborator) return true;

  if (parentCollection && canViewCollection(parentCollection, user)) {
    return true;
  }

  try {
    const raw =
      localStorage.getItem(STORAGE_KEYS.COLLECTIONS_CACHE) ||
      localStorage.getItem('lingua_deck_collections');
    if (raw) {
      const collections: DeckCollection[] = JSON.parse(raw);
      const canViewViaCol = collections.some(
        (col) =>
          col.deckIds?.includes(deck.id) &&
          canViewCollection(col, user)
      );
      if (canViewViaCol) return true;
    }
  } catch {}

  return false;
}

/**
 * Check if the user has view/study permission for a Collection
 * - Public collections: accessible to everyone
 * - Private collections: accessible ONLY to creator, collaborators, or Admin
 */
export function canViewCollection(collection: DeckCollection | null | undefined, user: User | null | undefined): boolean {
  if (!collection) return false;
  if (collection.isPublic !== false) return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (isCollectionCreator(collection, user)) return true;

  const collaborator = collection.collaborators?.find(
    (c) =>
      (c.userId && c.userId === user.id) ||
      (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase())
  );
  return Boolean(collaborator);
}

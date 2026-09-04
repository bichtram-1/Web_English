import type { Deck, DeckCollection } from '../types/DeckType';
import type { User } from '../types/auth.types';

/**
 * Check if the currently logged-in user is the original creator of a Deck (or Admin)
 */
export function isDeckCreator(deck: Deck | null | undefined, user: User | null | undefined): boolean {
  if (!deck) return false;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (deck.creatorId && deck.creatorId === user.id) return true;
  if (deck.creator && user.name && deck.creator.toLowerCase() === user.name.toLowerCase()) return true;
  if (deck.creator && user.email && deck.creator.toLowerCase() === user.email.split('@')[0].toLowerCase()) return true;
  return false;
}

/**
 * Check if the user has edit permission for a Deck (Creator OR Collaborator with 'editor' role)
 */
export function canEditDeck(deck: Deck | null | undefined, user: User | null | undefined): boolean {
  if (!deck) return false;
  if (isDeckCreator(deck, user)) return true;
  if (!user) return false;
  
  const collaborator = deck.collaborators?.find(
    (c) =>
      (c.userId && c.userId === user.id) ||
      (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase())
  );
  return collaborator?.role === 'editor';
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

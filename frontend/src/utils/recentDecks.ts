import { STORAGE_KEYS } from '../constants/storage';
import type { Deck } from '../types/DeckType';

export interface RecentDeckItem {
  id: string;
  title: string;
  creator: string;
  category: string;
  itemCount: number;
  color: string;
  viewedAt?: string;
  createdAt?: string;
}

export function recordViewedDeck(deck: Deck) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_VIEWED_DECKS);
    let list: RecentDeckItem[] = raw ? JSON.parse(raw) : [];
    // Remove if already exists
    list = list.filter((item) => item.id !== deck.id);
    // Add to front
    list.unshift({
      id: deck.id,
      title: deck.title,
      creator: deck.creator,
      category: deck.category,
      itemCount: deck.itemCount,
      color: deck.color,
      viewedAt: new Date().toISOString(),
    });
    // Keep max 50
    if (list.length > 50) list = list.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.RECENT_VIEWED_DECKS, JSON.stringify(list));
  } catch (e) {
    console.error('Error recording recent viewed deck:', e);
  }
}

export function getRecentViewedDecks(): RecentDeckItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_VIEWED_DECKS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error getting recent viewed decks:', e);
    return [];
  }
}

export function recordCreatedDeck(deck: Deck) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_CREATED_DECKS);
    let list: RecentDeckItem[] = raw ? JSON.parse(raw) : [];
    list = list.filter((item) => item.id !== deck.id);
    list.unshift({
      id: deck.id,
      title: deck.title,
      creator: deck.creator,
      category: deck.category,
      itemCount: deck.itemCount,
      color: deck.color,
      createdAt: new Date().toISOString(),
    });
    if (list.length > 50) list = list.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.RECENT_CREATED_DECKS, JSON.stringify(list));
  } catch (e) {
    console.error('Error recording recent created deck:', e);
  }
}

export function getRecentCreatedDecks(): RecentDeckItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_CREATED_DECKS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error getting recent created decks:', e);
    return [];
  }
}

export type DeckSortOption = 'recent' | 'title' | 'title-desc';

/**
 * Sorts an array of decks Quizlet-style:
 * - 'recent': Recently viewed / studied decks first, then recently created
 * - 'title': Alphabetical A-Z by deck title (Vietnamese & English locale-aware)
 * - 'title-desc': Alphabetical Z-A by deck title
 */
export function sortDecks<T extends { id: string; title: string; createdAt?: string }>(
  decks: T[],
  sortBy: DeckSortOption = 'recent'
): T[] {
  if (!decks || decks.length <= 1) return decks;

  if (sortBy === 'title') {
    return [...decks].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'vi', { numeric: true, sensitivity: 'base' })
    );
  }

  if (sortBy === 'title-desc') {
    return [...decks].sort((a, b) =>
      (b.title || '').localeCompare(a.title || '', 'vi', { numeric: true, sensitivity: 'base' })
    );
  }

  if (sortBy === 'recent') {
    const recentViewed = getRecentViewedDecks();
    const rankMap = new Map<string, number>();
    recentViewed.forEach((item, idx) => {
      rankMap.set(item.id, idx);
    });

    return [...decks].sort((a, b) => {
      const rankA = rankMap.has(a.id) ? rankMap.get(a.id)! : -1;
      const rankB = rankMap.has(b.id) ? rankMap.get(b.id)! : -1;

      // Both are in recent list: lower index means viewed more recently
      if (rankA !== -1 && rankB !== -1) {
        return rankA - rankB;
      }
      // Only A is in recent list
      if (rankA !== -1) return -1;
      // Only B is in recent list
      if (rankB !== -1) return 1;

      // Neither in recent viewed: sort by createdAt (newest first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;

      return 0;
    });
  }

  return decks;
}

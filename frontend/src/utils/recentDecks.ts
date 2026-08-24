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
    // Keep max 10
    if (list.length > 10) list = list.slice(0, 10);
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
    if (list.length > 10) list = list.slice(0, 10);
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

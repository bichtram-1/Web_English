import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { mockDecks } from '../data/mockData';
import { STORAGE_KEYS } from '../constants/storage';
import type { Deck, CreateDeckDTO } from '../types/deck.types';
import type { ApiResponse } from '../types/api.types';

const getStoredDecks = (): Deck[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DECKS_CACHE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading decks cache:', e);
  }
  return mockDecks;
};

const saveDecksToStorage = (decks: Deck[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DECKS_CACHE, JSON.stringify(decks));
  } catch (e) {
    console.error('Error saving decks cache:', e);
  }
};

export const deckApi = {
  getDecks: async (params?: { search?: string; category?: string }): Promise<Deck[]> => {
    try {
      const res = (await axiosInstance.get(ENDPOINTS.DECKS, {
        params,
      })) as unknown as ApiResponse<Deck[]>;
      if (res?.data) {
        saveDecksToStorage(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend unavailable, fallback to local decks cache:', e);
    }
    // Fallback to local storage
    let local = getStoredDecks();
    if (params?.search) {
      const q = params.search.toLowerCase();
      local = local.filter((d) => d.title.toLowerCase().includes(q) || d.creator.toLowerCase().includes(q));
    }
    if (params?.category && params.category !== 'All') {
      local = local.filter((d) => d.category.toLowerCase() === params.category?.toLowerCase());
    }
    return local;
  },

  getDeckById: async (id: string): Promise<Deck | undefined> => {
    try {
      const res = (await axiosInstance.get(ENDPOINTS.DECK_BY_ID(id))) as unknown as ApiResponse<Deck>;
      if (res?.data) {
        return res.data;
      }
    } catch (e) {
      console.warn(`Backend unavailable for deck ${id}, fallback to local cache:`, e);
    }
    const decks = getStoredDecks();
    return decks.find((d) => d.id === id);
  },

  createDeck: async (newDeckData: Deck | CreateDeckDTO): Promise<Deck> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.CREATE_DECK,
        newDeckData
      )) as unknown as ApiResponse<Deck>;
      if (res?.data) {
        const stored = getStoredDecks();
        saveDecksToStorage([res.data, ...stored]);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend unavailable for createDeck, saving locally:', e);
    }

    const fullDeck: Deck = {
      id: (newDeckData as Deck).id || `deck-${Date.now()}`,
      title: newDeckData.title,
      description: newDeckData.description || '',
      creator: (newDeckData as Deck).creator || 'User',
      itemCount: newDeckData.cards?.length || 0,
      category: newDeckData.category || 'Beginner',
      color: newDeckData.color || 'from-indigo-500 to-violet-600',
      cards: newDeckData.cards || [],
    };

    const decks = getStoredDecks();
    const updated = [fullDeck, ...decks.filter((d) => d.id !== fullDeck.id)];
    saveDecksToStorage(updated);
    return fullDeck;
  },

  updateDeck: async (id: string, updates: Partial<Deck>): Promise<Deck> => {
    try {
      const res = (await axiosInstance.put(
        ENDPOINTS.UPDATE_DECK(id),
        updates
      )) as unknown as ApiResponse<Deck>;
      if (res?.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend unavailable for updateDeck, updating locally:', e);
    }
    const decks = getStoredDecks();
    const index = decks.findIndex((d) => d.id === id);
    if (index !== -1) {
      decks[index] = { ...decks[index], ...updates };
      saveDecksToStorage(decks);
      return decks[index];
    }
    throw new Error('Deck not found');
  },

  deleteDeck: async (id: string): Promise<boolean> => {
    try {
      await axiosInstance.delete(ENDPOINTS.DELETE_DECK(id));
    } catch (e) {
      console.warn('Backend unavailable for deleteDeck, removing locally:', e);
    }
    const decks = getStoredDecks();
    const filtered = decks.filter((d) => d.id !== id);
    saveDecksToStorage(filtered);
    return true;
  },
};

export default deckApi;

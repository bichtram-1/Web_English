import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { mockDecks } from '../data/mockData';
import { STORAGE_KEYS } from '../constants/storage';
import type { Deck, CreateDeckDTO } from '../types/deck.types';
import type { ApiResponse } from '../types/api.types';
import type { User } from '../types/auth.types';
import { canViewDeck } from '../utils/permission';

export const getCurrentUserFromStorage = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading user data from storage:', e);
  }
  return null;
};

export const getStoredDecks = (): Deck[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DECKS_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with mockDecks and ensure standard decks have full cards array
        const customDeckIds = new Set(parsed.map((d: Deck) => d.id));
        const missingMocks = mockDecks.filter((m) => !customDeckIds.has(m.id));
        const merged = parsed.map((d: Deck) => {
          const mock = mockDecks.find((m) => m.id === d.id);
          if (mock) {
            return {
              ...mock,
              ...d,
              cards: (!d.cards || d.cards.length === 0) ? mock.cards : d.cards,
              itemCount: (!d.cards || d.cards.length === 0) ? mock.cards.length : d.cards.length,
              rating: d.rating !== undefined ? d.rating : mock.rating,
              ratingCount: d.ratingCount !== undefined ? d.ratingCount : mock.ratingCount,
            };
          }
          return d;
        });
        return [...merged, ...missingMocks];
      }
    }
  } catch (e) {
    console.error('Error reading decks cache:', e);
  }
  saveDecksToStorage(mockDecks);
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
    let result: Deck[] = [];
    try {
      const res = (await axiosInstance.get(ENDPOINTS.DECKS, {
        params,
      })) as any;
      if (Array.isArray(res) && res.length > 0) {
        result = res;
      } else if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        result = res.data;
      }

      if (result.length > 0) {
        const cachedDecks = getStoredDecks();
        const merged = result.map((d) => {
          const cached = cachedDecks.find((c) => c.id === d.id);
          if (cached && (!d.ratingCount || d.ratingCount === 0) && cached.ratingCount && cached.ratingCount > 0) {
            return {
              ...d,
              rating: cached.rating,
              ratingCount: cached.ratingCount,
              userRatings: cached.userRatings,
            };
          }
          return d;
        });
        saveDecksToStorage(merged);
        result = merged;
      }
    } catch (e) {
      console.warn('Backend unavailable, fallback to local decks cache:', e);
    }

    if (!result || result.length === 0) {
      // Fallback to local storage or mockDecks
      let local = getStoredDecks();
      if (!local || local.length === 0) {
        local = mockDecks;
        saveDecksToStorage(mockDecks);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        local = local.filter((d) => d.title.toLowerCase().includes(q) || d.creator.toLowerCase().includes(q));
      }
      if (params?.category && params.category !== 'All') {
        local = local.filter((d) => d.category?.toLowerCase() === params.category?.toLowerCase());
      }
      result = local;
    }

    // Always filter by view permission so private decks owned by others are never leaked
    const currentUser = getCurrentUserFromStorage();
    return result.filter((d) => canViewDeck(d, currentUser));
  },

  getAllDecks: async (): Promise<Deck[]> => {
    return deckApi.getDecks();
  },

  getDeckById: async (id: string): Promise<Deck | undefined> => {
    if (id.startsWith('col-')) {
      const { collectionApi } = await import('./collectionApi');
      return collectionApi.getCompositeDeckForCollection(id);
    }
    let found: Deck | undefined;
    let is404 = false;
    let is403 = false;
    try {
      const res = (await axiosInstance.get(ENDPOINTS.DECK_BY_ID(id))) as unknown as ApiResponse<Deck>;
      if (res?.data && typeof res.data === 'object') {
        found = res.data;
      } else if ((res as any)?.id) {
        found = res as any;
      }
    } catch (e: any) {
      if (e?.status === 403) {
        is403 = true;
      }
      if (e?.status === 404) {
        is404 = true;
        // Clean up deleted deck from local cache
        const decks = getStoredDecks();
        const cleaned = decks.filter((d) => d.id !== id);
        saveDecksToStorage(cleaned);
      }
      console.warn(`Backend unavailable for deck ${id}, fallback to local cache:`, e);
    }

    if (is403) {
      return undefined;
    }

    if (!found && !is404) {
      const decks = getStoredDecks();
      found = decks.find((d) => d.id === id);
    }
    if (!found) {
      found = mockDecks.find((d) => d.id === id);
    }
    if (found && (!found.cards || found.cards.length === 0)) {
      const mock = mockDecks.find((d) => d.id === id);
      if (mock && mock.cards && mock.cards.length > 0) {
        found = { ...found, cards: mock.cards, itemCount: mock.cards.length };
      }
    }

    // Preserve local rating if backend has no ratings yet
    if (found) {
      const cached = getStoredDecks().find((d) => d.id === id);
      if (cached && (!found.ratingCount || found.ratingCount === 0) && cached.ratingCount && cached.ratingCount > 0) {
        found = {
          ...found,
          rating: cached.rating,
          ratingCount: cached.ratingCount,
          userRatings: cached.userRatings,
        };
      }
    }

    // Enforce view permission check on found deck
    if (found) {
      const currentUser = getCurrentUserFromStorage();
      if (!canViewDeck(found, currentUser)) {
        return undefined;
      }
    }

    return found;
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
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        throw e;
      }
      console.warn('Backend unavailable for createDeck, saving locally:', e);
    }

    const fullDeck: Deck = {
      id: (newDeckData as Deck).id || `deck-${Date.now()}`,
      title: newDeckData.title,
      description: newDeckData.description || '',
      creator: (newDeckData as Deck).creator || 'User',
      creatorId: (newDeckData as Deck).creatorId,
      itemCount: newDeckData.cards?.length || 0,
      category: newDeckData.category || 'Beginner',
      color: newDeckData.color || 'from-indigo-500 to-violet-600',
      isPublic: newDeckData.isPublic !== undefined ? newDeckData.isPublic : true,
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
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        throw e;
      }
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
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        throw e;
      }
      console.warn('Backend unavailable for deleteDeck, removing locally:', e);
    }
    const decks = getStoredDecks();
    const filtered = decks.filter((d) => d.id !== id);
    saveDecksToStorage(filtered);
    return true;
  },


  rateDeck: async (id: string, score: number, userId: string = 'guest'): Promise<Deck> => {
    let serverDeck: Deck | undefined;
    try {
      const res = (await axiosInstance.post(
        `${ENDPOINTS.DECK_BY_ID(id)}/rate`,
        { score, userId }
      )) as any;
      if (res?.data && typeof res.data === 'object') {
        serverDeck = res.data;
      } else if (res?.id) {
        serverDeck = res;
      }
    } catch (e) {
      console.warn('Backend unavailable for rateDeck, updating locally:', e);
    }

    if (serverDeck) {
      const decks = getStoredDecks();
      const index = decks.findIndex((d) => d.id === id);
      if (index !== -1) {
        decks[index] = { ...decks[index], ...serverDeck };
      } else {
        decks.unshift(serverDeck);
      }
      saveDecksToStorage(decks);
      return serverDeck;
    }

    const decks = getStoredDecks();
    const index = decks.findIndex((d) => d.id === id);
    if (index !== -1) {
      const deck = decks[index];
      const userRatings = { ...(deck.userRatings || {}) };
      userRatings[userId] = score;

      const scores = Object.values(userRatings);
      // If mock ratings existed, blend with existing ratingCount
      let totalSum = 0;
      let totalCount = 0;
      if (deck.rating && deck.ratingCount && !deck.userRatings) {
        totalSum = deck.rating * deck.ratingCount + score;
        totalCount = deck.ratingCount + 1;
      } else {
        totalSum = scores.reduce((sum, s) => sum + s, 0);
        totalCount = scores.length;
      }

      const avg = totalCount > 0 ? totalSum / totalCount : score;
      const roundedAvg = Math.round(avg * 10) / 10;

      const updatedDeck: Deck = {
        ...deck,
        userRatings,
        rating: Math.min(5, Math.max(1, roundedAvg)),
        ratingCount: totalCount,
      };

      decks[index] = updatedDeck;
      saveDecksToStorage(decks);
      return updatedDeck;
    }
    throw new Error('Deck not found');
  },
};

export default deckApi;

import { mockDecks, type Deck } from '../data/mockData';
import { STORAGE_KEYS } from '../constants/storage';

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
  getDecks: async (): Promise<Deck[]> => {
    return getStoredDecks();
  },

  getDeckById: async (id: string): Promise<Deck | undefined> => {
    const decks = getStoredDecks();
    return decks.find((d) => d.id === id);
  },

  createDeck: async (newDeck: Deck): Promise<Deck> => {
    const decks = getStoredDecks();
    const updated = [newDeck, ...decks];
    saveDecksToStorage(updated);
    return newDeck;
  },
};

export default deckApi;

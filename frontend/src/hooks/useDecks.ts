import { useState, useEffect, useCallback } from 'react';
import type { Deck } from '../types/DeckType';
import deckApi, { getStoredDecks } from '../api/deckApi';
import { mockDecks } from '../data/mockData';

export const DECKS_CHANGED_EVENT = 'lingualeap_decks_changed';

let memoryDecksCache: Deck[] | null = null;
let inFlightFetch: Promise<Deck[]> | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 60000; // 60s cache

export function notifyDecksChanged(updatedDeck?: Deck) {
  memoryDecksCache = null;
  lastFetchTimestamp = 0;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DECKS_CHANGED_EVENT, { detail: updatedDeck }));
  }
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(() => {
    if (memoryDecksCache && memoryDecksCache.length > 0) return memoryDecksCache;
    try {
      const stored = getStoredDecks();
      if (Array.isArray(stored) && stored.length > 0) {
        memoryDecksCache = stored;
        return stored;
      }
    } catch {}
    return mockDecks;
  });
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDecks = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && memoryDecksCache && now - lastFetchTimestamp < CACHE_TTL_MS) {
      setDecks(memoryDecksCache);
      setLoading(false);
      return;
    }

    if (!inFlightFetch) {
      inFlightFetch = deckApi.getDecks()
        .then((data) => {
          const valid = Array.isArray(data) && data.length > 0 ? data : mockDecks;
          memoryDecksCache = valid;
          lastFetchTimestamp = Date.now();
          return valid;
        })
        .catch((e) => {
          console.warn('Fallback to mockDecks:', e);
          return mockDecks;
        })
        .finally(() => {
          inFlightFetch = null;
        });
    }

    try {
      const result = await inFlightFetch;
      setDecks(result);
    } catch {
      setDecks(mockDecks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();

    const handleDecksChanged = (event: Event) => {
      const customEvent = event as CustomEvent<Deck | undefined>;
      const newOrUpdated = customEvent.detail;
      if (newOrUpdated && newOrUpdated.id) {
        setDecks((prev) => {
          const index = prev.findIndex((d) => d.id === newOrUpdated.id);
          if (index !== -1) {
            return prev.map((d) => (d.id === newOrUpdated.id ? { ...d, ...newOrUpdated } : d));
          } else {
            return [newOrUpdated, ...prev.filter((d) => d.id !== newOrUpdated.id)];
          }
        });
      } else {
        fetchDecks();
      }
    };

    window.addEventListener(DECKS_CHANGED_EVENT, handleDecksChanged);
    return () => {
      window.removeEventListener(DECKS_CHANGED_EVENT, handleDecksChanged);
    };
  }, [fetchDecks]);

  const addDeck = async (newDeck: Deck) => {
    const created = await deckApi.createDeck(newDeck);
    setDecks((prev) => [created, ...prev.filter((d) => d.id !== created.id)]);
    notifyDecksChanged(created);
    return created;
  };

  const updateDeck = async (id: string, updates: Partial<Deck>) => {
    const updated = await deckApi.updateDeck(id, updates);
    setDecks((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
    notifyDecksChanged(updated);
    return updated;
  };

  const deleteDeck = async (id: string) => {
    await deckApi.deleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    notifyDecksChanged();
  };

  return { decks, loading, refetch: fetchDecks, addDeck, updateDeck, deleteDeck };
}

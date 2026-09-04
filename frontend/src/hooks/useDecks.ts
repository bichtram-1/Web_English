import { useState, useEffect, useCallback } from 'react';
import type { Deck } from '../types/DeckType';
import deckApi from '../api/deckApi';
import { mockDecks } from '../data/mockData';

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(() => mockDecks);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDecks = useCallback(async () => {
    try {
      const data = await deckApi.getDecks();
      if (Array.isArray(data) && data.length > 0) {
        setDecks(data);
      } else {
        setDecks(mockDecks);
      }
    } catch (e) {
      console.warn('Fallback to mockDecks:', e);
      setDecks(mockDecks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const addDeck = async (newDeck: Deck) => {
    const created = await deckApi.createDeck(newDeck);
    setDecks((prev) => [created, ...prev]);
    return created;
  };

  const updateDeck = async (id: string, updates: Partial<Deck>) => {
    const updated = await deckApi.updateDeck(id, updates);
    setDecks((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
    return updated;
  };

  const deleteDeck = async (id: string) => {
    await deckApi.deleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
  };

  return { decks, loading, refetch: fetchDecks, addDeck, updateDeck, deleteDeck };
}


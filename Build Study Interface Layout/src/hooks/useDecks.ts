import { useState, useEffect, useCallback } from 'react';
import type { Deck } from '../types/DeckType';
import deckApi from '../api/deckApi';

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await deckApi.getDecks();
      setDecks(data);
    } catch (e) {
      console.error('Failed to load decks:', e);
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

  return { decks, loading, refetch: fetchDecks, addDeck };
}

import { useState, useEffect, useCallback } from 'react';

const PREFIX = 'lingualeap_starred_';

export function getStarredCardIds(deckId: string): number[] {
  try {
    const raw = localStorage.getItem(`${PREFIX}${deckId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error getting starred card IDs:', e);
    return [];
  }
}

export function saveStarredCardIds(deckId: string, ids: number[]): void {
  try {
    localStorage.setItem(`${PREFIX}${deckId}`, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('starred_cards_updated', { detail: { deckId, ids } }));
  } catch (e) {
    console.error('Error saving starred card IDs:', e);
  }
}

export function isCardStarred(deckId: string, cardId: number): boolean {
  const ids = getStarredCardIds(deckId);
  return ids.includes(cardId);
}

export function toggleCardStar(deckId: string, cardId: number): boolean {
  const ids = getStarredCardIds(deckId);
  const exists = ids.includes(cardId);
  const updated = exists ? ids.filter((id) => id !== cardId) : [...ids, cardId];
  saveStarredCardIds(deckId, updated);
  return !exists;
}

export function starAllCards(deckId: string, allCardIds: number[]): void {
  saveStarredCardIds(deckId, Array.from(new Set(allCardIds)));
}

export function unstarAllCards(deckId: string): void {
  saveStarredCardIds(deckId, []);
}

/**
 * React hook to interact reactively with starred cards for a given deck.
 */
export function useStarredCards(deckId: string) {
  const [starredIds, setStarredIds] = useState<number[]>(() => getStarredCardIds(deckId));

  useEffect(() => {
    setStarredIds(getStarredCardIds(deckId));

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ deckId: string; ids?: number[] }>;
      if (customEvent.detail && customEvent.detail.deckId === deckId) {
        setStarredIds(customEvent.detail.ids ?? getStarredCardIds(deckId));
      }
    };

    window.addEventListener('starred_cards_updated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === `${PREFIX}${deckId}`) {
        setStarredIds(getStarredCardIds(deckId));
      }
    });

    return () => {
      window.removeEventListener('starred_cards_updated', handleUpdate);
    };
  }, [deckId]);

  const toggleStar = useCallback(
    (cardId: number) => {
      return toggleCardStar(deckId, cardId);
    },
    [deckId]
  );

  const starAll = useCallback(
    (cardIds: number[]) => {
      starAllCards(deckId, cardIds);
    },
    [deckId]
  );

  const unstarAll = useCallback(() => {
    unstarAllCards(deckId);
  }, [deckId]);

  const isStarred = useCallback(
    (cardId: number) => {
      return starredIds.includes(cardId);
    },
    [starredIds]
  );

  return {
    starredIds,
    starredCount: starredIds.length,
    isStarred,
    toggleStar,
    starAll,
    unstarAll,
  };
}

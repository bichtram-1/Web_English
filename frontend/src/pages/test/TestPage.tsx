import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TestMode from './components/TestMode';
import deckApi, { getStoredDecks } from '../../api/deckApi';
import type { Deck } from '../../types/DeckType';
import { mockDecks } from '../../data/mockData';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute } from '../../constants/routers';

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const targetId = id || 'basic-comm';

  const [deck, setDeck] = useState<Deck>(() => {
    const directMock = mockDecks.find((d) => d.id === targetId);
    if (directMock) return directMock;
    const stored = getStoredDecks().find((d) => d.id === targetId);
    if (stored && stored.cards && stored.cards.length > 0) return stored;
    return mockDecks[0];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    deckApi.getDeckById(id)
      .then((data) => {
        if (data && data.cards && data.cards.length > 0) setDeck(data);
      })
      .catch((err) => {
        console.warn('API error in TestPage:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading && !deck) return <Loading />;

  return <TestMode deck={deck} onExit={() => navigate(getDeckDetailRoute(deck.id))} />;
}

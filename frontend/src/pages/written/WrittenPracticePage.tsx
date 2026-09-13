import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import WrittenPractice from './components/WrittenPractice';
import deckApi, { getStoredDecks } from '../../api/deckApi';
import type { Deck } from '../../types/DeckType';
import { mockDecks } from '../../data/mockData';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute } from '../../constants/routers';
import { useStarredCards } from '../../utils/starredCards';

export default function WrittenPracticePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetId = id || 'basic-comm';
  const isStarredFilter = searchParams.get('starred') === 'true';

  const { isStarred } = useStarredCards(targetId);

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
        console.warn('API error in WrittenPracticePage:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const activeDeck = useMemo(() => {
    if (!deck) return deck;
    if (!isStarredFilter) return deck;
    const starredCards = deck.cards.filter((c) => isStarred(c.id));
    if (starredCards.length === 0) return deck;
    return {
      ...deck,
      cards: starredCards,
      itemCount: starredCards.length,
    };
  }, [deck, isStarredFilter, isStarred]);

  if (loading && !activeDeck) return <Loading />;

  return <WrittenPractice deck={activeDeck} onExit={() => navigate(getDeckDetailRoute(deck.id))} />;
}

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import WrittenPractice, { type WrittenFilterMode } from './components/WrittenPractice';
import deckApi, { getStoredDecks } from '../../api/deckApi';
import type { Deck, FlashcardItem } from '../../types/DeckType';
import { mockDecks } from '../../data/mockData';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute } from '../../constants/routers';
import { useStarredCards } from '../../utils/starredCards';
import { getDeckDueCards } from '../../utils/sm2';

export default function WrittenPracticePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetId = id || 'basic-comm';

  const initialFilter: WrittenFilterMode = searchParams.get('starred') === 'true'
    ? 'starred'
    : searchParams.get('due') === 'true'
    ? 'due'
    : 'all';

  const [filterMode, setFilterMode] = useState<WrittenFilterMode>(initialFilter);
  const { isStarred, toggleStar, starredCount } = useStarredCards(targetId);

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

  const rawCards = useMemo(
    () => (deck ? deck.cards.filter((c): c is FlashcardItem => c.type === 'flashcard') : []),
    [deck]
  );
  const starredCards = useMemo(() => rawCards.filter((c) => isStarred(c.id)), [rawCards, isStarred]);
  const dueCards = useMemo(() => getDeckDueCards(targetId, rawCards), [targetId, rawCards]);

  const handleFilterChange = (mode: WrittenFilterMode) => {
    setFilterMode(mode);
    if (mode === 'starred') {
      setSearchParams({ starred: 'true' });
    } else if (mode === 'due') {
      setSearchParams({ due: 'true' });
    } else {
      setSearchParams({});
    }
  };

  const activeDeck = useMemo(() => {
    if (!deck) return deck;
    let filtered = rawCards;
    if (filterMode === 'starred') {
      filtered = starredCards.length > 0 ? starredCards : rawCards;
    } else if (filterMode === 'due') {
      filtered = dueCards.length > 0 ? dueCards : rawCards;
    }
    return {
      ...deck,
      cards: filtered,
      itemCount: filtered.length,
    };
  }, [deck, rawCards, filterMode, starredCards, dueCards]);

  if (loading && !activeDeck) return <Loading />;

  return (
    <WrittenPractice
      deck={activeDeck}
      onExit={() => navigate(getDeckDetailRoute(deck.id))}
      filterMode={filterMode}
      onFilterChange={handleFilterChange}
      totalCount={rawCards.length}
      dueCount={dueCards.length}
      starredCount={starredCount}
      isStarred={isStarred}
      onToggleStar={toggleStar}
    />
  );
}

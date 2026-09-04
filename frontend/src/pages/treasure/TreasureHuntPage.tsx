import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TreasureHuntGame from './components/TreasureHuntGame';
import deckApi from '../../api/deckApi';
import type { Deck, FlashcardItem } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute, ROUTES } from '../../constants/routers';

export default function TreasureHuntPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [allCards, setAllCards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (id && id !== 'all') {
      deckApi.getDeckById(id).then((data) => {
        setDeck(data || null);
        setLoading(false);
      });
    } else {
      // Global arcade mode: fetch all public decks and extract all cards
      deckApi.getAllDecks().then((decks) => {
        const pool: FlashcardItem[] = [];
        decks.forEach((d) => {
          d.cards.forEach((c) => {
            if (c.type === 'flashcard') {
              pool.push(c);
            }
          });
        });
        setAllCards(pool);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <Loading />;

  return (
    <TreasureHuntGame
      deck={deck || undefined}
      cardsPool={allCards.length > 0 ? allCards : undefined}
      title={deck ? deck.title : 'Kho Báu Tổng Hợp (Tất Cả Thẻ)'}
      onExit={() => navigate(deck ? getDeckDetailRoute(deck.id) : ROUTES.HOME)}
    />
  );
}

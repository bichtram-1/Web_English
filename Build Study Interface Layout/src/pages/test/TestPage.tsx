import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TestMode from './components/TestMode';
import deckApi from '../../api/deckApi';
import type { Deck } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute } from '../../constants/routers';

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    deckApi.getDeckById(id).then((data) => {
      setDeck(data || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loading />;

  if (!deck) {
    return (
      <div className="p-8 text-center text-white">
        <h2 className="text-xl font-bold">Không tìm thấy bộ thẻ</h2>
        <button
          onClick={() => navigate(id ? getDeckDetailRoute(id) : '/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return <TestMode deck={deck} onExit={() => navigate(getDeckDetailRoute(deck.id))} />;
}

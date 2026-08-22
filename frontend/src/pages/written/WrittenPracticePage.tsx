import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WrittenPractice from './components/WrittenPractice';
import deckApi from '../../api/deckApi';
import type { Deck } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute } from '../../constants/routers';

export default function WrittenPracticePage() {
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
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-700">Không tìm thấy bộ thẻ</h2>
        <button
          onClick={() => navigate(id ? getDeckDetailRoute(id) : '/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return <WrittenPractice deck={deck} onExit={() => navigate(getDeckDetailRoute(deck.id))} />;
}

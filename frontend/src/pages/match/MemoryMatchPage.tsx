import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MemoryMatchGame from './components/MemoryMatchGame';
import deckApi from '../../api/deckApi';
import type { Deck } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute } from '../../constants/routers';

export default function MemoryMatchPage() {
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
      <div className="p-8 text-center text-slate-700 dark:text-slate-200">
        <h2 className="text-xl font-bold">Không tìm thấy bộ thẻ</h2>
        <button
          onClick={() => navigate(id ? getDeckDetailRoute(id) : '/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return <MemoryMatchGame deck={deck} onExit={() => navigate(getDeckDetailRoute(deck.id))} />;
}

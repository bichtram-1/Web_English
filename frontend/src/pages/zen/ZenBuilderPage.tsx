import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ZenBuilder from './components/ZenBuilder';
import deckApi from '../../api/deckApi';
import type { Deck, FlashcardItem } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute, ROUTES } from '../../constants/routers';

export default function ZenBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (id && id !== 'all') {
      deckApi.getDeckById(id).then((data) => {
        setDeck(data || null);
        setLoading(false);
      });
    } else {
      // Global arcade mode: fetch all public decks and extract all flashcards
      deckApi.getAllDecks().then((decks) => {
        const pool: FlashcardItem[] = [];
        decks.forEach((d) => {
          d.cards.forEach((c) => {
            if (c.type === 'flashcard') {
              pool.push(c);
            }
          });
        });

        if (pool.length > 0) {
          const virtualDeck: Deck = {
            id: 'all',
            title: isVi ? 'Ốc Đảo Từ Vựng Toàn Cầu' : 'Global Zen Word Sanctuary',
            description: isVi
              ? 'Thế giới Zen học tập thư giãn tổng hợp từ toàn bộ kho từ vựng'
              : 'A tranquil Zen sanctuary aggregated from all vocabulary decks',
            cards: pool,
            creator: 'system',
            itemCount: pool.length,
            category: 'Arcade',
            color: 'emerald',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPublic: true,
          };
          setDeck(virtualDeck);
        } else {
          setDeck(null);
        }
        setLoading(false);
      });
    }
  }, [id, isVi]);

  if (loading) return <Loading />;

  if (!deck || deck.cards.length === 0) {
    return (
      <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <span className="text-4xl mb-3">🌿</span>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">{t('zen_deck_empty')}</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">{t('zen_deck_empty_desc')}</p>
        <button
          onClick={() => navigate(id && id !== 'all' ? getDeckDetailRoute(id) : ROUTES.GAMES)}
          className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-emerald-200 cursor-pointer"
        >
          {t('zen_back_to_arcade')}
        </button>
      </div>
    );
  }

  const handleExit = () => {
    if (id && id !== 'all') {
      navigate(getDeckDetailRoute(deck.id));
    } else {
      navigate(ROUTES.GAMES);
    }
  };

  return <ZenBuilder deck={deck} onExit={handleExit} />;
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Gamepad2,
  Leaf,
  PenLine,
  Users,
  Sparkles,
  ChevronRight,
  FolderPlus,
  Globe,
  Lock,
} from 'lucide-react';
import deckApi from '../../api/deckApi';
import { recordViewedDeck } from '../../utils/recentDecks';
import Loading from '../../components/shared/Loading';
import AddToCollectionModal from '../../components/shared/AddToCollectionModal';
import { getCategoryLabel } from '../home/HomePage';
import {
  ROUTES,
  getStudyRoute,
  getTestRoute,
  getMinigameRoute,
  getZenRoute,
  getWrittenRoute,
} from '../../constants/routers';

export default function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    deckApi.getDeckById(id).then((data) => {
      setDeck(data || null);
      if (data) {
        recordViewedDeck(data);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loading />;

  if (!deck) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">{t('not_found')}</h2>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm cursor-pointer"
        >
          {t('go_home')}
        </button>
      </div>
    );
  }

  const modes = [
    {
      mode: 'flashcard' as StudyMode,
      label: t('deck_flashcard_label'),
      sublabel: t('deck_flashcard_sublabel'),
      icon: <BookOpen size={24} />,
      gradient: 'from-indigo-500 to-violet-600',
      tag: 'Classic',
    },
    {
      mode: 'test' as StudyMode,
      label: t('deck_test_label'),
      sublabel: t('deck_test_sublabel'),
      icon: <ClipboardList size={24} />,
      gradient: 'from-rose-500 to-orange-500',
      tag: 'Quiz',
    },
    {
      mode: 'minigame' as StudyMode,
      label: t('deck_minigame_label'),
      sublabel: t('deck_minigame_sublabel'),
      icon: <Gamepad2 size={24} />,
      gradient: 'from-cyan-500 to-blue-600',
      tag: 'Action',
    },
    {
      mode: 'zen' as StudyMode,
      label: t('deck_zen_label'),
      sublabel: t('deck_zen_sublabel'),
      icon: <Leaf size={24} />,
      gradient: 'from-emerald-400 to-teal-600',
      tag: 'Zen',
    },
    {
      mode: 'written' as StudyMode,
      label: t('deck_written_label'),
      sublabel: t('deck_written_sublabel'),
      icon: <PenLine size={24} />,
      gradient: 'from-violet-500 to-purple-600',
      tag: 'Writing',
    },
  ];

  const flashcardCount = deck.cards.filter((c) => c.type === 'flashcard').length;
  const dragDropCount = deck.cards.filter((c) => c.type === 'drag_drop').length;

  const handleSelectMode = (mode: StudyMode) => {
    if (mode === 'flashcard') navigate(getStudyRoute(deck.id));
    else if (mode === 'test') navigate(getTestRoute(deck.id));
    else if (mode === 'minigame') navigate(getMinigameRoute(deck.id));
    else if (mode === 'zen') navigate(getZenRoute(deck.id));
    else if (mode === 'written') navigate(getWrittenRoute(deck.id));
  };

  const isPublic = deck.isPublic !== undefined ? deck.isPublic : true;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero banner */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${deck.color}`}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 pt-5 pb-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <ArrowLeft size={15} />
              {t('nav_all_decks')}
            </button>

            {/* Add to collection button */}
            <button
              onClick={() => setIsAddCollectionOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <FolderPlus size={14} />
              <span>{t('collection_add_to_collection')}</span>
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1
                  className="text-white text-3xl md:text-4xl font-black mb-2 leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {deck.title}
                </h1>
                <div className="flex items-center gap-3 text-white/90 text-sm font-medium flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {t('deck_creator_label')}: <strong className="text-white">{deck.creator}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} />
                    {t('cards_count', { count: deck.itemCount })}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-bold text-white">
                    {getCategoryLabel(deck.category, t)}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    {isPublic ? <Globe size={11} /> : <Lock size={11} />}
                    {isPublic ? t('deck_public_badge') : t('deck_private_badge')}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex gap-3 mt-5 flex-wrap">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {flashcardCount}
                </div>
                <div className="text-white/80 text-xs font-semibold">Flashcards</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {dragDropCount}
                </div>
                <div className="text-white/80 text-xs font-semibold">Drag & Drop</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {modes.length}
                </div>
                <div className="text-white/80 text-xs font-semibold">{t('deck_detail_modes_count')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mode cards */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2
              className="text-slate-900 dark:text-white text-base sm:text-lg font-black tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('deck_choose_mode')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Chọn phương pháp học tương tác phù hợp với mục tiêu của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map((item, index) => (
            <motion.div
              key={item.mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              onClick={() => handleSelectMode(item.mode)}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform shrink-0`}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-black text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.label}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 font-semibold leading-snug">
                    {item.sublabel}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0 ml-2"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        deck={deck}
        isOpen={isAddCollectionOpen}
        onClose={() => setIsAddCollectionOpen(false)}
      />
    </div>
  );
}

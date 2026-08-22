import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import deckApi from '../../api/deckApi';
import type { Deck, StudyMode } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';
import {
  ROUTES,
  getStudyRoute,
  getTestRoute,
  getMinigameRoute,
  getZenRoute,
  getWrittenRoute,
} from '../../constants/routers';

interface ModeCard {
  mode: StudyMode;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  gradient: string;
  tag: string;
}

const modes: ModeCard[] = [
  {
    mode: 'flashcard',
    label: 'Flashcard + Drag & Drop',
    sublabel: 'Classic flip cards & grammar construction',
    icon: <BookOpen size={24} />,
    gradient: 'from-indigo-500 to-violet-600',
    tag: 'Classic',
  },
  {
    mode: 'test',
    label: 'Test Mode',
    sublabel: 'Multiple choice, True/False & written answers',
    icon: <ClipboardList size={24} />,
    gradient: 'from-rose-500 to-orange-500',
    tag: 'Kiểm tra',
  },
  {
    mode: 'minigame',
    label: 'Typing Shooter',
    sublabel: 'Shoot falling targets by typing the answer',
    icon: <Gamepad2 size={24} />,
    gradient: 'from-cyan-500 to-blue-600',
    tag: 'Minigame',
  },
  {
    mode: 'zen',
    label: 'Zen World Builder',
    sublabel: 'Study calmly & grow your peaceful world',
    icon: <Leaf size={24} />,
    gradient: 'from-emerald-400 to-teal-600',
    tag: 'Zen',
  },
  {
    mode: 'written',
    label: 'Written Practice',
    sublabel: 'Type answers in EN→VI or VI→EN with instant feedback',
    icon: <PenLine size={24} />,
    gradient: 'from-violet-500 to-purple-600',
    tag: 'Writing',
  },
];

export default function DeckDetailPage() {
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
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const flashcardCount = deck.cards.filter((c) => c.type === 'flashcard').length;
  const dragDropCount = deck.cards.filter((c) => c.type === 'drag_drop').length;

  const handleSelectMode = (mode: StudyMode) => {
    if (mode === 'flashcard') navigate(getStudyRoute(deck.id));
    else if (mode === 'test') navigate(getTestRoute(deck.id));
    else if (mode === 'minigame') navigate(getMinigameRoute(deck.id));
    else if (mode === 'zen') navigate(getZenRoute(deck.id));
    else if (mode === 'written') navigate(getWrittenRoute(deck.id));
  };

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
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold mb-6 transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={15} />
            All Decks
          </button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1
                  className="text-white text-3xl md:text-4xl font-black mb-2 leading-tight"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                >
                  {deck.title}
                </h1>
                <div className="flex items-center gap-3 text-white/70 text-sm font-medium flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {deck.creator}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} />
                    {deck.itemCount} cards
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-bold text-white">
                    {deck.category}
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
                <div className="text-white/70 text-xs font-semibold">Flashcards</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {dragDropCount}
                </div>
                <div className="text-white/70 text-xs font-semibold">Drag & Drop</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  5
                </div>
                <div className="text-white/70 text-xs font-semibold">Study Modes</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mode cards */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2
          className="text-lg font-black text-slate-900 mb-5"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Choose a study mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map((m, i) => (
            <motion.button
              key={m.mode}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => handleSelectMode(m.mode)}
              className="group text-left bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`h-3 bg-gradient-to-r ${m.gradient}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white shadow-md`}
                  >
                    {m.icon}
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {m.tag}
                  </span>
                </div>
                <h3
                  className="font-black text-slate-900 text-base mb-1 group-hover:text-indigo-700 transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {m.label}
                </h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">{m.sublabel}</p>
                <div
                  className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Start <ChevronRight size={13} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

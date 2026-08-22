import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Zap, Trophy, Sparkles } from 'lucide-react';
import FlashCard from '../../components/shared/FlashCard';
import DragDropCard from '../../components/shared/DragDropCard';
import deckApi from '../../api/deckApi';
import studyApi from '../../api/studyApi';
import type { Deck } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute } from '../../constants/routers';

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Zap size={15} className="text-amber-400" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function StudyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionProgress, setSessionProgress] = useState<{ cardId: number; completed: boolean }[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [direction, setDirection] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    deckApi.getDeckById(id).then((data) => {
      setDeck(data || null);
      setLoading(false);
      startTimeRef.current = Date.now();
    });
  }, [id]);

  if (loading) return <Loading />;

  if (!deck || deck.cards.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-700">Bộ thẻ trống hoặc không tồn tại</h2>
        <button
          onClick={() => navigate(id ? getDeckDetailRoute(id) : '/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const cards = deck.cards;

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const markProgress = (cardId: number) => {
    setSessionProgress((prev) => {
      if (prev.find((p) => p.cardId === cardId)) return prev;
      const next = [...prev, { cardId, completed: true }];
      if (next.length % 5 === 0) {
        showToast('Đã lưu tiến độ học tập...');
      }
      return next;
    });
  };

  const handleFinish = async () => {
    setIsFinished(true);
    const durationSeconds = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    try {
      await studyApi.submitSession({
        deckId: deck.id,
        mode: 'flashcard',
        cardsStudied: cards.length,
        correctCount: sessionProgress.length || cards.length,
        timeSpentSeconds: durationSeconds,
      });
      showToast('🎉 Đã ghi nhận thành tích vào hồ sơ!');
    } catch (e) {
      console.error('Error submitting study session:', e);
    }
  };

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      handleFinish();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const progress = ((currentIndex + 1) / cards.length) * 100;
  const card = cards[currentIndex];

  const handleExit = () => {
    navigate(getDeckDetailRoute(deck.id));
  };

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Hoàn thành xuất sắc!
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Bạn đã ôn tập xong toàn bộ {cards.length} thẻ của bộ "<strong>{deck.title}</strong>".
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex justify-around text-center">
            <div>
              <div className="text-xl font-black text-indigo-600">{cards.length}</div>
              <div className="text-xs text-slate-400 font-semibold">Thẻ đã học</div>
            </div>
            <div>
              <div className="text-xl font-black text-amber-500">+{cards.length * 10}</div>
              <div className="text-xs text-slate-400 font-semibold">XP Nhận được</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFinished(false);
                setSessionProgress([]);
                startTimeRef.current = Date.now();
              }}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
            >
              Học lại
            </button>
            <button
              onClick={handleExit}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
            >
              Xem chi tiết bộ thẻ
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <X size={16} />
            Thoát
          </button>

          {/* Progress bar */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          <span
            className="text-sm font-bold text-slate-600 whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </header>

      {/* Deck info strip */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-5 pb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold text-indigo-500 uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {deck.title}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-400 font-medium">
            {card.type === 'flashcard' ? 'Flashcard' : 'Grammar Exercise'}
          </span>
        </div>
      </div>

      {/* Card area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="w-full flex flex-col items-center"
          >
            {card.type === 'flashcard' ? (
              <FlashCard card={card} onFlipped={() => markProgress(card.id)} />
            ) : (
              <DragDropCard card={card} onCorrect={() => markProgress(card.id)} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <footer className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              disabled:opacity-30 disabled:cursor-not-allowed
              bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={16} />
            Trước
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {cards.map((_, i) => {
              const isCompleted = sessionProgress.some((p) => p.cardId === cards[i].id);
              return (
                <button
                  key={i}
                  onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentIndex
                      ? 'w-5 h-2.5 bg-indigo-600'
                      : isCompleted
                      ? 'w-2.5 h-2.5 bg-emerald-400'
                      : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-95"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {currentIndex === cards.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
            <ArrowRight size={16} />
          </button>
        </div>
      </footer>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

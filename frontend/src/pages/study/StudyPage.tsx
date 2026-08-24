import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Zap, Trophy, Sparkles } from 'lucide-react';
import FlashCard, { type FlashCardRef } from '../../components/shared/FlashCard';
import DragDropCard, { type DragDropCardRef } from '../../components/shared/DragDropCard';
import ThemeToggle from '../../components/general/ThemeToggle';
import LanguageSelect from '../../components/general/LanguageSelect';
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
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-2xl text-sm font-semibold border border-slate-800 dark:border-slate-700"
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
  const { t } = useTranslation();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionProgress, setSessionProgress] = useState<{ cardId: number; completed: boolean }[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [direction, setDirection] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashCardRef = useRef<FlashCardRef>(null);
  const dragDropRef = useRef<DragDropCardRef>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    deckApi.getDeckById(id).then((data) => {
      setDeck(data || null);
      setLoading(false);
      startTimeRef.current = Date.now();
    });
  }, [id]);

  const cards = deck?.cards || [];

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }, []);

  const markProgress = useCallback((cardId: number) => {
    setSessionProgress((prev) => {
      if (prev.find((p) => p.cardId === cardId)) return prev;
      const next = [...prev, { cardId, completed: true }];
      if (next.length % 5 === 0) {
        showToast(t('study_saved_progress'));
      }
      return next;
    });
  }, [showToast, t]);

  const handleFinish = useCallback(async () => {
    if (!deck) return;
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
      showToast(t('study_achievement_saved'));
    } catch (e) {
      console.error('Error submitting study session:', e);
    }
  }, [deck, cards.length, sessionProgress.length, showToast, t]);

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      handleFinish();
    }
  }, [currentIndex, cards.length, handleFinish]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const card = cards[currentIndex];

  // Global keyboard shortcuts
  useEffect(() => {
    if (isFinished || !card) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (card.type === 'flashcard') {
          // ArrowDown: Flip from front to back or toggle
          if (!flashCardRef.current?.isFlipped()) {
            flashCardRef.current?.flipTo(true);
          } else {
            flashCardRef.current?.flipTo(false);
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (card.type === 'flashcard') {
          // ArrowUp: Flip from back to front or toggle
          if (flashCardRef.current?.isFlipped()) {
            flashCardRef.current?.flipTo(false);
          } else {
            flashCardRef.current?.flipTo(true);
          }
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (card.type === 'flashcard') {
          flashCardRef.current?.speak();
        } else if (card.type === 'drag_drop') {
          dragDropRef.current?.speak();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFinished, card, goNext, goPrev]);

  if (loading) return <Loading />;

  if (!deck || cards.length === 0) {
    return (
      <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">{t('not_found')}</h2>
        <button
          onClick={() => navigate(id ? getDeckDetailRoute(id) : '/')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm cursor-pointer"
        >
          {t('back')}
        </button>
      </div>
    );
  }

  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleExit = () => {
    navigate(getDeckDetailRoute(deck.id));
  };

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-2xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {t('study_completed_title')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {t('study_completed_desc', { count: cards.length, deckTitle: deck.title })}
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 mb-6 flex justify-around text-center border border-slate-100 dark:border-slate-700/60">
            <div>
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{cards.length}</div>
              <div className="text-xs text-slate-400 dark:text-slate-400 font-semibold">{t('study_cards_studied')}</div>
            </div>
            <div>
              <div className="text-xl font-black text-amber-500">+{cards.length * 10}</div>
              <div className="text-xs text-slate-400 dark:text-slate-400 font-semibold">{t('study_xp_earned')}</div>
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
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {t('study_btn_restart')}
            </button>
            <button
              onClick={handleExit}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer"
            >
              {t('study_btn_view_deck')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <X size={16} />
            <span className="hidden sm:inline">{t('exit')}</span>
          </button>

          {/* Progress bar */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          <span
            className="text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {currentIndex + 1} / {cards.length}
          </span>

          {/* Language & Theme toggles in study mode */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <LanguageSelect mini />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Deck info strip */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-5 pb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {deck.title}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {card.type === 'flashcard' ? t('study_card_flashcard') : t('study_card_grammar')}
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
              <FlashCard
                ref={flashCardRef}
                card={card}
                onFlipped={() => markProgress(card.id)}
              />
            ) : (
              <DragDropCard
                ref={dragDropRef}
                card={card}
                onCorrect={() => markProgress(card.id)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Keyboard shortcuts helper pills (Hidden on small mobile screens) */}
        <div className="mt-6 hidden sm:flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-slate-500 dark:text-slate-400 text-xs font-semibold select-none">
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 px-2.5 py-1.5 rounded-xl shadow-xs">
            <div className="flex items-center gap-0.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-2xs">↓</kbd>
            </div>
            <span className="text-slate-600 dark:text-slate-300">{t('shortcut_flip')}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 px-2.5 py-1.5 rounded-xl shadow-xs">
            <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-2xs">Space</kbd>
            <span className="text-slate-600 dark:text-slate-300">{t('shortcut_audio')}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 px-2.5 py-1.5 rounded-xl shadow-xs">
            <div className="flex items-center gap-0.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-2xs">←</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-2xs">→</kbd>
            </div>
            <span className="text-slate-600 dark:text-slate-300">{t('shortcut_nav')}</span>
          </div>
        </div>
      </main>

      {/* Navigation */}
      <footer className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              disabled:opacity-30 disabled:cursor-not-allowed
              bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={16} />
            {t('study_btn_prev')}
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {cards.map((_, i) => {
              const isCompleted = sessionProgress.some((p) => p.cardId === cards[i].id);
              return (
                <button
                  key={i}
                  onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
                  className={`rounded-full transition-all duration-200 cursor-pointer ${
                    i === currentIndex
                      ? 'w-5 h-2.5 bg-indigo-600'
                      : isCompleted
                      ? 'w-2.5 h-2.5 bg-emerald-400'
                      : 'w-2.5 h-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                />
              );
            })}
          </div>

          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none active:scale-95 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {currentIndex === cards.length - 1 ? t('study_btn_finish') : t('study_btn_next')}
            <ArrowRight size={16} />
          </button>
        </div>
      </footer>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

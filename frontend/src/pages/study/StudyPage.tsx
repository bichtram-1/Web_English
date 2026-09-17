import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Zap, Trophy, Brain, Lock, Star, Image as ImageIcon, Keyboard } from 'lucide-react';
import FlashCard, { type FlashCardRef } from '../../components/shared/FlashCard';
import DragDropCard, { type DragDropCardRef } from '../../components/shared/DragDropCard';
import ThemeToggle from '../../components/general/ThemeToggle';
import LanguageSelect from '../../components/general/LanguageSelect';
import WallpaperModal from '../../components/general/WallpaperModal';
import { useWallpaper } from '../../contexts/WallpaperContext';
import deckApi, { getStoredDecks } from '../../api/deckApi';
import studyApi from '../../api/studyApi';
import type { Deck } from '../../types/DeckType';
import { mockDecks } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import { canViewDeck } from '../../utils/permission';
import Loading from '../../components/shared/Loading';
import { getDeckDetailRoute, getCollectionDetailRoute, ROUTES } from '../../constants/routers';
import { useStarredCards } from '../../utils/starredCards';
import {
  getCardSM2Record,
  calculateSM2,
  saveSM2Record,
  getSM2RatingOptions,
  getDeckDueCards,
  type SM2Rating,
  type SM2Record,
} from '../../utils/sm2';
import { playMatchSound, playMismatchSound } from '../../utils/soundEffects';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { config: wallpaperConfig, setIsModalOpen: setWallpaperModalOpen } = useWallpaper();

  const targetId = id || 'basic-comm';

  const [deck, setDeck] = useState<Deck | null>(() => {
    const directMock = mockDecks.find((d) => d.id === targetId);
    if (directMock) return directMock;
    const stored = getStoredDecks().find((d) => d.id === targetId);
    if (stored && stored.cards && stored.cards.length > 0) return stored;
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const directMock = mockDecks.find((d) => d.id === targetId);
    if (directMock) return false;
    const stored = getStoredDecks().find((d) => d.id === targetId);
    if (stored && stored.cards && stored.cards.length > 0) return false;
    return Boolean(id);
  });

  type StudyFilterMode = 'all' | 'due' | 'starred';
  const initialFilterMode: StudyFilterMode = searchParams.get('starred') === 'true'
    ? 'starred'
    : searchParams.get('due') === 'true'
    ? 'due'
    : 'all';
  const [filterMode, setFilterMode] = useState<StudyFilterMode>(initialFilterMode);
  const [extraReviewCards, setExtraReviewCards] = useState<CardItem[]>([]);

  const { starredIds, starredCount, isStarred, toggleStar } = useStarredCards(targetId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionProgress, setSessionProgress] = useState<{ cardId: number; completed: boolean }[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [direction, setDirection] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [sm2Enabled, setSm2Enabled] = useState(true);
  const [currentSM2Record, setCurrentSM2Record] = useState<SM2Record | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const flashCardRef = useRef<FlashCardRef>(null);
  const dragDropRef = useRef<DragDropCardRef>(null);
  const startTimeRef = useRef<number>(Date.now());
  const toastTimerRef = useRef<any>(null);

  const currentDeck = useMemo(() => {
    if (deck && deck.cards && deck.cards.length > 0) return deck;
    const mock = mockDecks.find((d) => d.id === targetId);
    if (mock) return mock;
    const stored = getStoredDecks().find((d) => d.id === targetId);
    if (stored && stored.cards && stored.cards.length > 0) return stored;
    return null;
  }, [deck, targetId]);

  const rawCards = currentDeck?.cards || [];
  const starredCards = useMemo(
    () => rawCards.filter((c) => isStarred(c.id)),
    [rawCards, isStarred]
  );
  const dueCards = useMemo(
    () => (currentDeck ? getDeckDueCards(currentDeck.id, rawCards) : rawCards),
    [currentDeck, rawCards]
  );

  const baseCards = useMemo(() => {
    if (filterMode === 'starred') {
      return starredCards.length > 0 ? starredCards : rawCards;
    }
    if (filterMode === 'due') {
      return dueCards.length > 0 ? dueCards : rawCards;
    }
    return rawCards;
  }, [filterMode, starredCards, dueCards, rawCards]);

  const cards = useMemo(() => {
    return [...baseCards, ...extraReviewCards];
  }, [baseCards, extraReviewCards]);

  const card = cards[currentIndex] || cards[0];

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    deckApi.getDeckById(id)
      .then((data) => {
        if (data && data.cards && data.cards.length > 0) {
          setDeck(data);
        } else {
          setDeck(null);
        }
      })
      .catch((err) => {
        console.warn('API error loading deck:', err);
        setDeck(null);
      })
      .finally(() => {
        setLoading(false);
        startTimeRef.current = Date.now();
      });
  }, [id]);

  // Refresh SM2 record when current card changes
  useEffect(() => {
    if (currentDeck && card) {
      const rec = getCardSM2Record(card.id, currentDeck.id);
      setCurrentSM2Record(rec);
      setIsCardFlipped(false);
    }
  }, [currentDeck, card]);

  const activeSM2Record = useMemo(() => {
    if (currentSM2Record) return currentSM2Record;
    if (currentDeck && card) return getCardSM2Record(card.id, currentDeck.id);
    return null;
  }, [currentSM2Record, currentDeck, card]);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }, []);

  const markProgress = useCallback((cardId: number) => {
    setIsCardFlipped(true);
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
    if (!currentDeck) return;
    setIsFinished(true);
    const durationSeconds = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    try {
      await studyApi.submitSession({
        deckId: currentDeck.id,
        mode: 'flashcard',
        cardsStudied: cards.length,
        correctCount: sessionProgress.length || cards.length,
        timeSpentSeconds: durationSeconds,
      });
      showToast(t('study_achievement_saved'));
    } catch (e) {
      console.error('Error submitting study session:', e);
    }
  }, [currentDeck, cards.length, sessionProgress.length, showToast, t]);

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

  // Handle SM-2 Quality Rating
  const handleRateSM2 = useCallback(
    (rating: SM2Rating) => {
      const record = currentSM2Record || (card && currentDeck ? getCardSM2Record(card.id, currentDeck.id) : null);
      if (!currentDeck || !card || !record) return;

      const updated = calculateSM2(record, rating);
      saveSM2Record(updated);
      setCurrentSM2Record(updated);
      markProgress(card.id);

      if (rating >= 3) {
        playMatchSound();
      } else {
        playMismatchSound();
      }

      if (rating === 1) {
        // Re-queue card to be reviewed again at the end of current session (< 10 mins)
        setExtraReviewCards((prev) => [...prev, card]);
      }

      const days = updated.interval;
      const intervalMsg =
        rating === 1
          ? isVi
            ? 'Đã ghi nhận: Thẻ sẽ quay lại ở cuối buổi học (< 10 phút)'
            : 'Marked: Card will reappear at end of session (< 10 mins)'
          : rating === 2
          ? isVi
            ? 'Đã ghi nhận: Khó nhớ (ôn lại vào ngày mai)'
            : 'Marked: Hard recall (review tomorrow)'
          : days <= 1
          ? isVi
            ? 'Đã nhớ tốt · Ôn lại vào ngày mai'
            : 'Good recall · Next review tomorrow'
          : isVi
          ? `Lên lịch ôn tập sau ${days} ngày`
          : `Scheduled review in ${days} days`;
      showToast(intervalMsg);

      setTimeout(() => {
        goNext();
      }, 350);
    },
    [currentDeck, card, currentSM2Record, markProgress, showToast, goNext, isVi]
  );

  const handleSelectFilterMode = useCallback(
    (mode: StudyFilterMode) => {
      if (mode === 'starred' && starredCards.length === 0) {
        showToast(isVi ? 'Chưa có thuật ngữ nào được gắn sao ⭐' : 'No terms have been starred yet ⭐');
        return;
      }
      if (mode === 'due' && dueCards.length === 0) {
        showToast(isVi ? 'Không có từ nào cần ôn hôm nay 🎉 Tất cả đều đúng hạn!' : 'No cards due today 🎉 All caught up!');
        return;
      }
      setFilterMode(mode);
      setExtraReviewCards([]);
      setCurrentIndex(0);
      setIsFinished(false);
      if (mode === 'starred') {
        setSearchParams({ starred: 'true' });
        showToast(isVi ? `Đang học ${starredCards.length} thuật ngữ có gắn sao ⭐` : `Studying ${starredCards.length} starred terms ⭐`);
      } else if (mode === 'due') {
        setSearchParams({ due: 'true' });
        showToast(isVi ? `Đang ôn ${dueCards.length} thuật ngữ cần ôn hôm nay 🧠` : `Reviewing ${dueCards.length} terms due today 🧠`);
      } else {
        setSearchParams({});
        showToast(isVi ? `Đang học tất cả ${rawCards.length} thuật ngữ` : `Studying all ${rawCards.length} terms`);
      }
    },
    [starredCards.length, dueCards.length, rawCards.length, isVi, setSearchParams, showToast]
  );

  // Global keyboard shortcuts (including 1, 2, 3, 4 for SM-2 ratings, and S for Star)
  useEffect(() => {
    if (isFinished || !card) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      if (showShortcutsModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowShortcutsModal(false);
        }
        return;
      }

      // Toggle star shortcut
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const newState = toggleStar(card.id);
        showToast(
          newState
            ? (isVi ? 'Đã gán sao ⭐' : 'Starred ⭐')
            : (isVi ? 'Đã bỏ gán sao' : 'Unstarred')
        );
        return;
      }

      // SM-2 shortcuts (1, 2, 3, 4) - enabled from both front and back
      if (sm2Enabled) {
        if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          handleRateSM2(1);
          return;
        } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          handleRateSM2(2);
          return;
        } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          handleRateSM2(3);
          return;
        } else if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
          e.preventDefault();
          handleRateSM2(5);
          return;
        }
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
          flashCardRef.current?.flip('down');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (card.type === 'flashcard') {
          flashCardRef.current?.flip('up');
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (card.type === 'flashcard') {
          flashCardRef.current?.flip('down');
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
  }, [currentIndex, isFinished, card, goNext, goPrev, sm2Enabled, handleRateSM2, toggleStar, isVi, showToast]);

  if (loading && (!currentDeck || cards.length === 0)) return <Loading />;

  if (currentDeck && !canViewDeck(currentDeck, user)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {isVi ? 'Bộ Thẻ Riêng Tư' : 'Private Deck'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {isVi
              ? 'Bộ thẻ này được thiết lập ở chế độ Riêng tư (Private). Bạn không có quyền xem và học bộ thẻ này.'
              : 'This deck is private. You do not have permission to view or study it.'}
          </p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            {isVi ? 'Về Trang Chủ' : 'Go Home'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentDeck || cards.length === 0) {
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

  if (!card) {
    return <Loading />;
  }

  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleExit = () => {
    if (currentDeck.id.startsWith('col-')) {
      navigate(getCollectionDetailRoute(currentDeck.id));
    } else {
      navigate(getDeckDetailRoute(currentDeck.id));
    }
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
            {t('study_completed_desc', { count: cards.length, deckTitle: currentDeck.title })}
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
    <div
      className={`min-h-screen flex flex-col relative overflow-x-clip text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
        wallpaperConfig.enabled && wallpaperConfig.url ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-950'
      }`}
    >
      {/* Dynamic Background Wallpaper Container (GPU accelerated) */}
      {wallpaperConfig.enabled && wallpaperConfig.url && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-all duration-500 ease-out"
          style={{
            backgroundImage: `url(${wallpaperConfig.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: `blur(${wallpaperConfig.blur}px) brightness(${wallpaperConfig.brightness})`,
            transform: 'translate3d(0, 0, 0) scale(1.08)',
            willChange: 'filter, opacity, transform',
            backfaceVisibility: 'hidden',
          }}
        />
      )}

      {/* Dynamic Dark / Tint Overlay */}
      {wallpaperConfig.enabled && wallpaperConfig.url && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-colors duration-300"
          style={{
            backgroundColor: `rgba(11, 15, 25, ${wallpaperConfig.overlayOpacity})`,
            transform: 'translate3d(0, 0, 0)',
            willChange: 'background-color',
          }}
        />
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
          <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
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

            {/* Filter Pill Selector: All / Due (SRS) / Starred */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold shrink-0">
              <button
                onClick={() => handleSelectFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={isVi ? 'Học tất cả thẻ' : 'Study all cards'}
              >
                {isVi ? 'Tất cả' : 'All'} ({rawCards.length})
              </button>
              <button
                onClick={() => handleSelectFilterMode('due')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'due'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
                title={isVi ? 'Chỉ ôn các từ đến hạn hôm nay theo phương pháp lặp lại ngắt quãng (SRS)' : 'Study cards due today (SRS)'}
              >
                <Brain size={12} className={filterMode === 'due' ? 'text-indigo-200' : 'text-indigo-500'} />
                <span>{isVi ? 'Cần ôn' : 'Due'} ({dueCards.length})</span>
              </button>
              <button
                onClick={() => handleSelectFilterMode('starred')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'starred'
                    ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-amber-500'
                }`}
                title={isVi ? 'Chỉ ôn các từ đã đánh dấu sao' : 'Study only starred cards'}
              >
                <Star size={12} className={filterMode === 'starred' || starredCount > 0 ? 'fill-amber-500 text-amber-500' : ''} />
                <span>{starredCount}</span>
              </button>
            </div>

            {/* Wallpaper, Language & Theme toggles in study mode */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setWallpaperModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isVi ? 'Đổi hình nền không gian học' : 'Customize study wallpaper'}
                aria-label="Customize wallpaper"
              >
                <ImageIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(true)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isVi ? 'Bảng phím tắt (?)' : 'Keyboard shortcuts (?)'}
                aria-label="Keyboard shortcuts"
              >
                <Keyboard size={16} />
              </button>
              <LanguageSelect mini />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Deck info strip */}
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-1 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-2xs">
            <span
              className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {currentDeck.title}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {card.type === 'flashcard' ? t('study_card_flashcard') : t('study_card_grammar')}
            </span>
          </div>

        {starredOnly && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold shadow-2xs">
            <Star size={13} className="fill-amber-400 text-amber-500" />
            <span>{isVi ? `Chế độ học: ${starredCards.length} từ có gắn sao` : `Starred mode: ${starredCards.length} terms`}</span>
          </div>
        )}
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
              <div className="w-full flex flex-col items-center">
                <FlashCard
                  ref={flashCardRef}
                  card={card}
                  isStarred={isStarred(card.id)}
                  onToggleStar={() => {
                    const newState = toggleStar(card.id);
                    showToast(
                      newState
                        ? (isVi ? 'Đã gán sao ⭐' : 'Starred ⭐')
                        : (isVi ? 'Đã bỏ gán sao' : 'Unstarred')
                    );
                  }}
                  onFlipped={(flipped) => {
                    setIsCardFlipped(flipped);
                    if (flipped) {
                      markProgress(card.id);
                    }
                  }}
                />

                {/* SM-2 Spaced Repetition Rating Panel */}
                <div className="mt-5 w-full max-w-lg md:max-w-2xl lg:max-w-3xl">
                  <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Brain size={14} className="text-indigo-500" />
                      {isVi ? 'Đánh giá mức độ nhớ' : 'Memory Recall Rating'}
                    </span>
                    {activeSM2Record && activeSM2Record.interval > 0 && (
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                        {isVi ? `Lần ${activeSM2Record.repetition} · ${activeSM2Record.interval} ngày` : `Rep ${activeSM2Record.repetition} · ${activeSM2Record.interval}d`}
                      </span>
                    )}
                  </div>

                  {/* 4 SM-2 Decision Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {getSM2RatingOptions(activeSM2Record || (card && currentDeck ? getCardSM2Record(card.id, currentDeck.id) : ({} as any))).map((opt, idx) => (
                      <button
                        key={opt.rating}
                        onClick={() => handleRateSM2(opt.rating)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-br ${opt.colorClass} shadow-md active:scale-95 transition-all cursor-pointer group`}
                      >
                        <div className="flex items-center gap-1">
                          <kbd className="px-1 py-0.2 rounded bg-black/20 text-[10px] font-mono text-white/90">
                            {idx + 1}
                          </kbd>
                          <span className="text-xs font-extrabold">{isVi ? opt.labelVi.replace(/\s*\(.*?\)/, '') : opt.labelEn}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-white/80 mt-0.5">
                          {isVi ? opt.intervalLabelVi : opt.intervalLabelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <DragDropCard
                ref={dragDropRef}
                card={card}
                onCorrect={() => markProgress(card.id)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Keyboard shortcut quick trigger */}
        <div className="mt-4 hidden sm:flex items-center justify-center">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold shadow-xs transition-all cursor-pointer hover:border-indigo-300"
          >
            <Keyboard size={13} />
            <span>{isVi ? 'Phím tắt học tập' : 'Keyboard shortcuts'}</span>
            <kbd className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono border border-slate-300 dark:border-slate-700">?</kbd>
          </button>
        </div>
      </main>

      {/* Navigation */}
      <footer className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
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
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1 max-w-[280px]">
            {cards.map((_, i) => {
              const isCompleted = sessionProgress.some((p) => p.cardId === cards[i]?.id);
              return (
                <button
                  key={i}
                  onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
                  className={`rounded-full transition-all duration-200 cursor-pointer shrink-0 ${
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

          <span className="sm:hidden text-xs font-bold text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {cards.length}
          </span>

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
      <WallpaperModal />

      {/* Study Shortcuts Cheat Sheet Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <Keyboard size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{isVi ? 'Phím tắt Flashcard' : 'Flashcard Shortcuts'}</h3>
                    <p className="text-xs text-slate-400">{isVi ? 'Tăng tốc độ ôn luyện cùng bàn phím' : 'Speed up review with keyboard'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">{isVi ? 'Lật thẻ mặt trước / sau' : 'Flip card front/back'}</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs shadow-2xs">↑</kbd>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs shadow-2xs">↓</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">{isVi ? 'Thẻ trước / Thẻ tiếp theo' : 'Previous / Next card'}</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs shadow-2xs">←</kbd>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs shadow-2xs">→</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">{isVi ? 'Phát âm thanh từ vựng' : 'Play audio pronunciation'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs shadow-2xs">Space</kbd>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">{isVi ? 'Đánh dấu sao ⭐' : 'Toggle starred ⭐'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs shadow-2xs">S</kbd>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">{isVi ? 'Đánh giá mức độ nhớ (1: Quên, 2: Khó, 3: Nhớ, 4: Dễ)' : 'Recall rating (1: Again, 2: Hard, 3: Good, 4: Easy)'}</span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <kbd className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 shadow-2xs">1</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-2xs">2</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs">3</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-2xs">4</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-slate-600 dark:text-slate-400">{isVi ? 'Mở / Đóng bảng phím tắt này' : 'Open / close this cheat sheet'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs shadow-2xs">?</kbd>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
                >
                  {isVi ? 'Đã hiểu' : 'Got it'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}

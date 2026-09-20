import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, ArrowRight, RotateCcw, PenLine, SkipForward, Image as ImageIcon, Keyboard, Star, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { playCorrectSound, playIncorrectSound } from '../../../utils/soundEffects';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';
import WallpaperModal from '../../../components/general/WallpaperModal';
import { useWallpaper } from '../../../contexts/WallpaperContext';
import LanguageSelect from '../../../components/general/LanguageSelect';
import ThemeToggle from '../../../components/general/ThemeToggle';
import { isAnswerMatching, stripParentheses } from '../../../utils/answerMatch';
import { useDoubleEscExit } from '../../../hooks/useDoubleEscExit';

const FALLBACK_WORDS = [
  { id: 1, en: 'Developer', vi: 'lập trình viên' },
  { id: 2, en: 'Database', vi: 'cơ sở dữ liệu' },
  { id: 3, en: 'Framework', vi: 'bộ khung' },
];

type Direction = 'en-to-vi' | 'vi-to-en';
type Status = 'idle' | 'correct' | 'incorrect' | 'force-retype';

function ModeToggle({ value, onChange }: { value: Direction; onChange: (d: Direction) => void }) {
  return (
    <div className="relative flex bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-1 gap-1 border border-slate-200/60 dark:border-slate-700/60">
      {(
        [
          { id: 'en-to-vi', label: 'EN → VI' },
          { id: 'vi-to-en', label: 'VI → EN' },
        ] as { id: Direction; label: string }[]
      ).map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`relative z-10 flex-1 px-4 py-2 rounded-xl text-xs font-black transition-colors duration-200 cursor-pointer ${
            value === opt.id ? 'text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {value === opt.id && (
            <motion.span
              layoutId="mode-pill"
              className="absolute inset-0 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/30"
              style={{ zIndex: -1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ProgressDots({
  total,
  current,
  results,
  answeredCount,
  isVi = true,
}: {
  total: number;
  current: number;
  results: (boolean | null)[];
  answeredCount?: number;
  isVi?: boolean;
}) {
  const correctCount = results.filter((r) => r === true).length;
  const incorrectCount = results.filter((r) => r === false).length;
  const safeCurrent = Math.min(Math.max(current, 0), Math.max(0, total - 1));
  const progressPct = total > 0 ? Math.min(100, Math.round(((answeredCount ?? safeCurrent) / total) * 100)) : 0;

  // For small decks (<= 12), show all dots in one neat row.
  // For large decks (e.g. 1500 words), show a sliding window of max 9 dots.
  const MAX_VISIBLE = 9;
  const isWindowed = total > 12;

  let startIdx = 0;
  let endIdx = total;

  if (isWindowed) {
    const half = Math.floor(MAX_VISIBLE / 2);
    startIdx = Math.max(0, safeCurrent - half);
    endIdx = Math.min(total, startIdx + MAX_VISIBLE);
    if (endIdx - startIdx < MAX_VISIBLE) {
      startIdx = Math.max(0, endIdx - MAX_VISIBLE);
    }
  }

  const visibleIndices: number[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    visibleIndices.push(i);
  }

  const hasPrev = isWindowed && startIdx > 0;
  const hasNext = isWindowed && endIdx < total;

  return (
    <div className="flex flex-col gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl px-3.5 py-2 border border-slate-200/60 dark:border-slate-700/60 shadow-xs shrink-0 max-w-full sm:max-w-xs min-w-[240px]">
      {/* Top row: Counter / Sliding Dots / Index */}
      <div className="flex items-center justify-between gap-2">
        {/* Correct / Incorrect mini badges */}
        <div className="flex items-center gap-1 shrink-0 text-xs font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            title={isVi ? 'Số từ đúng' : 'Correct'}
          >
            <CheckCircle2 size={11} />
            <span>{correctCount}</span>
          </span>
          {incorrectCount > 0 && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              title={isVi ? 'Số từ cần ôn lại' : 'Missed'}
            >
              <X size={11} />
              <span>{incorrectCount}</span>
            </span>
          )}
        </div>

        {/* Sliding Window Dots (Never wraps, cleanly bounded) */}
        <div className="flex items-center gap-1.5 justify-center flex-nowrap overflow-hidden px-1 py-0.5">
          {hasPrev && (
            <span
              className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter select-none"
              title={isVi ? `Còn ${startIdx} từ phía trước` : `${startIdx} words before`}
            >
              •••
            </span>
          )}

          {visibleIndices.map((i) => {
            const isCurrent = i === safeCurrent;
            const r = results[i];
            return (
              <div
                key={i}
                title={
                  isCurrent
                    ? (isVi ? `Từ hiện tại (#${i + 1})` : `Current word (#${i + 1})`)
                    : r === true
                    ? (isVi ? `Từ #${i + 1}: Đúng` : `Word #${i + 1}: Correct`)
                    : r === false
                    ? (isVi ? `Từ #${i + 1}: Cần gõ lại` : `Word #${i + 1}: Missed`)
                    : (isVi ? `Từ #${i + 1}: Chưa gõ` : `Word #${i + 1}: Upcoming`)
                }
                className={`rounded-full transition-all duration-300 shrink-0 ${
                  isCurrent
                    ? 'w-5 sm:w-6 h-2 bg-indigo-600 dark:bg-indigo-400 shadow-sm shadow-indigo-500/40 ring-2 ring-indigo-400/30'
                    : r === true
                    ? 'w-2 h-2 bg-emerald-500 shadow-xs shadow-emerald-500/30'
                    : r === false
                    ? 'w-2 h-2 bg-rose-500 shadow-xs shadow-rose-500/30'
                    : 'w-2 h-2 bg-slate-300/80 dark:bg-slate-600/80'
                }`}
              />
            );
          })}

          {hasNext && (
            <span
              className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter select-none"
              title={isVi ? `Còn ${total - endIdx} từ phía sau` : `${total - endIdx} words after`}
            >
              •••
            </span>
          )}
        </div>

        {/* Word Counter */}
        <div
          className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 font-mono text-right"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {Math.min(safeCurrent + 1, total)}/{total}
        </div>
      </div>

      {/* Macro progress bar across all cards (e.g. 1500 words) */}
      <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(progressPct, total > 0 ? ((safeCurrent + 1) / total) * 100 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function CompletionScreen({
  results,
  total,
  onRestart,
  onExit,
  isVi,
}: {
  results: (boolean | null)[];
  total: number;
  onRestart: () => void;
  onExit: () => void;
  isVi: boolean;
}) {
  const correct = results.filter((r) => r === true).length;
  const pct = Math.round((correct / total) * 100);

  const getGrade = () => {
    if (pct >= 90) return { label: isVi ? 'Xuất sắc!' : 'Outstanding!', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', emoji: '🏆' };
    if (pct >= 70) return { label: isVi ? 'Làm tốt lắm!' : 'Well done!', color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/30', emoji: '⭐' };
    if (pct >= 50) return { label: isVi ? 'Khá tốt!' : 'Good effort!', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', emoji: '💪' };
    return { label: isVi ? 'Cần luyện thêm!' : 'Keep practicing!', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', emoji: '📖' };
  };

  const grade = getGrade();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full rounded-3xl border-2 backdrop-blur-md shadow-xl ${grade.bg} p-8 text-center flex flex-col gap-5`}
    >
      <div className="text-5xl">{grade.emoji}</div>
      <div>
        <p className={`text-4xl sm:text-5xl font-black mb-1 ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
          {pct}%
        </p>
        <p className={`text-lg sm:text-xl font-bold ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
          {grade.label}
        </p>
      </div>
      <div className="flex justify-center gap-8">
        <div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {correct}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">{isVi ? 'Đúng' : 'Correct'}</p>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {total - correct}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">{isVi ? 'Chưa đúng' : 'Missed'}</p>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <RotateCcw size={15} /> {isVi ? 'Luyện lại' : 'Retry'}
        </button>
        <button
          onClick={onExit}
          className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {isVi ? 'Hoàn thành' : 'Done'}
        </button>
      </div>
    </motion.div>
  );
}

export type WrittenFilterMode = 'all' | 'due' | 'starred';

interface WrittenPracticeProps {
  deck?: Deck;
  onExit: () => void;
  filterMode?: WrittenFilterMode;
  onFilterChange?: (mode: WrittenFilterMode) => void;
  totalCount?: number;
  dueCount?: number;
  starredCount?: number;
  isStarred?: (cardId: number) => boolean;
  onToggleStar?: (cardId: number) => void;
}

export default function WrittenPractice({
  deck,
  onExit,
  filterMode = 'all',
  onFilterChange,
  totalCount,
  dueCount,
  starredCount,
  isStarred,
  onToggleStar,
}: WrittenPracticeProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { config: wallpaperConfig, setIsModalOpen: setWallpaperModalOpen, isModalOpen: isWallpaperModalOpen } = useWallpaper();

  const baseWords: { id?: number; en: string; vi: string }[] = useMemo(() => {
    return deck
      ? deck.cards
          .filter((c): c is FlashcardItem => c.type === 'flashcard')
          .map((c) => ({ id: c.id, en: c.front, vi: c.back }))
      : FALLBACK_WORDS;
  }, [deck]);

  const [queue, setQueue] = useState([...baseWords]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);

  const [direction, setDirection] = useState<Direction>('en-to-vi');
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [shaking, setShaking] = useState(false);
  const [results, setResults] = useState<(boolean | null)[]>(Array(baseWords.length).fill(null));
  const [done, setDone] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Sync state whenever baseWords changes
  useEffect(() => {
    setQueue([...baseWords]);
    setAnsweredCount(0);
    setSkipCount(0);
    setIndex(0);
    setInput('');
    setStatus('idle');
    setShaking(false);
    setResults(Array(baseWords.length).fill(null));
    setDone(false);
  }, [baseWords]);

  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const word = queue[index];
  const prompt = direction === 'en-to-vi' ? word?.en ?? '' : word?.vi ?? '';
  const correctAnswer = direction === 'en-to-vi' ? word?.vi ?? '' : word?.en ?? '';
  const cleanCorrectAnswer = stripParentheses(correctAnswer) || correctAnswer;
  const hasParenthesesNote = cleanCorrectAnswer !== correctAnswer;

  const activeWordIndex = useMemo(() => {
    if (!word) return Math.min(index, Math.max(0, baseWords.length - 1));
    const origIdx = baseWords.findIndex((w) => (w.id && word.id ? w.id === word.id : w.en === word.en));
    return origIdx !== -1 ? origIdx : Math.min(index, Math.max(0, baseWords.length - 1));
  }, [word, index, baseWords]);

  const { toastElement } = useDoubleEscExit({
    onExit,
    isCompleted: done,
    hasActiveModal: showShortcutsModal || isWallpaperModalOpen,
    onCloseModal: () => {
      if (showShortcutsModal) setShowShortcutsModal(false);
      else if (isWallpaperModalOpen) setWallpaperModalOpen(false);
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (status !== 'correct') {
      inputRef.current?.focus();
      // Bù lại độ trễ chuyển cảnh của AnimatePresence (250ms)
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [index, direction, status]);

  const handleDirectionChange = (d: Direction) => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setDirection(d);
    setQueue([...baseWords]);
    setAnsweredCount(0);
    setSkipCount(0);
    setIndex(0);
    setInput('');
    setStatus('idle');
    setShaking(false);
    setResults(Array(baseWords.length).fill(null));
    setDone(false);
  };

  const advance = useCallback(() => {
    const nextAnswered = answeredCount + 1;
    setAnsweredCount(nextAnswered);
    if (nextAnswered >= baseWords.length) {
      setDone(true);
      const correctCount = results.filter((r) => r === true).length;
      studyApi.submitSession({
        deckId: deck?.id || 'unknown',
        mode: 'written',
        cardsStudied: baseWords.length,
        correctCount: correctCount || baseWords.length,
        timeSpentSeconds: 60,
      }).catch(console.error);
    } else {
      setIndex((i) => i + 1);
      setInput('');
      setStatus('idle');
    }
  }, [answeredCount, baseWords.length, deck?.id, results]);

  const skip = useCallback(() => {
    if (status === 'correct' || status === 'force-retype') return;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setQueue((q) => {
      const current = q[index];
      if (!current) return q;
      return [...q, current];
    });
    setSkipCount((n) => n + 1);
    setIndex((i) => i + 1);
    setInput('');
    setStatus('idle');
    setShaking(false);
  }, [status, index]);

  const submit = useCallback(() => {
    if (status === 'correct') return;

    const trimmed = input.trim();

    if (status === 'force-retype') {
      if (isAnswerMatching(trimmed, correctAnswer)) {
        playCorrectSound();
        setStatus('correct');
        autoAdvanceRef.current = setTimeout(advance, 900);
      } else {
        playIncorrectSound();
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
      return;
    }

    if (isAnswerMatching(trimmed, correctAnswer)) {
      playCorrectSound();
      setStatus('correct');
      setResults((prev) => {
        const next = [...prev];
        const origIdx = baseWords.findIndex((w) => w.en === word?.en);
        if (origIdx !== -1) next[origIdx] = true;
        return next;
      });
      autoAdvanceRef.current = setTimeout(advance, 1000);
    } else {
      playIncorrectSound();
      setStatus('incorrect');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setResults((prev) => {
        const next = [...prev];
        const origIdx = baseWords.findIndex((w) => w.en === word?.en);
        if (origIdx !== -1 && next[origIdx] !== true) next[origIdx] = false;
        return next;
      });
      setTimeout(() => {
        setStatus('force-retype');
        setInput('');
      }, 1200);
    }
  }, [input, status, correctAnswer, advance, baseWords, word]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
    if ((e.altKey && e.key === 'ArrowRight') || (e.key === 'ArrowRight' && input.trim() === '')) {
      e.preventDefault();
      skip();
    }
  };

  const restart = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setQueue([...baseWords]);
    setAnsweredCount(0);
    setSkipCount(0);
    setIndex(0);
    setInput('');
    setStatus('idle');
    setShaking(false);
    setResults(Array(baseWords.length).fill(null));
    setDone(false);
  };

  const inputStyle = (() => {
    if (status === 'correct') return 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100 focus:border-emerald-500';
    if (status === 'incorrect') return 'border-red-500 bg-red-50/90 dark:bg-red-950/80 text-red-900 dark:text-red-100 focus:border-red-500';
    if (status === 'force-retype') return 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 text-blue-900 dark:text-blue-100 focus:border-blue-500';
    return 'border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white focus:border-indigo-500';
  })();

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
        <header className="sticky top-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <X size={16} />
              <span className="hidden sm:inline">{isVi ? 'Thoát' : 'Exit'}</span>
            </button>
            <div className="flex items-center gap-2">
              <PenLine size={16} className="text-indigo-500 dark:text-indigo-400" />
              <span className="text-sm font-black text-slate-800 dark:text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                {isVi ? 'Luyện gõ chính tả' : 'Written Practice'}
              </span>
            </div>

            {/* Filter Pills in Written Practice */}
            {onFilterChange && (
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold shrink-0">
                <button
                  onClick={() => onFilterChange('all')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={isVi ? 'Luyện tất cả từ' : 'All words'}
                >
                  {isVi ? 'Tất cả' : 'All'} ({totalCount ?? baseWords.length})
                </button>
                <button
                  onClick={() => onFilterChange('due')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    filterMode === 'due'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                  title={isVi ? 'Chỉ luyện các từ đến hạn hôm nay (SRS)' : 'Due today'}
                >
                  <Brain size={11} className={filterMode === 'due' ? 'text-indigo-200' : 'text-indigo-500'} />
                  <span>{isVi ? 'Cần ôn' : 'Due'} ({dueCount ?? 0})</span>
                </button>
                <button
                  onClick={() => onFilterChange('starred')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    filterMode === 'starred'
                      ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-amber-500'
                  }`}
                  title={isVi ? 'Chỉ luyện các từ có gắn sao ⭐' : 'Starred'}
                >
                  <Star size={11} className={filterMode === 'starred' || (starredCount ?? 0) > 0 ? 'fill-amber-500 text-amber-500' : ''} />
                  <span>{starredCount ?? 0}</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {skipCount > 0 && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-display)' }}>
                  {skipCount} {isVi ? 'bỏ qua' : 'skipped'}
                </span>
              )}
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400" style={{ fontFamily: 'var(--font-display)' }}>
                {Math.min(answeredCount + 1, baseWords.length)}/{baseWords.length}
              </span>

              {/* Wallpaper, Shortcuts & Theme controls */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setWallpaperModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isVi ? 'Đổi hình nền không gian gõ từ' : 'Customize practice wallpaper'}
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
                <LanguageSelect />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
          <div className="max-w-2xl w-full flex flex-col gap-6">
            {/* Top controls: ModeToggle & Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <ModeToggle value={direction} onChange={handleDirectionChange} />
              <ProgressDots
                total={baseWords.length}
                current={activeWordIndex}
                results={results}
                answeredCount={answeredCount}
                isVi={isVi}
              />
            </div>

            {/* Main Typing / Practice Box */}
            <AnimatePresence mode="wait">
              {done ? (
                <CompletionScreen
                  results={results}
                  total={baseWords.length}
                  onRestart={() => {
                    setQueue([...baseWords]);
                    setAnsweredCount(0);
                    setSkipCount(0);
                    setIndex(0);
                    setInput('');
                    setStatus('idle');
                    setShaking(false);
                    setResults(Array(baseWords.length).fill(null));
                    setDone(false);
                  }}
                  onExit={onExit}
                  isVi={isVi}
                />
              ) : (
                <motion.div
                  key={`${index}-${direction}-${queue.length}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  onAnimationComplete={() => {
                    inputRef.current?.focus();
                  }}
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                  <div className="px-7 pt-8 pb-6 text-center border-b border-slate-100 dark:border-slate-800/80 relative">
                    {word?.id && isStarred && onToggleStar && (
                      <button
                        type="button"
                        onClick={() => onToggleStar(word.id!)}
                        className={`absolute top-4 right-4 p-2 rounded-xl transition-all cursor-pointer ${
                          isStarred(word.id)
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-500 ring-1 ring-amber-300'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isStarred(word.id) ? (isVi ? 'Bỏ gắn sao từ này' : 'Unstar this word') : (isVi ? 'Gán sao từ này' : 'Star this word')}
                      >
                        <Star size={18} className={isStarred(word.id) ? 'fill-amber-500 text-amber-500' : ''} />
                      </button>
                    )}
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: direction === 'en-to-vi' ? '#6366f1' : '#10b981',
                      }}
                    >
                      {direction === 'en-to-vi' ? (isVi ? 'Tiếng Anh → Tiếng Việt' : 'English → Vietnamese') : (isVi ? 'Tiếng Việt → Tiếng Anh' : 'Vietnamese → English')}
                    </p>
                    <p
                      className="text-slate-900 dark:text-white leading-tight"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 900,
                        fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {prompt}
                    </p>
                  </div>

                  <div className="px-7 py-6 flex flex-col gap-4">
                    <AnimatePresence>
                      {status === 'force-retype' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3 flex items-start gap-2.5">
                            <ArrowRight size={16} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide mb-0.5">
                                {isVi ? 'Gõ lại từ này để ghi nhớ sâu:' : 'Type this to continue:'}
                              </p>
                              <p
                                className="text-blue-700 dark:text-blue-300 font-black text-base sm:text-lg"
                                style={{ fontFamily: 'var(--font-display)' }}
                              >
                                {cleanCorrectAnswer}
                                {hasParenthesesNote && (
                                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                    {isVi ? `(hoặc gõ đầy đủ: ${correctAnswer})` : `(or full phrase: ${correctAnswer})`}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div
                      animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                    >
                      <div className="relative">
                        <input
                          ref={inputRef}
                          autoFocus
                          type="text"
                          value={input}
                          onChange={(e) => {
                            setInput(e.target.value);
                            if (status === 'incorrect') setStatus('idle');
                          }}
                          onKeyDown={handleKeyDown}
                          disabled={status === 'correct'}
                          placeholder={
                            status === 'force-retype'
                              ? `${isVi ? 'Gõ:' : 'Type:'} ${cleanCorrectAnswer}`
                              : direction === 'en-to-vi'
                              ? (isVi ? 'Nghĩa tiếng Việt…' : 'Vietnamese meaning…')
                              : (isVi ? 'Từ tiếng Anh…' : 'English word…')
                          }
                          className={`w-full px-5 py-4 pr-12 rounded-2xl border-2 font-semibold text-base outline-none transition-all duration-200 shadow-md ${inputStyle}`}
                          style={{ fontFamily: 'var(--font-display)' }}
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <AnimatePresence>
                            {status === 'correct' && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              >
                                <CheckCircle2 size={22} className="text-emerald-500" />
                              </motion.div>
                            )}
                            {status === 'incorrect' && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                              >
                                <X size={22} className="text-red-500" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>

                    <button
                      onClick={submit}
                      disabled={status === 'correct' || !input.trim()}
                      className={`
                        w-full py-4 rounded-2xl font-black text-base transition-all duration-200 active:scale-[0.98]
                        disabled:cursor-not-allowed cursor-pointer
                        ${
                          status === 'correct'
                            ? 'bg-emerald-500 text-white disabled:opacity-100'
                            : status === 'force-retype'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-40'
                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-40 disabled:shadow-none'
                        }
                      `}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {status === 'correct'
                        ? (isVi ? '✓ Chính xác — đang chuyển câu…' : '✓ Correct — loading next…')
                        : status === 'force-retype'
                        ? (isVi ? 'Xác nhận & Tiếp tục' : 'Confirm & Continue')
                        : (isVi ? 'Kiểm tra' : 'Submit')}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        <kbd className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">Enter</kbd>
                        {' '}{isVi ? 'để gửi' : 'to submit'}
                      </p>

                      {status !== 'correct' && status !== 'force-retype' && (
                        <button
                          onClick={skip}
                          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors group cursor-pointer"
                          style={{ fontFamily: 'var(--font-display)' }}
                          tabIndex={-1}
                        >
                          <SkipForward
                            size={14}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                          {isVi ? 'Tạm thời bỏ qua' : 'Skip for now'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Wallpaper selector modal */}
      <WallpaperModal />

      {/* Shortcuts Modal for Written Practice */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Keyboard size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{isVi ? 'Phím tắt Luyện gõ' : 'Typing Shortcuts'}</h3>
                    <p className="text-xs text-slate-400">{isVi ? 'Gõ phím mượt mà không cần nhấc chuột' : 'Practice quickly with keyboard'}</p>
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
                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Gửi kết quả gõ' : 'Submit your answer'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200">Enter</kbd>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Bỏ qua từ này' : 'Skip current word'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200">→ / Alt + →</kbd>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Thoát ra bộ thẻ (nhấn 2 lần)' : 'Exit practice (double press)'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200">Esc + Esc</kbd>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Mở / đóng bảng phím tắt này' : 'Toggle shortcuts modal'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200">?</kbd>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-500/25 cursor-pointer"
                >
                  {isVi ? 'Đã hiểu' : 'Got it'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Double Esc Toast Notification */}
      {toastElement}
    </div>
  );
}

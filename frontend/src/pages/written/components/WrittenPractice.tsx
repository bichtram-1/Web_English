import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, ArrowRight, RotateCcw, PenLine, SkipForward, Image as ImageIcon, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { playCorrectSound, playIncorrectSound } from '../../../utils/soundEffects';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';
import WallpaperModal from '../../../components/general/WallpaperModal';
import { useWallpaper } from '../../../contexts/WallpaperContext';
import LanguageSelect from '../../../components/general/LanguageSelect';
import ThemeToggle from '../../../components/general/ThemeToggle';
import { isAnswerMatching, stripParentheses } from '../../../utils/answerMatch';

const FALLBACK_WORDS = [
  { en: 'Developer', vi: 'lập trình viên' },
  { en: 'Database', vi: 'cơ sở dữ liệu' },
  { en: 'Framework', vi: 'bộ khung' },
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
}: {
  total: number;
  current: number;
  results: (boolean | null)[];
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {Array.from({ length: total }).map((_, i) => {
        const r = results[i];
        return (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2.5 bg-indigo-500'
                : r === true
                ? 'w-2.5 h-2.5 bg-emerald-500'
                : r === false
                ? 'w-2.5 h-2.5 bg-red-500'
                : 'w-2.5 h-2.5 bg-slate-200 dark:bg-slate-700'
            }`}
          />
        );
      })}
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
  const grade =
    pct === 100
      ? { emoji: '🏆', label: isVi ? 'Hoàn hảo!' : 'Perfect!', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800' }
      : pct >= 70
      ? { emoji: '🌟', label: isVi ? 'Làm tốt lắm!' : 'Great job!', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800' }
      : { emoji: '💪', label: isVi ? 'Cố gắng lên nhé!' : 'Keep at it!', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800' };

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

interface WrittenPracticeProps {
  deck?: Deck;
  onExit: () => void;
}

export default function WrittenPractice({ deck, onExit }: WrittenPracticeProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { config: wallpaperConfig, setIsModalOpen: setWallpaperModalOpen } = useWallpaper();

  const baseWords: { en: string; vi: string }[] = deck
    ? deck.cards
        .filter((c): c is FlashcardItem => c.type === 'flashcard')
        .map((c) => ({ en: c.front, vi: c.back }))
    : FALLBACK_WORDS;

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

  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const word = queue[index];
  const prompt = direction === 'en-to-vi' ? word?.en ?? '' : word?.vi ?? '';
  const correctAnswer = direction === 'en-to-vi' ? word?.vi ?? '' : word?.en ?? '';
  const cleanCorrectAnswer = stripParentheses(correctAnswer) || correctAnswer;
  const hasParenthesesNote = cleanCorrectAnswer !== correctAnswer;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'Escape' && showShortcutsModal) {
        e.preventDefault();
        setShowShortcutsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsModal]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [index, direction]);

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
            <div className="flex items-center gap-2">
              {skipCount > 0 && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-display)' }}>
                  {skipCount} {isVi ? 'bỏ qua' : 'skipped'}
                </span>
              )}
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400" style={{ fontFamily: 'var(--font-display)' }}>
                {answeredCount + 1}/{baseWords.length}
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
                <LanguageSelect mini />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl flex flex-col gap-5">
            <ModeToggle value={direction} onChange={handleDirectionChange} />
            <ProgressDots total={baseWords.length} current={Math.min(answeredCount, baseWords.length - 1)} results={results} />

            <AnimatePresence mode="wait">
              {done ? (
                <CompletionScreen
                  key="done"
                  results={results}
                  total={baseWords.length}
                  onRestart={restart}
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
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden"
                >
                  <div className="px-7 pt-8 pb-6 text-center border-b border-slate-100 dark:border-slate-800/80">
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
    </div>
  );
}

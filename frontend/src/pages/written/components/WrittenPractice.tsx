import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, ArrowRight, RotateCcw, PenLine, SkipForward } from 'lucide-react';
import { playCorrectSound, playIncorrectSound } from '../../../utils/soundEffects';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';

const FALLBACK_WORDS = [
  { en: 'Developer', vi: 'lập trình viên' },
  { en: 'Database', vi: 'cơ sở dữ liệu' },
  { en: 'Framework', vi: 'bộ khung' },
];

type Direction = 'en-to-vi' | 'vi-to-en';
type Status = 'idle' | 'correct' | 'incorrect' | 'force-retype';

function normalise(s: string) {
  return s.trim().toLowerCase();
}

function ModeToggle({ value, onChange }: { value: Direction; onChange: (d: Direction) => void }) {
  return (
    <div className="relative flex bg-slate-100 rounded-2xl p-1 gap-1">
      {(
        [
          { id: 'en-to-vi', label: 'EN → VI' },
          { id: 'vi-to-en', label: 'VI → EN' },
        ] as { id: Direction; label: string }[]
      ).map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="relative z-10 flex-1 px-4 py-2 rounded-xl text-xs font-black transition-colors duration-200"
          style={{
            fontFamily: 'var(--font-display)',
            color: value === opt.id ? '#ffffff' : '#64748b',
          }}
        >
          {value === opt.id && (
            <motion.span
              layoutId="mode-pill"
              className="absolute inset-0 rounded-xl bg-indigo-600 shadow-md shadow-indigo-200"
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
                ? 'w-5 h-2.5 bg-indigo-500'
                : r === true
                ? 'w-2.5 h-2.5 bg-emerald-400'
                : r === false
                ? 'w-2.5 h-2.5 bg-red-400'
                : 'w-2.5 h-2.5 bg-slate-200'
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
}: {
  results: (boolean | null)[];
  total: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const correct = results.filter((r) => r === true).length;
  const pct = Math.round((correct / total) * 100);
  const grade =
    pct === 100
      ? { emoji: '🏆', label: 'Perfect!', color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50 border-emerald-200' }
      : pct >= 70
      ? { emoji: '🌟', label: 'Great job!', color: 'text-indigo-600', bg: 'from-indigo-50 to-violet-50 border-indigo-200' }
      : { emoji: '💪', label: 'Keep at it!', color: 'text-amber-600', bg: 'from-amber-50 to-orange-50 border-amber-200' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full rounded-3xl border-2 bg-gradient-to-br ${grade.bg} p-8 text-center flex flex-col gap-5`}
    >
      <div className="text-5xl">{grade.emoji}</div>
      <div>
        <p className={`text-4xl font-black mb-1 ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
          {pct}%
        </p>
        <p className={`text-lg font-bold ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
          {grade.label}
        </p>
      </div>
      <div className="flex justify-center gap-8">
        <div>
          <p className="text-2xl font-black text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
            {correct}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Correct</p>
        </div>
        <div>
          <p className="text-2xl font-black text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
            {total - correct}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Missed</p>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <RotateCcw size={14} /> Retry
        </button>
        <button
          onClick={onExit}
          className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Done
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

  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const word = queue[index];
  const prompt = direction === 'en-to-vi' ? word?.en ?? '' : word?.vi ?? '';
  const correctAnswer = direction === 'en-to-vi' ? word?.vi ?? '' : word?.en ?? '';

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
      if (normalise(trimmed) === normalise(correctAnswer)) {
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

    if (normalise(trimmed) === normalise(correctAnswer)) {
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
    if (e.key === 'Enter') submit();
    if (e.key === 'ArrowRight') skip();
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
    if (status === 'correct') return 'border-emerald-400 bg-emerald-50 text-emerald-900 focus:border-emerald-400';
    if (status === 'incorrect') return 'border-red-400 bg-red-50 text-red-900 focus:border-red-400';
    if (status === 'force-retype') return 'border-blue-400 bg-blue-50 text-blue-900 focus:border-blue-400';
    return 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400';
  })();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-semibold transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <X size={15} /> Exit
          </button>
          <div className="flex items-center gap-2">
            <PenLine size={14} className="text-indigo-500" />
            <span className="text-sm font-black text-slate-700" style={{ fontFamily: 'var(--font-display)' }}>
              Written Practice
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {skipCount > 0 && (
              <span className="text-xs font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-display)' }}>
                {skipCount} skipped
              </span>
            )}
            <span className="text-sm font-bold text-slate-400" style={{ fontFamily: 'var(--font-display)' }}>
              {answeredCount + 1}/{baseWords.length}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md flex flex-col gap-5">
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
              />
            ) : (
              <motion.div
                key={`${index}-${direction}-${queue.length}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="px-7 pt-8 pb-6 text-center border-b border-slate-50">
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: direction === 'en-to-vi' ? '#6366f1' : '#10b981',
                    }}
                  >
                    {direction === 'en-to-vi' ? 'English → Vietnamese' : 'Vietnamese → English'}
                  </p>
                  <p
                    className="text-slate-900 leading-tight"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
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
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-start gap-2">
                          <ArrowRight size={14} className="text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-blue-500 font-bold uppercase tracking-wide mb-0.5">
                              Type this to continue
                            </p>
                            <p
                              className="text-blue-700 font-black text-base"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              {correctAnswer}
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
                            ? `Type: ${correctAnswer}`
                            : direction === 'en-to-vi'
                            ? 'Vietnamese meaning…'
                            : 'English word…'
                        }
                        className={`w-full px-5 py-4 pr-12 rounded-2xl border-2 font-semibold text-base outline-none transition-all duration-200 ${inputStyle}`}
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
                              <CheckCircle2 size={20} className="text-emerald-500" />
                            </motion.div>
                          )}
                          {(status === 'incorrect') && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                            >
                              <X size={20} className="text-red-500" />
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
                      disabled:cursor-not-allowed
                      ${
                        status === 'correct'
                          ? 'bg-emerald-500 text-white disabled:opacity-100'
                          : status === 'force-retype'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-40'
                          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-40 disabled:shadow-none'
                      }
                    `}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {status === 'correct'
                      ? '✓ Correct — loading next…'
                      : status === 'force-retype'
                      ? 'Confirm & Continue'
                      : 'Submit'}
                  </button>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">
                      <kbd className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-xs font-mono">Enter</kbd>
                      {' '}submit{'  '}
                      <kbd className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-xs font-mono">→</kbd>
                      {' '}skip
                    </p>

                    {status !== 'correct' && status !== 'force-retype' && (
                      <button
                        onClick={skip}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors group"
                        style={{ fontFamily: 'var(--font-display)' }}
                        tabIndex={-1}
                      >
                        <SkipForward
                          size={13}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                        Skip for now
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
  );
}

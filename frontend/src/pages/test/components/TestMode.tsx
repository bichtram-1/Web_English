import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle2, XCircle, Trophy, RotateCcw, ArrowLeft, Keyboard, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';
import { playCorrectSound, playIncorrectSound } from '../../../utils/soundEffects';
import { isAnswerMatching, stripParentheses } from '../../../utils/answerMatch';
import WallpaperModal from '../../../components/general/WallpaperModal';
import { useWallpaper } from '../../../contexts/WallpaperContext';
import LanguageSelect from '../../../components/general/LanguageSelect';
import ThemeToggle from '../../../components/general/ThemeToggle';

type MCQuestion = {
  kind: 'mc';
  id: number;
  english: string;
  correct: string;
  options: string[];
};

type TFQuestion = {
  kind: 'tf';
  id: number;
  english: string;
  vietnamese: string;
  isTrue: boolean;
};

type WrittenQuestion = {
  kind: 'written';
  id: number;
  vietnamese: string;
  correct: string;
};

type Question = MCQuestion | TFQuestion | WrittenQuestion;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildQuestions(deck: Deck): Question[] {
  const cards = deck.cards.filter((c): c is FlashcardItem => c.type === 'flashcard');
  if (cards.length === 0) return [];

  const questions: Question[] = [];

  cards.forEach((card, idx) => {
    const kind = (['mc', 'tf', 'written'] as const)[idx % 3]!;

    if (kind === 'mc') {
      const distractors = shuffle(cards.filter((c) => c.id !== card.id))
        .slice(0, 3)
        .map((c) => c.back);
      const options = shuffle([card.back, ...distractors]);
      questions.push({ kind: 'mc', id: card.id, english: card.front, correct: card.back, options });
    } else if (kind === 'tf') {
      const useWrong = Math.random() > 0.5;
      const wrongCard = cards.find((c) => c.id !== card.id) ?? card;
      questions.push({
        kind: 'tf',
        id: card.id,
        english: card.front,
        vietnamese: useWrong ? wrongCard.back : card.back,
        isTrue: !useWrong,
      });
    } else {
      questions.push({ kind: 'written', id: card.id, vietnamese: card.back, correct: card.front });
    }
  });

  return shuffle(questions);
}

function normalise(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

function MCCard({
  q,
  onAnswer,
  isVi,
}: {
  q: MCQuestion;
  onAnswer: (correct: boolean) => void;
  isVi: boolean;
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  const pick = useCallback((opt: string) => {
    if (chosen) return;
    setChosen(opt);
    const isCorrect = opt === q.correct;
    if (isCorrect) playCorrectSound();
    else playIncorrectSound();
    setTimeout(() => onAnswer(isCorrect), 700);
  }, [chosen, q.correct, onAnswer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (chosen) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (q.options[index]) {
          e.preventDefault();
          pick(q.options[index]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chosen, pick, q.options]);

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center">
        <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">
          {isVi ? 'Từ này có nghĩa là gì?' : 'What does this mean?'}
        </p>
        <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {q.english}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((opt, idx) => {
          const isCorrect = opt === q.correct;
          const isChosen = opt === chosen;
          let cls = 'border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40';
          if (chosen) {
            if (isCorrect) cls = 'border-emerald-500 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 font-bold';
            else if (isChosen) cls = 'border-red-500 bg-red-50/95 dark:bg-red-950/90 text-red-800 dark:text-red-200';
            else cls = 'border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600';
          }
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              className={`w-full px-5 py-4 rounded-2xl border-2 font-semibold text-left transition-all duration-200 flex items-center justify-between group cursor-pointer backdrop-blur-md shadow-md hover:shadow-lg ${cls}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <div className="flex items-center gap-3.5">
                <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center font-mono text-xs font-bold transition-colors shrink-0">
                  {idx + 1}
                </span>
                <span className="text-base sm:text-lg">{opt}</span>
              </div>
              {chosen && isCorrect && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
              {chosen && isChosen && !isCorrect && <XCircle size={20} className="text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TFCard({ q, onAnswer, isVi }: { q: TFQuestion; onAnswer: (correct: boolean) => void; isVi: boolean }) {
  const [chosen, setChosen] = useState<boolean | null>(null);

  const pick = useCallback((val: boolean) => {
    if (chosen !== null) return;
    setChosen(val);
    const isCorrect = val === q.isTrue;
    if (isCorrect) playCorrectSound();
    else playIncorrectSound();
    setTimeout(() => onAnswer(isCorrect), 700);
  }, [chosen, q.isTrue, onAnswer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (chosen !== null) return;
      if (e.key === '1' || e.key.toLowerCase() === 't' || e.key === 'ArrowLeft') {
        e.preventDefault();
        pick(true);
      } else if (e.key === '2' || e.key.toLowerCase() === 'f' || e.key === 'ArrowRight') {
        e.preventDefault();
        pick(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chosen, pick]);

  const btnClass = (val: boolean) => {
    if (chosen === null) {
      return val
        ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
        : 'bg-red-50/90 dark:bg-red-950/60 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60';
    }
    const correct = val === q.isTrue;
    const picked = chosen === val;
    if (correct) return 'bg-emerald-100 dark:bg-emerald-900/80 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-md';
    if (picked) return 'bg-red-100 dark:bg-red-900/80 border-red-500 text-red-900 dark:text-red-100 shadow-md';
    return 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800 text-slate-400 dark:text-slate-600';
  };

  return (
    <div className="w-full max-w-xl flex flex-col gap-5">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center">
        <p className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-3">
          {isVi ? 'Đúng hay Sai?' : 'True or False?'}
        </p>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          "{q.english}"
        </p>
        <p className="text-slate-600 dark:text-slate-300 text-lg font-semibold">= "{q.vietnamese}"</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => pick(true)}
          className={`py-4 sm:py-5 rounded-2xl border-2 font-black text-base sm:text-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md shadow-md ${btnClass(true)}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <kbd className="px-1.5 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 font-mono text-xs">1</kbd>
          <span>✓ {isVi ? 'Đúng' : 'True'}</span>
        </button>
        <button
          onClick={() => pick(false)}
          className={`py-4 sm:py-5 rounded-2xl border-2 font-black text-base sm:text-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md shadow-md ${btnClass(false)}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <kbd className="px-1.5 py-0.5 rounded bg-red-100/80 dark:bg-red-900/60 border border-red-300 dark:border-red-700 font-mono text-xs">2</kbd>
          <span>✗ {isVi ? 'Sai' : 'False'}</span>
        </button>
      </div>
      {chosen !== null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center text-sm sm:text-base font-semibold ${chosen === q.isTrue ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {chosen === q.isTrue
            ? (isVi ? 'Chính xác! 🎉' : 'Correct!')
            : (isVi ? `Đáp án chính xác là: "${q.isTrue ? 'Đúng' : 'Sai'}"` : `The correct answer is: "${q.isTrue ? 'True' : 'False'}"`)}
        </motion.p>
      )}
    </div>
  );
}

function WrittenCard({ q, onAnswer, isVi }: { q: WrittenQuestion; onAnswer: (correct: boolean) => void; isVi: boolean }) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const cleanCorrect = stripParentheses(q.correct) || q.correct;
  const hasParens = cleanCorrect !== q.correct;

  const submit = () => {
    if (submitted || !value.trim()) return;
    const ok = isAnswerMatching(value, q.correct);
    setCorrect(ok);
    setSubmitted(true);
    if (ok) playCorrectSound();
    else playIncorrectSound();
    setTimeout(() => onAnswer(ok), 900);
  };

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl text-center">
        <p className="text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-2">
          {isVi ? 'Gõ từ tiếng Anh tương ứng' : 'Type the English word'}
        </p>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {q.vietnamese}
        </p>
      </div>
      <div className="relative">
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={submitted}
          placeholder={isVi ? 'Gõ bằng tiếng Anh…' : 'Type in English…'}
          className={`w-full px-5 py-4 rounded-2xl border-2 font-semibold text-base outline-none transition-all shadow-md
            ${submitted
              ? correct
                ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200'
                : 'border-red-500 bg-red-50/90 dark:bg-red-950/80 text-red-800 dark:text-red-200'
              : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-md'
            }`}
          style={{ fontFamily: 'var(--font-display)' }}
        />
      </div>
      {submitted && !correct && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-600 dark:text-red-400 text-sm font-semibold px-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {isVi ? 'Đáp án đúng: ' : 'Correct answer: '}
          <span className="font-black">{cleanCorrect}</span>
          {hasParens && <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1">({isVi ? 'hoặc' : 'or'} {q.correct})</span>}
        </motion.p>
      )}
      <button
        onClick={submit}
        disabled={submitted || !value.trim()}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200
          disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed
          bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-500/25
          disabled:shadow-none cursor-pointer"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {submitted ? (correct ? (isVi ? '✓ Chính xác!' : '✓ Correct!') : (isVi ? '✗ Chưa đúng' : '✗ Wrong')) : (isVi ? 'Kiểm tra' : 'Submit Answer')}
      </button>
    </div>
  );
}

interface WrongItem {
  question: string;
  yourAnswer: string;
  correct: string;
}

function ScoreScreen({
  score,
  total,
  elapsed,
  wrongs,
  onRestart,
  onExit,
  isVi,
}: {
  score: number;
  total: number;
  elapsed: number;
  wrongs: WrongItem[];
  onRestart: () => void;
  onExit: () => void;
  isVi: boolean;
}) {
  const pct = Math.round((score / total) * 100);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const grade =
    pct >= 90 ? { label: isVi ? 'Xuất sắc! 🎉' : 'Excellent!', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800' } :
    pct >= 70 ? { label: isVi ? 'Làm tốt lắm! 👍' : 'Good job!', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800' } :
    pct >= 50 ? { label: isVi ? 'Cố gắng lên! 💪' : 'Keep going!', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800' } :
                { label: isVi ? 'Thử lại nhé! 🔄' : 'Try again', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/90 dark:bg-red-950/70 border-red-300 dark:border-red-800' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl flex flex-col gap-5"
    >
      <div className={`rounded-3xl border-2 p-7 text-center backdrop-blur-md shadow-xl ${grade.bg}`}>
        <Trophy size={40} className={`mx-auto mb-3 ${grade.color}`} />
        <p className={`text-5xl font-black mb-1 ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
          {pct}%
        </p>
        <p className={`text-lg font-bold mb-4 ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
          {grade.label}
        </p>
        <div className="flex justify-center gap-8 text-sm font-semibold">
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {score}/{total}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">{isVi ? 'Đúng' : 'Correct'}</p>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {mins}:{String(secs).padStart(2, '0')}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">{isVi ? 'Thời gian' : 'Time'}</p>
          </div>
        </div>
      </div>

      {wrongs.length > 0 && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <XCircle size={16} className="text-red-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
              {isVi ? `Các câu cần ôn lại (${wrongs.length})` : `Corrections (${wrongs.length})`}
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
            {wrongs.map((w, i) => (
              <div key={i} className="px-6 py-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1">{w.question}</p>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="line-through text-red-500 font-semibold">{w.yourAnswer || (isVi ? '(để trống)' : '(blank)')}</span>
                  <ArrowLeft size={12} className="text-slate-400 rotate-180" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    {w.correct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="flex-1 py-3.5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <RotateCcw size={16} /> {isVi ? 'Làm lại' : 'Retry'}
        </button>
        <button
          onClick={onExit}
          className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {isVi ? 'Trở về bộ thẻ' : 'Back to Deck'}
        </button>
      </div>
    </motion.div>
  );
}

const TIME_LIMIT = 300;

interface TestModeProps {
  deck: Deck;
  onExit: () => void;
}

export default function TestMode({ deck, onExit }: TestModeProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { config: wallpaperConfig, setIsModalOpen: setWallpaperModalOpen } = useWallpaper();

  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(deck));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongs, setWrongs] = useState<WrongItem[]>([]);
  const [answers, setAnswers] = useState<{ correct: boolean; yourAnswer: string }[]>([]);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const finishTest = useCallback((finalScore: number, finalWrongs: WrongItem[], finalElapsed: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScore(finalScore);
    setWrongs(finalWrongs);
    setElapsed(finalElapsed);
    setDone(true);
    studyApi.submitSession({
      deckId: deck.id,
      mode: 'test',
      cardsStudied: questions.length,
      correctCount: finalScore,
      timeSpentSeconds: finalElapsed,
    }).catch(console.error);
  }, [deck.id, questions.length]);

  useEffect(() => {
    let e = 0;
    timerRef.current = setInterval(() => {
      e++;
      setElapsed(e);
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleAnswer = (correct: boolean, yourAnswer = '') => {
    const q = questions[current]!;
    const correctText = q.kind === 'mc' ? q.correct : q.kind === 'tf' ? String(q.isTrue) : q.correct;
    const questionLabel = q.kind === 'mc' ? q.english : q.kind === 'tf' ? `${q.english} = ?` : q.vietnamese;

    const newAnswers = [...answers, { correct, yourAnswer }];
    const newWrongs = correct ? wrongs : [...wrongs, { question: questionLabel, yourAnswer, correct: correctText }];
    const newScore = score + (correct ? 1 : 0);

    setAnswers(newAnswers);

    if (current + 1 >= questions.length) {
      finishTest(newScore, newWrongs, elapsed);
    } else {
      setScore(newScore);
      setWrongs(newWrongs);
      setCurrent((c) => c + 1);
    }
  };

  const restart = () => {
    setQuestions(buildQuestions(deck));
    setCurrent(0);
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setElapsed(0);
    setDone(false);
    setWrongs([]);
    setAnswers([]);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = ((current) / questions.length) * 100;
  const q = questions[current];

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-center p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm">
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {isVi ? 'Bộ thẻ này chưa có thẻ nào để tạo bài kiểm tra.' : 'This deck has no flashcards for test mode.'}
          </p>
          <button onClick={onExit} className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all cursor-pointer">
            {isVi ? 'Quay lại' : 'Go Back'}
          </button>
        </div>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold shrink-0 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <X size={16} />
              <span className="hidden sm:inline">{isVi ? 'Thoát' : 'Exit'}</span>
            </button>

            <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full"
                animate={{ width: `${done ? 100 : progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span
                className="text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {done ? questions.length : current + 1}/{questions.length}
              </span>
              <div
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                  timeLeft < 60
                    ? 'bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Clock size={13} />
                {mins}:{String(secs).padStart(2, '0')}
              </div>

              {/* Wallpaper & Theme controls */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setWallpaperModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={isVi ? 'Đổi hình nền không gian kiểm tra' : 'Customize test wallpaper'}
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

        {/* Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <AnimatePresence mode="wait">
            {done ? (
              <ScoreScreen
                key="score"
                score={score}
                total={questions.length}
                elapsed={elapsed}
                wrongs={wrongs}
                onRestart={restart}
                onExit={onExit}
                isVi={isVi}
              />
            ) : (
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="w-full flex flex-col items-center max-w-xl"
              >
                <div className="mb-4">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs border ${
                      q?.kind === 'mc' ? 'bg-indigo-500/15 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' :
                      q?.kind === 'tf' ? 'bg-amber-500/15 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                      'bg-violet-500/15 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {q?.kind === 'mc' ? (isVi ? 'Trắc nghiệm 4 đáp án' : 'Multiple Choice') :
                     q?.kind === 'tf' ? (isVi ? 'Đúng / Sai' : 'True / False') :
                     (isVi ? 'Gõ chính tả' : 'Written Answer')}
                  </span>
                </div>

                {q?.kind === 'mc' && <MCCard q={q} onAnswer={(ok) => handleAnswer(ok, '')} isVi={isVi} />}
                {q?.kind === 'tf' && <TFCard q={q} onAnswer={(ok) => handleAnswer(ok, '')} isVi={isVi} />}
                {q?.kind === 'written' && (
                  <WrittenCard
                    q={q}
                    onAnswer={(ok) => handleAnswer(ok, '')}
                    isVi={isVi}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Wallpaper selector modal */}
      <WallpaperModal />

      {/* Test Mode Shortcuts Modal */}
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
                    <h3 className="font-bold text-base">{isVi ? 'Phím tắt Chế độ Kiểm tra' : 'Test Mode Shortcuts'}</h3>
                    <p className="text-xs text-slate-400">{isVi ? 'Trả lời nhanh chóng không cần dùng chuột' : 'Quick navigation with keyboard'}</p>
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
                  <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Trắc nghiệm 4 đáp án' : 'Multiple Choice (4 options)'}</span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">1</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">2</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">3</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">4</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Đúng / Sai (True / False)' : 'True / False'}</span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <kbd className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">1 / T / ←</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">2 / F / →</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">{isVi ? 'Gõ từ tiếng Anh' : 'Submit Written word'}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200">
                    {isVi ? 'Enter gửi câu trả lời' : 'Enter to submit'}
                  </kbd>
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

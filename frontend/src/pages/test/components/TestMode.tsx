import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle2, XCircle, Trophy, RotateCcw, ArrowLeft } from 'lucide-react';
import type { Deck, FlashcardItem } from '../../../types/DeckType';
import studyApi from '../../../api/studyApi';

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
}: {
  q: MCQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);

  const pick = (opt: string) => {
    if (chosen) return;
    setChosen(opt);
    setTimeout(() => onAnswer(opt === q.correct), 700);
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">What does this mean?</p>
        <p className="text-2xl font-black text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
          {q.english}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {q.options.map((opt) => {
          const isCorrect = opt === q.correct;
          const isChosen = opt === chosen;
          let cls = 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50';
          if (chosen) {
            if (isCorrect) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800';
            else if (isChosen) cls = 'border-red-400 bg-red-50 text-red-700';
            else cls = 'border-slate-100 bg-slate-50 text-slate-400';
          }
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              className={`w-full px-5 py-3.5 rounded-xl border-2 font-semibold text-left transition-all duration-200 flex items-center justify-between ${cls}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>{opt}</span>
              {chosen && isCorrect && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
              {chosen && isChosen && !isCorrect && <XCircle size={16} className="text-red-500 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TFCard({ q, onAnswer }: { q: TFQuestion; onAnswer: (correct: boolean) => void }) {
  const [chosen, setChosen] = useState<boolean | null>(null);

  const pick = (val: boolean) => {
    if (chosen !== null) return;
    setChosen(val);
    setTimeout(() => onAnswer(val === q.isTrue), 700);
  };

  const btnClass = (val: boolean) => {
    if (chosen === null) return val ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100';
    const correct = val === q.isTrue;
    const picked = chosen === val;
    if (correct) return 'bg-emerald-100 border-emerald-500 text-emerald-800';
    if (picked) return 'bg-red-100 border-red-400 text-red-700';
    return 'bg-slate-50 border-slate-200 text-slate-400';
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center">
        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">True or False?</p>
        <p className="text-xl font-black text-slate-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          "{q.english}"
        </p>
        <p className="text-slate-500 text-base font-semibold">= "{q.vietnamese}"</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([true, false] as const).map((val) => (
          <button
            key={String(val)}
            onClick={() => pick(val)}
            className={`py-4 rounded-2xl border-2 font-black text-lg transition-all duration-200 ${btnClass(val)}`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {val ? '✓ True' : '✗ False'}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center text-sm font-semibold ${chosen === q.isTrue ? 'text-emerald-600' : 'text-red-600'}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {chosen === q.isTrue
            ? 'Correct!'
            : `The correct answer is: "${q.isTrue ? 'True' : 'False'}"`}
        </motion.p>
      )}
    </div>
  );
}

function WrittenCard({ q, onAnswer }: { q: WrittenQuestion; onAnswer: (correct: boolean) => void }) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = () => {
    if (submitted || !value.trim()) return;
    const ok = normalise(value) === normalise(q.correct);
    setCorrect(ok);
    setSubmitted(true);
    setTimeout(() => onAnswer(ok), 900);
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center">
        <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Type the English word</p>
        <p className="text-2xl font-black text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
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
          placeholder="Type in English…"
          className={`w-full px-5 py-4 rounded-2xl border-2 font-semibold text-base outline-none transition-all
            ${submitted
              ? correct
                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                : 'border-red-400 bg-red-50 text-red-700'
              : 'border-slate-200 focus:border-indigo-400 bg-white text-slate-800'
            }`}
          style={{ fontFamily: 'var(--font-display)' }}
        />
      </div>
      {submitted && !correct && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-600 text-sm font-semibold px-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Correct answer: <span className="font-black">{q.correct}</span>
        </motion.p>
      )}
      <button
        onClick={submit}
        disabled={submitted || !value.trim()}
        className="w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200
          disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
          bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-200
          disabled:shadow-none"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {submitted ? (correct ? '✓ Correct!' : '✗ Wrong') : 'Submit Answer'}
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
}: {
  score: number;
  total: number;
  elapsed: number;
  wrongs: WrongItem[];
  onRestart: () => void;
  onExit: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const grade =
    pct >= 90 ? { label: 'Excellent!', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' } :
    pct >= 70 ? { label: 'Good job!', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' } :
    pct >= 50 ? { label: 'Keep going!', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' } :
                { label: 'Try again', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg flex flex-col gap-5"
    >
      <div className={`rounded-2xl border-2 p-7 text-center ${grade.bg}`}>
        <Trophy size={36} className={`mx-auto mb-3 ${grade.color}`} />
        <p className={`text-5xl font-black mb-1 ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
          {pct}%
        </p>
        <p className={`text-lg font-bold mb-4 ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
          {grade.label}
        </p>
        <div className="flex justify-center gap-8 text-sm text-slate-600 font-semibold">
          <div>
            <p className="text-xl font-black text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
              {score}/{total}
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Correct</p>
          </div>
          <div>
            <p className="text-xl font-black text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
              {mins}:{String(secs).padStart(2, '0')}
            </p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Time</p>
          </div>
        </div>
      </div>

      {wrongs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <XCircle size={15} className="text-red-400" />
            <span className="text-sm font-bold text-slate-700" style={{ fontFamily: 'var(--font-display)' }}>
              Corrections ({wrongs.length})
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {wrongs.map((w, i) => (
              <div key={i} className="px-5 py-3">
                <p className="text-xs text-slate-400 font-medium mb-0.5">{w.question}</p>
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="line-through text-red-400 font-semibold">{w.yourAnswer || '(blank)'}</span>
                  <ArrowLeft size={11} className="text-slate-300 rotate-180" />
                  <span className="text-emerald-600 font-bold" style={{ fontFamily: 'var(--font-display)' }}>
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
          className="flex-1 py-3.5 rounded-2xl border-2 border-indigo-200 text-indigo-700 font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <RotateCcw size={15} /> Retry
        </button>
        <button
          onClick={onExit}
          className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Back to Deck
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
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(deck));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongs, setWrongs] = useState<WrongItem[]>([]);
  const [answers, setAnswers] = useState<{ correct: boolean; yourAnswer: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p className="text-slate-500">This deck has no flashcards for test mode.</p>
          <button onClick={onExit} className="mt-4 text-indigo-600 font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-semibold shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <X size={16} /> Exit
          </button>

          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
              animate={{ width: `${done ? 100 : progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-sm font-bold text-slate-600"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {done ? questions.length : current + 1}/{questions.length}
            </span>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Clock size={13} />
              {mins}:{String(secs).padStart(2, '0')}
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
            />
          ) : (
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="w-full flex flex-col items-center"
            >
              <div className="mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    q?.kind === 'mc' ? 'bg-indigo-100 text-indigo-700' :
                    q?.kind === 'tf' ? 'bg-amber-100 text-amber-700' :
                    'bg-violet-100 text-violet-700'
                  }`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {q?.kind === 'mc' ? 'Multiple Choice' : q?.kind === 'tf' ? 'True / False' : 'Written Answer'}
                </span>
              </div>

              {q?.kind === 'mc' && <MCCard q={q} onAnswer={(ok) => handleAnswer(ok, '')} />}
              {q?.kind === 'tf' && <TFCard q={q} onAnswer={(ok) => handleAnswer(ok, '')} />}
              {q?.kind === 'written' && (
                <WrittenCard
                  q={q}
                  onAnswer={(ok) => handleAnswer(ok, '')}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

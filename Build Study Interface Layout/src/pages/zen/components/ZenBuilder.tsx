import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Leaf, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Deck, FlashcardItem } from '../../../types/DeckType';

const WORLD_ELEMENTS = [
  {
    id: 'grass',
    label: 'Meadow',
    svg: (
      <g>
        <ellipse cx="60" cy="90" rx="55" ry="18" fill="#86efac" opacity="0.7" />
        {[10, 25, 40, 55, 70, 85, 100].map((x) => (
          <rect key={x} x={x} y={70 + Math.sin(x) * 4} width={3} height={20 + Math.sin(x * 2) * 5} rx={1.5} fill="#4ade80" />
        ))}
      </g>
    ),
  },
  {
    id: 'lotus',
    label: 'Lotus',
    svg: (
      <g transform="translate(60,60)">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx={Math.cos((a * Math.PI) / 180) * 18}
            cy={Math.sin((a * Math.PI) / 180) * 18}
            rx="10"
            ry="16"
            fill="#f9a8d4"
            opacity="0.85"
            transform={`rotate(${a})`}
          />
        ))}
        <circle cx={0} cy={0} r={9} fill="#fde68a" />
      </g>
    ),
  },
  {
    id: 'tree',
    label: 'Willow Tree',
    svg: (
      <g>
        <rect x="55" y="52" width="10" height="46" rx="5" fill="#92400e" />
        <ellipse cx="60" cy="42" rx="32" ry="28" fill="#4ade80" opacity="0.85" />
        <ellipse cx="48" cy="50" rx="18" ry="14" fill="#86efac" opacity="0.7" />
        <ellipse cx="72" cy="48" rx="18" ry="14" fill="#86efac" opacity="0.7" />
        {[44, 52, 60, 68, 76].map((x) => (
          <line key={x} x1={x} y1={55} x2={x + (Math.random() > 0.5 ? 4 : -4)} y2={75} stroke="#86efac" strokeWidth="1.5" opacity="0.6" />
        ))}
      </g>
    ),
  },
  {
    id: 'butterfly',
    label: 'Butterfly',
    svg: (
      <g transform="translate(60,50)">
        <ellipse cx="-18" cy="-6" rx="18" ry="12" fill="#c4b5fd" opacity="0.85" transform="rotate(-20)" />
        <ellipse cx="18" cy="-6" rx="18" ry="12" fill="#a78bfa" opacity="0.85" transform="rotate(20)" />
        <ellipse cx="-10" cy="8" rx="10" ry="7" fill="#ddd6fe" opacity="0.7" transform="rotate(15)" />
        <ellipse cx="10" cy="8" rx="10" ry="7" fill="#c4b5fd" opacity="0.7" transform="rotate(-15)" />
        <ellipse cx="0" cy="0" rx="3" ry="10" fill="#1e1b4b" />
        <line x1="-2" y1="-8" x2="-10" y2="-20" stroke="#1e1b4b" strokeWidth="1" />
        <line x1="2" y1="-8" x2="10" y2="-20" stroke="#1e1b4b" strokeWidth="1" />
      </g>
    ),
  },
  {
    id: 'sun',
    label: 'Golden Sun',
    svg: (
      <g transform="translate(65,35)">
        <circle cx="0" cy="0" r="16" fill="#fde68a" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
          <line
            key={a}
            x1={Math.cos((a * Math.PI) / 180) * 19}
            y1={Math.sin((a * Math.PI) / 180) * 19}
            x2={Math.cos((a * Math.PI) / 180) * 26}
            y2={Math.sin((a * Math.PI) / 180) * 26}
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
      </g>
    ),
  },
];

function WorldCanvas({ unlocked }: { unlocked: Set<string> }) {
  return (
    <div
      className="w-full relative rounded-2xl overflow-hidden"
      style={{
        height: '280px',
        background: 'linear-gradient(180deg, #bfdbfe 0%, #dbeafe 35%, #e0f2fe 55%, #d1fae5 80%, #a7f3d0 100%)',
      }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="80" cy="185" rx="120" ry="55" fill="#d1fae5" opacity="0.6" />
        <ellipse cx="230" cy="195" rx="110" ry="50" fill="#a7f3d0" opacity="0.55" />
        <ellipse cx="150" cy="200" rx="160" ry="45" fill="#6ee7b7" opacity="0.5" />

        <rect x="0" y="140" width="300" height="60" fill="url(#mist)" opacity="0.3" />
        <defs>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {WORLD_ELEMENTS.map((el, i) => {
          const positions = [
            { x: 10, y: 90 },
            { x: 90, y: 80 },
            { x: 170, y: 65 },
            { x: 220, y: 85 },
            { x: 40, y: 20 },
          ];
          const pos = positions[i] ?? { x: 50, y: 60 };
          if (!unlocked.has(el.id)) return null;

          return (
            <motion.g
              key={el.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: `${pos.x + 60}px ${pos.y + 60}px` }}
            >
              <g transform={`translate(${pos.x}, ${pos.y})`}>
                {el.svg}
              </g>
            </motion.g>
          );
        })}

        {unlocked.size === 0 && (
          <text x="150" y="120" textAnchor="middle" fill="#a7f3d0" fontSize="11" fontFamily="var(--font-display)">
            Answer correctly to grow your world ✨
          </text>
        )}
      </svg>

      <div className="absolute bottom-3 right-3 flex gap-1.5">
        {WORLD_ELEMENTS.map((el) => (
          <div
            key={el.id}
            title={el.label}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-all duration-300 ${
              unlocked.has(el.id)
                ? 'bg-emerald-400 border-emerald-500 shadow-md'
                : 'bg-white/40 border-white/30 opacity-40'
            }`}
          >
            {el.id === 'grass' ? '🌿' : el.id === 'lotus' ? '🌸' : el.id === 'tree' ? '🌳' : el.id === 'butterfly' ? '🦋' : '☀️'}
          </div>
        ))}
      </div>
    </div>
  );
}

function ZenFlashCard({
  card,
  onCorrect,
}: {
  card: FlashcardItem;
  onCorrect: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleFlip = () => {
    if (!answered) setFlipped((f) => !f);
  };

  const markKnow = () => {
    if (answered) return;
    setAnswered(true);
    onCorrect();
  };

  const markSkip = () => {
    if (answered) return;
    setAnswered(true);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: '1000px', height: '160px' }}
        onClick={handleFlip}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '2px solid #a7f3d0',
            }}
          >
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">English</p>
            <p className="text-2xl font-black text-emerald-900 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              {card.front}
            </p>
            <p className="text-xs text-emerald-400 mt-3">Tap to reveal meaning</p>
          </div>
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
              border: '2px solid #bbf7d0',
            }}
          >
            <p className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-2">Vietnamese</p>
            <p className="text-2xl font-black text-teal-900 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              {card.back}
            </p>
          </div>
        </motion.div>
      </div>

      {flipped && !answered && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <button
            onClick={markSkip}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Still learning
          </button>
          <button
            onClick={markKnow}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200 active:scale-95"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            I knew it! 🌱
          </button>
        </motion.div>
      )}

      {answered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-emerald-600 text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ✨ World element unlocked!
        </motion.div>
      )}
    </div>
  );
}

interface ZenBuilderProps {
  deck: Deck;
  onExit: () => void;
}

export default function ZenBuilder({ deck, onExit }: ZenBuilderProps) {
  const cards = deck.cards.filter((c): c is FlashcardItem => c.type === 'flashcard');
  const [index, setIndex] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [lofi, setLofi] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const elementOrder = WORLD_ELEMENTS.map((e) => e.id);

  const handleCorrect = () => {
    const newCount = completedCount + 1;
    setCompletedCount(newCount);
    const elementIdx = (newCount - 1) % elementOrder.length;
    const elementId = elementOrder[elementIdx]!;
    setUnlocked((prev) => new Set([...prev, elementId]));
  };

  const goNext = () => { if (index < cards.length - 1) setIndex((i) => i + 1); };
  const goPrev = () => { if (index > 0) setIndex((i) => i - 1); };

  const card = cards[index];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%)' }}
    >
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-emerald-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-semibold transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <X size={15} /> Exit
          </button>

          <div className="flex items-center gap-2">
            <Leaf size={14} className="text-emerald-500" />
            <span
              className="text-sm font-black text-emerald-700"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Zen World Builder
            </span>
          </div>

          <button
            onClick={() => setLofi((l) => !l)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              lofi
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {lofi ? <Volume2 size={12} /> : <VolumeX size={12} />}
            Lofi
          </button>
        </div>
      </header>

      <AnimatePresence>
        {lofi && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-50 border-b border-emerald-100 overflow-hidden"
          >
            <p className="text-center text-xs text-emerald-600 font-medium py-2">
              🎵 Imagine lofi beats playing softly in the background...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2
              className="text-xs font-bold text-emerald-600 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your World — {unlocked.size}/{WORLD_ELEMENTS.length} elements
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {completedCount} correct
            </span>
          </div>
          <WorldCanvas unlocked={unlocked} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-emerald-100" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
            Study
          </span>
          <div className="flex-1 h-px bg-emerald-100" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>{index + 1} / {cards.length}</span>
          </div>

          <AnimatePresence mode="wait">
            {card ? (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="w-full flex flex-col items-center"
              >
                <ZenFlashCard card={card} onCorrect={handleCorrect} />
              </motion.div>
            ) : (
              <p className="text-slate-400 text-sm">No flashcards in this deck.</p>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={goNext}
              disabled={index === cards.length - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-200"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

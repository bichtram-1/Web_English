import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import type { DragDropItem, DragDropWord, WordType } from '../../types/DeckType';

const pillColors: Record<WordType, string> = {
  noun: 'bg-blue-100 text-blue-700 border-blue-400',
  verb: 'bg-red-100 text-red-700 border-red-400',
  adjective: 'bg-green-100 text-green-700 border-green-400',
  pronoun: 'bg-gray-100 text-gray-700 border-gray-300',
  other: 'bg-gray-100 text-gray-700 border-gray-300',
};

const pillShadows: Record<WordType, string> = {
  noun: 'shadow-blue-200',
  verb: 'shadow-red-200',
  adjective: 'shadow-green-200',
  pronoun: 'shadow-gray-200',
  other: 'shadow-gray-200',
};

function DraggablePill({ word, disabled }: { word: DragDropWord; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: word.id });
  const colorClass = pillColors[word.type];
  const shadowClass = pillShadows[word.type];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        px-4 py-2 rounded-full border-2 font-semibold text-sm cursor-grab active:cursor-grabbing
        transition-all duration-150 select-none
        ${colorClass} ${shadowClass}
        ${isDragging ? 'opacity-0' : 'opacity-100'}
        ${disabled ? 'pointer-events-none' : 'hover:scale-105 hover:shadow-md'}
        shadow-sm
      `}
      style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600 }}
    >
      {word.word}
    </div>
  );
}

function DropSlot({ index, word, onRemove }: { index: number; word?: DragDropWord; onRemove: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-w-[60px] h-10 rounded-xl border-2 border-dashed flex items-center justify-center
        transition-all duration-150
        ${isOver ? 'border-indigo-400 bg-indigo-50 scale-105' : 'border-slate-300 bg-white/60'}
      `}
      style={{ padding: word ? '0 12px' : '0 8px' }}
    >
      {word ? (
        <button
          onClick={() => onRemove(word.id)}
          className={`px-3 py-1 rounded-full border-2 font-semibold text-sm ${pillColors[word.type]} cursor-pointer hover:opacity-75 transition-opacity`}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {word.word}
        </button>
      ) : (
        <span className="text-slate-300 text-xs">_</span>
      )}
    </div>
  );
}

interface DragDropCardProps {
  card: DragDropItem;
  onCorrect: () => void;
}

export default function DragDropCard({ card, onCorrect }: DragDropCardProps) {
  const [slots, setSlots] = useState<(DragDropWord | null)[]>(new Array(card.correctOrder.length).fill(null));
  const [source, setSource] = useState<DragDropWord[]>([...card.shuffled]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [result, setResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showConfetti, setShowConfetti] = useState(false);
  const [alreadyScored, setAlreadyScored] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const activeWord =
    activeId
      ? source.find((w) => w.id === activeId) ??
        slots.find((s) => s?.id === activeId) ?? null
      : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setResult('idle');
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedId = String(active.id);
      const overId = String(over.id);

      if (!overId.startsWith('slot-')) return;

      const slotIndex = parseInt(overId.replace('slot-', ''), 10);
      const draggedWord =
        source.find((w) => w.id === draggedId) ??
        slots.find((s) => s?.id === draggedId);

      if (!draggedWord) return;

      setSlots((prev) => {
        const next = [...prev];
        const displaced = next[slotIndex];
        if (displaced) {
          setSource((s) => [...s, displaced]);
        }
        next[slotIndex] = draggedWord;
        return next;
      });

      setSource((prev) => prev.filter((w) => w.id !== draggedId));
      setSlots((prev) => prev.map((s) => (s?.id === draggedId && prev.indexOf(s) !== slotIndex ? null : s)));
    },
    [source, slots]
  );

  const removeFromSlot = (wordId: string) => {
    const word = slots.find((s) => s?.id === wordId);
    if (!word) return;
    setSlots((prev) => prev.map((s) => (s?.id === wordId ? null : s)));
    setSource((prev) => [...prev, word]);
    setResult('idle');
  };

  const checkAnswer = () => {
    const placed = slots.map((s) => s?.id ?? '');
    const correct = placed.every((id, i) => id === card.correctOrder[i]);
    setResult(correct ? 'correct' : 'incorrect');
    if (correct && !alreadyScored) {
      setShowConfetti(true);
      setAlreadyScored(true);
      setTimeout(() => {
        setShowConfetti(false);
        onCorrect();
      }, 2500);
    }
  };

  const allPlaced = slots.every((s) => s !== null);

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={typeof window !== 'undefined' ? window.innerWidth : 800}
          height={typeof window !== 'undefined' ? window.innerHeight : 600}
          recycle={false}
          numberOfPieces={320}
          gravity={0.25}
          colors={['#4f46e5', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#ec4899']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="w-full max-w-2xl flex flex-col gap-5">
          {/* Meaning prompt */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Translate to English</p>
            <p className="text-slate-800 text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {card.meaning}
            </p>
          </div>

          {/* Drop zone */}
          <div
            className={`
              rounded-2xl p-4 border-2 transition-all duration-300 min-h-[72px]
              ${result === 'correct' ? 'border-emerald-400 bg-emerald-50' : result === 'incorrect' ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white/80'}
            `}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Drop zone</p>
            <div className="flex flex-wrap gap-2 items-center">
              {slots.map((word, i) => (
                <DropSlot key={i} index={i} word={word ?? undefined} onRemove={removeFromSlot} />
              ))}
            </div>
          </div>

          {/* Result message */}
          <AnimatePresence>
            {result !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm ${
                  result === 'correct'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {result === 'correct' ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                    Correct! 🎉
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    Not quite — try rearranging the words.
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Source zone */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Word bank</p>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {source.map((word) => (
                <DraggablePill key={word.id} word={word} />
              ))}
              {source.length === 0 && (
                <span className="text-slate-300 text-sm italic">All words placed</span>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {(
              [
                ['noun', 'Noun'],
                ['verb', 'Verb'],
                ['adjective', 'Adjective'],
                ['pronoun', 'Pronoun / Other'],
              ] as [WordType, string][]
            ).map(([type, label]) => (
              <span
                key={type}
                className={`px-3 py-1 rounded-full border text-xs font-semibold ${pillColors[type]}`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Check button */}
          <button
            onClick={checkAnswer}
            disabled={!allPlaced || result === 'correct'}
            className={`
              w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200
              ${
                !allPlaced || result === 'correct'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-200'
              }
            `}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            {result === 'correct' ? '✓ Correct!' : 'Check Answer'}
          </button>
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeWord ? (
            <div
              className={`px-4 py-2 rounded-full border-2 font-semibold text-sm shadow-xl rotate-3 ${pillColors[activeWord.type]}`}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              {activeWord.word}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

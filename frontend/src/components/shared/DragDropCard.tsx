import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Volume2, Sparkles, BookOpen, Lightbulb, CheckCircle2, ArrowUpDown } from 'lucide-react';
import { playCorrectSound, playIncorrectSound } from '../../utils/soundEffects';
import type { DragDropItem, DragDropWord, WordType } from '../../types/DeckType';

export interface DragDropCardRef {
  speak: () => void;
  checkAnswer: () => void;
}

const pillColors: Record<WordType, string> = {
  noun: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600',
  verb: 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-400 dark:border-red-600',
  adjective: 'bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 border-green-400 dark:border-green-600',
  pronoun: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-400 dark:border-purple-600',
  other: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600',
};

const pillShadows: Record<WordType, string> = {
  noun: 'shadow-blue-200 dark:shadow-none',
  verb: 'shadow-red-200 dark:shadow-none',
  adjective: 'shadow-green-200 dark:shadow-none',
  pronoun: 'shadow-purple-200 dark:shadow-none',
  other: 'shadow-amber-200 dark:shadow-none',
};

interface DraggableWordPillProps {
  word: DragDropWord;
  disabled?: boolean;
  onClick?: () => void;
  inSlot?: boolean;
  slotIndex?: number;
}

function DraggableWordPill({
  word,
  disabled,
  onClick,
  inSlot = false,
}: DraggableWordPillProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: word.id,
    disabled,
  });

  const colorClass = pillColors[word.type] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600';
  const shadowClass = pillShadows[word.type] || 'shadow-slate-200 dark:shadow-none';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`
        px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 font-semibold text-sm cursor-grab active:cursor-grabbing
        transition-all duration-150 select-none flex items-center gap-1.5
        ${colorClass} ${shadowClass}
        ${isDragging ? 'opacity-20 scale-95' : 'opacity-100'}
        ${disabled ? 'pointer-events-none opacity-60' : 'hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer'}
        shadow-sm
      `}
      style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', fontWeight: 600, whiteSpace: 'nowrap' }}
      title={inSlot ? 'Bấm để gỡ từ · Kéo để đổi vị trí' : 'Bấm để chọn · Kéo vào ô trống'}
    >
      <span>{word.word}</span>
      {inSlot && (
        <span className="text-[10px] opacity-40 hover:opacity-100 transition-opacity">✕</span>
      )}
    </div>
  );
}

function DropSlot({
  index,
  word,
  onRemove,
  disabled,
}: {
  index: number;
  word?: DragDropWord;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[48px] min-w-[70px] rounded-2xl border-2 border-dashed flex items-center justify-center
        transition-all duration-150
        ${
          isOver
            ? 'border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/80 scale-105 shadow-inner'
            : word
            ? 'border-indigo-200/50 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600'
        }
      `}
      style={{ padding: word ? '2px 4px' : '0 12px' }}
    >
      {word ? (
        <DraggableWordPill
          word={word}
          disabled={disabled}
          onClick={() => onRemove(word.id)}
          inSlot={true}
          slotIndex={index}
        />
      ) : (
        <span className="text-slate-300 dark:text-slate-600 text-xs font-mono select-none">_{index + 1}_</span>
      )}
    </div>
  );
}

function WordBankDropZone({
  children,
  isOverBank,
}: {
  children: React.ReactNode;
  isOverBank: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: 'word-bank-zone' });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-wrap gap-2 min-h-[52px] items-center p-2 rounded-2xl border transition-all duration-200 ${
        isOverBank
          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 shadow-inner'
          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
      }`}
    >
      {children}
    </div>
  );
}

interface DragDropCardProps {
  card: DragDropItem;
  onCorrect: () => void;
}

const DragDropCard = forwardRef<DragDropCardRef, DragDropCardProps>(function DragDropCard(
  { card, onCorrect },
  ref
) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<(DragDropWord | null)[]>(new Array(card.correctOrder.length).fill(null));
  const [source, setSource] = useState<DragDropWord[]>([...card.shuffled]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [result, setResult] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showConfetti, setShowConfetti] = useState(false);
  const [alreadyScored, setAlreadyScored] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const targetSentence = card.correctOrder
    .map((id) => card.shuffled.find((w) => w.id === id)?.word || '')
    .filter(Boolean)
    .join(' ');

  const speakSentence = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const activeWord = activeId
    ? (source.find((w) => w.id === activeId) ?? slots.find((s) => s?.id === activeId) ?? null)
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

      const draggedWord =
        source.find((w) => w.id === draggedId) ??
        slots.find((s) => s?.id === draggedId);

      if (!draggedWord) return;

      const originSlotIndex = slots.findIndex((s) => s?.id === draggedId);

      // Case 1: Dropped onto a slot (slot-0, slot-1, ...)
      if (overId.startsWith('slot-')) {
        const targetSlotIndex = parseInt(overId.replace('slot-', ''), 10);

        setSlots((prev) => {
          const next = [...prev];
          const displaced = next[targetSlotIndex];

          if (originSlotIndex !== -1) {
            // Dragged from another slot: swap words between origin and target slots!
            next[originSlotIndex] = displaced ?? null;
            next[targetSlotIndex] = draggedWord;
          } else {
            // Dragged from Word Bank into slot
            if (displaced) {
              setSource((s) => [...s, displaced]);
            }
            next[targetSlotIndex] = draggedWord;
            setSource((s) => s.filter((w) => w.id !== draggedId));
          }
          return next;
        });
        setResult('idle');
      }
      // Case 2: Dropped back into Word Bank zone
      else if (overId === 'word-bank-zone' && originSlotIndex !== -1) {
        setSlots((prev) => {
          const next = [...prev];
          next[originSlotIndex] = null;
          return next;
        });
        setSource((prev) => (prev.some((w) => w.id === draggedWord.id) ? prev : [...prev, draggedWord]));
        setResult('idle');
      }
    },
    [source, slots]
  );

  // Click on a word pill in Word Bank: jumps to first available empty slot
  const handlePillClickFromSource = useCallback(
    (word: DragDropWord) => {
      if (result === 'correct') return;

      setSlots((prev) => {
        const firstEmptyIndex = prev.findIndex((s) => s === null);
        if (firstEmptyIndex === -1) return prev; // All slots filled
        const next = [...prev];
        next[firstEmptyIndex] = word;
        return next;
      });

      setSource((prev) => prev.filter((w) => w.id !== word.id));
      setResult('idle');
    },
    [result]
  );

  // Click on a placed word pill in Drop Zone: returns it to Word Bank
  const removeFromSlot = useCallback((wordId: string) => {
    const word = slots.find((s) => s?.id === wordId);
    if (!word) return;
    setSlots((prev) => prev.map((s) => (s?.id === wordId ? null : s)));
    setSource((prev) => [...prev, word]);
    setResult('idle');
  }, [slots]);

  const checkAnswer = useCallback(() => {
    const placed = slots.map((s) => s?.id ?? '');
    const correct = placed.every((id, i) => id === card.correctOrder[i]);
    setResult(correct ? 'correct' : 'incorrect');
    if (correct) {
      playCorrectSound();
      speakSentence(targetSentence);
      if (!alreadyScored) {
        setShowConfetti(true);
        setAlreadyScored(true);
        setTimeout(() => {
          setShowConfetti(false);
          onCorrect();
        }, 2200);
      }
    } else {
      playIncorrectSound();
    }
  }, [slots, card.correctOrder, alreadyScored, onCorrect, speakSentence, targetSentence]);

  useImperativeHandle(
    ref,
    () => ({
      speak: () => speakSentence(targetSentence),
      checkAnswer: () => checkAnswer(),
    }),
    [speakSentence, targetSentence, checkAnswer]
  );

  const allPlaced = slots.every((s) => s !== null);

  const grammarRuleDisplay = card.grammarRule || 'Cấu trúc câu hoàn chỉnh (Sentence Structure)';
  const grammarExplanationDisplay =
    card.grammarExplanation ||
    card.grammarNote ||
    `Câu hoàn chỉnh: "${targetSentence}" biểu thị nghĩa: "${card.meaning}".`;

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
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {/* Meaning Prompt Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen size={14} /> {t('grammar_drag_title')}
              </span>
              <button
                onClick={() => setShowHint((h) => !h)}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 px-2.5 py-1 rounded-full transition-all cursor-pointer"
              >
                <Lightbulb size={13} />
                {showHint ? t('grammar_hide_hint') : t('grammar_hint_btn')}
              </button>
            </div>
            <p className="text-slate-800 dark:text-slate-100 text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {card.meaning}
            </p>
          </div>

          {/* Grammar Hint Box (Optional reveal before answering) */}
          <AnimatePresence>
            {showHint && result !== 'correct' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-amber-900 dark:text-amber-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lightbulb size={16} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {t('grammar_hint_btn')}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/60 inline-block mb-1.5">
                    {grammarRuleDisplay}
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-200/90 leading-relaxed font-medium">
                    {grammarExplanationDisplay}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drop Zone (Target Construction) */}
          <div
            className={`
              rounded-2xl p-4 border-2 transition-all duration-300 min-h-[82px]
              ${
                result === 'correct'
                  ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-emerald-100 dark:shadow-none shadow-md'
                  : result === 'incorrect'
                  ? 'border-red-300 dark:border-red-700 bg-red-50/70 dark:bg-red-950/40 shadow-red-100 dark:shadow-none shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80'
              }
            `}
          >
            <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowUpDown size={13} className="text-indigo-500" />
                {t('grammar_drop_zone')}
              </p>
              {allPlaced && result === 'idle' && (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                  {t('grammar_all_placed_ready')}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5 items-center min-h-[48px]">
              {slots.map((word, i) => (
                <DropSlot
                  key={i}
                  index={i}
                  word={word ?? undefined}
                  onRemove={removeFromSlot}
                  disabled={result === 'correct'}
                />
              ))}
            </div>
          </div>

          {/* Grammar Spotlight & Result Card */}
          <AnimatePresence>
            {result === 'correct' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 p-5 shadow-lg shadow-emerald-50 dark:shadow-none flex flex-col gap-3"
              >
                {/* Result header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <span>{t('grammar_correct_title')}</span>
                  </div>

                  {/* Audio button */}
                  <button
                    onClick={() => speakSentence(targetSentence)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Volume2 size={14} className={speaking ? 'animate-bounce' : ''} />
                    <span>{speaking ? t('study_audio_playing') : t('grammar_listen_sentence')}</span>
                    <kbd className="px-1 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-800 text-[9px] font-mono ml-0.5">Space</kbd>
                  </button>
                </div>

                {/* English sentence highlight */}
                <div className="bg-emerald-50 dark:bg-emerald-950/60 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-800/80">
                  <p
                    className="text-emerald-950 dark:text-emerald-200 text-xl font-black leading-snug"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {targetSentence}
                  </p>
                </div>

                {/* Grammar Structure formula & explanation */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                    <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                      {t('grammar_structure_title')}
                    </span>
                  </div>

                  {/* Formula banner */}
                  <div className="bg-indigo-600 text-white rounded-lg px-3.5 py-2 font-mono font-bold text-sm shadow-sm inline-block w-fit">
                    {grammarRuleDisplay}
                  </div>

                  {/* Detailed explanation */}
                  <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed mt-1">
                    {grammarExplanationDisplay}
                  </p>
                </div>
              </motion.div>
            )}

            {result === 'incorrect' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  <span>{t('grammar_incorrect_message')}</span>
                </div>
                {!showHint && (
                  <button
                    onClick={() => setShowHint(true)}
                    className="text-xs underline font-bold hover:text-red-900 dark:hover:text-red-200 cursor-pointer"
                  >
                    {t('grammar_view_hint_btn')}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Word Bank (Source Zone) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {t('grammar_word_bank')}
              </p>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {t('grammar_quick_click_hint')}
              </span>
            </div>

            <WordBankDropZone isOverBank={false}>
              {source.map((word) => (
                <DraggableWordPill
                  key={word.id}
                  word={word}
                  disabled={result === 'correct'}
                  onClick={() => handlePillClickFromSource(word)}
                  inSlot={false}
                />
              ))}
              {source.length === 0 && (
                <span className="text-slate-400 dark:text-slate-500 text-xs italic font-medium px-2 py-1">
                  {t('grammar_all_words_placed')}
                </span>
              )}
            </WordBankDropZone>
          </div>

          {/* Word Type Legend */}
          <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['noun', t('word_type_noun')],
                  ['verb', t('word_type_verb')],
                  ['adjective', t('word_type_adj')],
                  ['pronoun', t('word_type_pronoun')],
                  ['other', t('word_type_other')],
                ] as [WordType, string][]
              ).map(([type, label]) => (
                <span
                  key={type}
                  className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${pillColors[type]}`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Check Button */}
          <button
            onClick={checkAnswer}
            disabled={!allPlaced || result === 'correct'}
            className={`
              w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200 cursor-pointer
              ${
                !allPlaced || result === 'correct'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-200 dark:shadow-none'
              }
            `}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            {result === 'correct' ? t('grammar_completed_btn') : t('grammar_check_btn')}
          </button>
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeWord ? (
            <div
              className={`px-4 py-2 rounded-full border-2 font-semibold text-sm shadow-2xl rotate-2 ${pillColors[activeWord.type] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              {activeWord.word}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
});

export default DragDropCard;

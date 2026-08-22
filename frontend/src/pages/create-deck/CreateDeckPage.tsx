import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Trash2, Plus, Save, ArrowLeft, GripVertical, Globe, Lock, BookOpen, GripHorizontal } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { ROUTES } from '../../constants/routers';
import type { Deck, CardItem } from '../../types/DeckType';

type CardType = 'flashcard' | 'drag_drop';

interface CardRow {
  id: number;
  term: string;
  definition: string;
  type: CardType;
}

let nextId = 4;
const emptyCard = (): CardRow => ({ id: nextId++, term: '', definition: '', type: 'flashcard' });

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-250 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  );
}

function CardRowItem({
  card,
  index,
  onChange,
  onRemove,
  removable,
}: {
  card: CardRow;
  index: number;
  onChange: (id: number, field: keyof CardRow, value: string) => void;
  onRemove: (id: number) => void;
  removable: boolean;
}) {
  return (
    <Reorder.Item
      value={card}
      id={String(card.id)}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group"
    >
      {/* Row header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 transition-colors touch-none">
            <GripVertical size={16} />
          </div>
          <span
            className="text-xs font-black text-slate-400 uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={card.type}
            onChange={(e) => onChange(card.id, 'type', e.target.value)}
            className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <option value="flashcard">Standard Flashcard</option>
            <option value="drag_drop">Grammar Drag &amp; Drop</option>
          </select>

          <button
            onClick={() => onRemove(card.id)}
            disabled={!removable}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Remove card"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-50">
        <div className="p-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            Term (English)
          </label>
          <input
            type="text"
            value={card.term}
            onChange={(e) => onChange(card.id, 'term', e.target.value)}
            placeholder="e.g. Developer"
            className="w-full text-sm font-semibold text-slate-800 placeholder-slate-300 outline-none border-b-2 border-transparent focus:border-indigo-400 py-1 transition-colors bg-transparent"
            style={{ fontFamily: 'var(--font-display)' }}
          />
        </div>
        <div className="p-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            Definition (Vietnamese)
          </label>
          <input
            type="text"
            value={card.definition}
            onChange={(e) => onChange(card.id, 'definition', e.target.value)}
            placeholder="e.g. Lập trình viên"
            className="w-full text-sm font-semibold text-slate-800 placeholder-slate-300 outline-none border-b-2 border-transparent focus:border-indigo-400 py-1 transition-colors bg-transparent"
            style={{ fontFamily: 'var(--font-display)' }}
          />
        </div>
      </div>

      <AnimatePresence>
        {card.type === 'drag_drop' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-4 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-2">
              <GripHorizontal size={13} className="text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-500 font-medium leading-relaxed">
                The term will be split into draggable word pills automatically. Make sure it's a full sentence.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

function SaveToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Save size={14} /> Deck saved!
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CreateDeckPage() {
  const navigate = useNavigate();
  const { addDeck } = useDecks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Beginner');
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards] = useState<CardRow[]>([
    { id: 1, term: '', definition: '', type: 'flashcard' },
    { id: 2, term: '', definition: '', type: 'flashcard' },
    { id: 3, term: '', definition: '', type: 'flashcard' },
  ]);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ title?: boolean }>({});

  const addCard = () => setCards((prev) => [...prev, emptyCard()]);

  const removeCard = (id: number) =>
    setCards((prev) => prev.filter((c) => c.id !== id));

  const updateCard = (id: number, field: keyof CardRow, value: string) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const handleSave = async () => {
    if (!title.trim()) {
      setErrors({ title: true });
      document.getElementById('deck-title')?.focus();
      return;
    }
    setErrors({});

    const formattedCards: CardItem[] = cards.map((c, index) => {
      if (c.type === 'drag_drop') {
        const words = c.term.split(' ').map((w, idx) => ({
          id: `w_${c.id}_${idx}`,
          word: w,
          type: 'other' as const,
        }));
        return {
          id: index + 1,
          type: 'drag_drop',
          meaning: c.definition || 'Cụm từ mẫu',
          shuffled: [...words].sort(() => Math.random() - 0.5),
          correctOrder: words.map((w) => w.id),
        };
      }
      return {
        id: index + 1,
        type: 'flashcard',
        front: c.term || 'Sample Word',
        back: c.definition || 'Nghĩa mẫu',
      };
    });

    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title: title.trim(),
      creator: 'User',
      itemCount: formattedCards.length,
      category,
      color: 'from-indigo-500 to-violet-600',
      cards: formattedCards,
    };

    await addDeck(newDeck);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate(ROUTES.HOME);
    }, 1200);
  };

  const filledCards = cards.filter((c) => c.term.trim() || c.definition.trim()).length;

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-indigo-500" />
            <span className="text-sm font-black text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
              Create Deck
            </span>
          </div>

          <span
            className="text-xs font-semibold text-slate-400"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {filledCards}/{cards.length} filled
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-6 flex flex-col gap-6">
        {/* Deck meta */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <div className="p-6 flex flex-col gap-5">
            <div>
              <label
                htmlFor="deck-title"
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Deck Title *
              </label>
              <input
                id="deck-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors({}); }}
                placeholder="e.g. Basic Communication"
                className={`w-full text-2xl font-black text-slate-900 placeholder-slate-200 outline-none border-b-2 pb-1.5 transition-colors bg-transparent ${
                  errors.title ? 'border-red-400' : 'border-slate-100 focus:border-indigo-400'
                }`}
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
              />
              <AnimatePresence>
                {errors.title && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-xs font-semibold mt-1.5"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Please add a title before saving.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will learners gain from this deck?"
                rows={2}
                className="w-full text-sm font-medium text-slate-700 placeholder-slate-300 outline-none border-2 border-slate-100 focus:border-indigo-300 rounded-xl px-3 py-2.5 resize-none transition-colors bg-slate-50/50"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            {/* Category Select */}
            <div>
              <label
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm font-semibold text-slate-700 bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-300"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isPublic ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  {isPublic
                    ? <Globe size={15} className="text-indigo-600" />
                    : <Lock size={15} className="text-slate-500" />
                  }
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700" style={{ fontFamily: 'var(--font-display)' }}>
                    {isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {isPublic ? 'Anyone can find and study this deck' : 'Only you can access this deck'}
                  </p>
                </div>
              </div>
              <Toggle checked={isPublic} onChange={setIsPublic} />
            </div>
          </div>
        </motion.div>

        {/* Cards list */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-black text-slate-700 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Cards
              <span className="ml-2 text-slate-400 font-semibold normal-case tracking-normal text-xs">
                ({cards.length})
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <GripVertical size={11} /> Drag to reorder
            </p>
          </div>

          <Reorder.Group
            axis="y"
            values={cards}
            onReorder={setCards}
            className="flex flex-col gap-3"
            as="div"
          >
            <AnimatePresence initial={false}>
              {cards.map((card, i) => (
                <CardRowItem
                  key={card.id}
                  card={card}
                  index={i}
                  onChange={updateCard}
                  onRemove={removeCard}
                  removable={cards.length > 1}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <motion.button
            layout
            onClick={addCard}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/40 transition-all duration-200 flex items-center justify-center gap-2 font-bold text-sm group"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <div className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={14} className="text-current" />
            </div>
            Add new card
          </motion.button>
        </div>
      </main>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            {cards.length} card{cards.length !== 1 ? 's' : ''} · {isPublic ? 'Public' : 'Private'}
            {title && <span className="text-slate-600"> · "{title}"</span>}
          </div>
          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-95"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Save size={14} /> Save Deck
            </button>
          </div>
        </div>
      </div>

      <SaveToast visible={saved} />
    </div>
  );
}

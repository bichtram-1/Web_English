import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Trash2, Plus, Save, ArrowLeft, GripVertical, Globe, Lock, BookOpen, GripHorizontal } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import { recordCreatedDeck } from '../../utils/recentDecks';
import { ROUTES } from '../../constants/routers';
import type { Deck, CardItem } from '../../types/DeckType';

type CardType = 'flashcard' | 'drag_drop';

interface CardRow {
  id: number;
  term: string;
  definition: string;
  type: CardType;
  grammarRule?: string;
  grammarExplanation?: string;
}

let nextId = 4;
const emptyCard = (): CardRow => ({
  id: nextId++,
  term: '',
  definition: '',
  type: 'flashcard',
  grammarRule: '',
  grammarExplanation: '',
});

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-250 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer ${
        checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
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
  const { t } = useTranslation();

  return (
    <Reorder.Item
      value={card}
      id={String(card.id)}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden group"
    >
      {/* Row header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-400 transition-colors touch-none">
            <GripVertical size={16} />
          </div>
          <span
            className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={card.type}
            onChange={(e) => onChange(card.id, 'type', e.target.value)}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <option value="flashcard">{t('create_deck_type_flashcard')}</option>
            <option value="drag_drop">{t('create_deck_type_grammar')}</option>
          </select>

          <button
            onClick={() => onRemove(card.id)}
            disabled={!removable}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            aria-label="Remove card"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-50 dark:divide-slate-800">
        <div className="p-4">
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            {t('create_deck_term_en')}
          </label>
          <input
            type="text"
            value={card.term}
            onChange={(e) => onChange(card.id, 'term', e.target.value)}
            placeholder={card.type === 'drag_drop' ? 'e.g. She loves learning English' : 'e.g. Developer'}
            className="w-full text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 outline-none border-b-2 border-transparent focus:border-indigo-400 py-1 transition-colors bg-transparent"
            style={{ fontFamily: 'var(--font-display)' }}
          />
        </div>
        <div className="p-4">
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
            {t('create_deck_def_vi')}
          </label>
          <input
            type="text"
            value={card.definition}
            onChange={(e) => onChange(card.id, 'definition', e.target.value)}
            placeholder={card.type === 'drag_drop' ? 'e.g. Cô ấy thích học tiếng Anh' : 'e.g. Lập trình viên'}
            className="w-full text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 outline-none border-b-2 border-transparent focus:border-indigo-400 py-1 transition-colors bg-transparent"
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
            <div className="mx-4 mb-4 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <GripHorizontal size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium leading-relaxed">
                  Câu tiếng Anh sẽ tự động được tách thành các từ kéo-thả. Bạn có thể thêm cấu trúc và giải thích ngữ pháp:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-indigo-100/60 dark:border-indigo-900/40">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">
                    {t('create_deck_grammar_rule')}
                  </label>
                  <input
                    type="text"
                    value={card.grammarRule || ''}
                    onChange={(e) => onChange(card.id, 'grammarRule', e.target.value)}
                    placeholder={t('create_deck_grammar_rule_placeholder')}
                    className="w-full text-xs font-semibold text-indigo-950 dark:text-indigo-100 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">
                    {t('create_deck_grammar_exp')}
                  </label>
                  <input
                    type="text"
                    value={card.grammarExplanation || ''}
                    onChange={(e) => onChange(card.id, 'grammarExplanation', e.target.value)}
                    placeholder={t('create_deck_grammar_exp_placeholder')}
                    className="w-full text-xs font-semibold text-indigo-950 dark:text-indigo-100 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

function SaveToast({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
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
          <Save size={14} /> {t('create_deck_saved_toast')}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CreateDeckPage() {
  const navigate = useNavigate();
  const { addDeck } = useDecks();
  const { user } = useAuth();
  const { t } = useTranslation();
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
        const words = c.term.split(' ').filter(Boolean).map((w, idx) => ({
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
          grammarRule: c.grammarRule?.trim() || undefined,
          grammarExplanation: c.grammarExplanation?.trim() || undefined,
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
      description: description.trim(),
      creator: user ? user.name : 'Người dùng',
      creatorId: user?.id,
      itemCount: formattedCards.length,
      category,
      color: 'from-indigo-500 to-violet-600',
      isPublic,
      cards: formattedCards,
      createdAt: new Date().toISOString(),
    };

    await addDeck(newDeck);
    recordCreatedDeck(newDeck);
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
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-semibold transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={15} /> {t('back')}
          </button>

          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-indigo-500" />
            <span className="text-sm font-black text-slate-800 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {t('create_deck_title')}
            </span>
          </div>

          <span
            className="text-xs font-semibold text-slate-400 dark:text-slate-500"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {filledCards}/{cards.length}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-6 flex flex-col gap-6">
        {/* Deck meta */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <div className="p-6 flex flex-col gap-5">
            <div>
              <label
                htmlFor="deck-title"
                className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('create_deck_field_title')} *
              </label>
              <input
                id="deck-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors({}); }}
                placeholder={t('create_deck_title_placeholder')}
                className={`w-full text-2xl font-black text-slate-900 dark:text-white placeholder-slate-200 dark:placeholder-slate-700 outline-none border-b-2 pb-1.5 transition-colors bg-transparent ${
                  errors.title ? 'border-red-400' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-400'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
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
                    {t('create_deck_field_title')}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label
                className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('create_deck_field_desc')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('create_deck_desc_placeholder')}
                rows={2}
                className="w-full text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 outline-none border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-300 rounded-xl px-3 py-2.5 resize-none transition-colors bg-slate-50/50 dark:bg-slate-800/40"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            {/* Category Select */}
            <div>
              <label
                className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('create_deck_field_category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-300 cursor-pointer"
              >
                <option value="Beginner">{t('category_beginner')} (Beginner)</option>
                <option value="Intermediate">{t('category_intermediate')} (Intermediate)</option>
                <option value="Advanced">{t('category_advanced')} (Advanced)</option>
              </select>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isPublic ? 'bg-indigo-100 dark:bg-indigo-950/80' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {isPublic
                    ? <Globe size={15} className="text-indigo-600 dark:text-indigo-400" />
                    : <Lock size={15} className="text-slate-500" />
                  }
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                    {t('create_deck_field_public')}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {t('create_deck_public_desc')}
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
              className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('create_deck_cards_list')}
              <span className="ml-2 text-slate-400 dark:text-slate-500 font-semibold normal-case tracking-normal text-xs">
                ({cards.length})
              </span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
              <GripVertical size={11} /> Kéo để đổi vị trí
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
            className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all duration-200 flex items-center justify-center gap-2 font-bold text-sm group cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <div className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={14} className="text-current" />
            </div>
            {t('create_deck_add_card')}
          </motion.button>
        </div>
      </main>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
            {cards.length} {t('cards')} · {isPublic ? 'Public' : 'Private'}
            {title && <span className="text-slate-600 dark:text-slate-300"> · "{title}"</span>}
          </div>
          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Save size={14} /> {t('create_deck_save_btn')}
            </button>
          </div>
        </div>
      </div>

      <SaveToast visible={saved} />
    </div>
  );
}

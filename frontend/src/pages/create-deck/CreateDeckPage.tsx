import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Trash2, Plus, Save, ArrowLeft, GripVertical, Globe, Lock, BookOpen, GripHorizontal, Upload, Sparkles, Edit3 } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import { recordCreatedDeck } from '../../utils/recentDecks';
import { ROUTES, getDeckDetailRoute } from '../../constants/routers';
import ImportExportModal from '../../components/general/ImportExportModal';
import VocabAutocompleteInput from '../../components/common/VocabAutocompleteInput';
import { type VocabSuggestion } from '../../data/vocabDictionary';
import { translateSingleWord } from '../../utils/textExtractor';
import { ParsedCard } from '../../utils/deckExportImport';
import type { Deck, CardItem } from '../../types/DeckType';
import deckApi from '../../api/deckApi';
import { canEditDeck } from '../../utils/permission';
import Loading from '../../components/shared/Loading';

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
  onApplySuggestion,
  onRemove,
  removable,
}: {
  card: CardRow;
  index: number;
  onChange: (id: number, field: keyof CardRow, value: string) => void;
  onApplySuggestion: (id: number, suggestion: VocabSuggestion) => void;
  onRemove: (id: number) => void;
  removable: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  return (
    <Reorder.Item
      value={card}
      id={String(card.id)}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-visible group"
    >
      {/* Row header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 rounded-t-2xl">
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

      {/* Inputs with real-time Autocomplete Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-50 dark:divide-slate-800">
        <div className="p-4 relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
              {t('create_deck_term_en')}
            </label>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/60">
              <Sparkles size={10} className="text-amber-500" />
              <span>{isVi ? 'Gợi ý tự động' : 'Auto-suggest'}</span>
            </span>
          </div>

          <VocabAutocompleteInput
            value={card.term}
            onChange={(val) => onChange(card.id, 'term', val)}
            onSelectSuggestion={(sug) => onApplySuggestion(card.id, sug)}
            placeholder={card.type === 'drag_drop' ? 'e.g. She loves learning English' : 'e.g. Developer, Beautiful, Knowledge...'}
            className="w-full text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 outline-none border-b-2 border-transparent focus:border-indigo-400 py-1 transition-colors bg-transparent"
            style={{ fontFamily: 'var(--font-display)' }}
          />
        </div>

        <div className="p-4 relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
              {t('create_deck_def_vi')}
            </label>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {isVi ? 'Tự động điền khi chọn gợi ý' : 'Auto-filled from suggestion'}
            </span>
          </div>

          <input
            type="text"
            value={card.definition}
            onChange={(e) => onChange(card.id, 'definition', e.target.value)}
            placeholder={card.type === 'drag_drop' ? 'e.g. Cô ấy thích học tiếng Anh' : 'e.g. Lập trình viên, Tuyệt đẹp...'}
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

function SaveToast({ visible, message }: { visible: boolean; message?: string }) {
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
          <Save size={14} /> {message || t('create_deck_saved_toast')}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CreateDeckPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { addDeck, updateDeck } = useDecks();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const [isLoadingDeck, setIsLoadingDeck] = useState(isEditMode);
  const [permissionDenied, setPermissionDenied] = useState(false);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: boolean }>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Load existing deck data if in edit mode
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadDeckForEdit = async () => {
      try {
        setIsLoadingDeck(true);
        const fetched = await deckApi.getDeckById(id);
        if (!isMounted) return;

        if (!fetched) {
          alert(isVi ? 'Không tìm thấy bộ thẻ cần chỉnh sửa!' : 'Deck not found!');
          navigate(ROUTES.HOME);
          return;
        }

        // Check edit permission (same as delete: creator or admin)
        if (!canEditDeck(fetched, user)) {
          setPermissionDenied(true);
          return;
        }

        setTitle(fetched.title || '');
        setDescription(fetched.description || '');
        setCategory(fetched.category || 'Beginner');
        setIsPublic(fetched.isPublic !== undefined ? fetched.isPublic : true);

        if (Array.isArray(fetched.cards) && fetched.cards.length > 0) {
          const loadedRows: CardRow[] = fetched.cards.map((c, idx) => {
            if (c.type === 'drag_drop') {
              const sentence = c.shuffled && c.correctOrder
                ? c.correctOrder.map((wid) => c.shuffled.find((s) => s.id === wid)?.word).filter(Boolean).join(' ')
                : (c.meaning || '');
              return {
                id: idx + 1,
                term: sentence,
                definition: c.meaning || '',
                type: 'drag_drop',
                grammarRule: c.grammarRule || '',
                grammarExplanation: c.grammarExplanation || '',
              };
            }
            return {
              id: idx + 1,
              term: c.front || '',
              definition: c.back || '',
              type: 'flashcard',
              grammarRule: '',
              grammarExplanation: '',
            };
          });
          setCards(loadedRows);
          nextId = loadedRows.length + 1;
        }
      } catch (err) {
        console.error('Error loading deck for edit:', err);
      } finally {
        if (isMounted) setIsLoadingDeck(false);
      }
    };

    loadDeckForEdit();

    return () => {
      isMounted = false;
    };
  }, [id, user, isVi, navigate]);

  const handleImportCards = (parsedCards: ParsedCard[], suggestedTitle?: string) => {
    if (suggestedTitle && !title.trim()) {
      setTitle(suggestedTitle);
    }
    const newRows: CardRow[] = parsedCards.map((c) => ({
      id: nextId++,
      term: c.front,
      definition: c.back,
      type: c.type,
      grammarRule: c.grammarRule || '',
      grammarExplanation: c.grammarExplanation || '',
    }));
    setCards(newRows);
  };

  const addCard = () => setCards((prev) => [...prev, emptyCard()]);

  const removeCard = (id: number) =>
    setCards((prev) => prev.filter((c) => c.id !== id));

  const updateCard = (id: number, field: keyof CardRow, value: string) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  const applySuggestion = async (id: number, suggestion: VocabSuggestion) => {
    let finalDef = suggestion.definition || '';
    if (!finalDef || finalDef === 'Gợi ý từ vựng trực tuyến') {
      const translated = await translateSingleWord(suggestion.term);
      if (translated) {
        finalDef = translated;
      }
    }

    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const isGrammar = suggestion.type === 'drag_drop' || !!suggestion.grammarRule;
        return {
          ...c,
          term: suggestion.term,
          definition: finalDef || c.definition,
          type: isGrammar ? 'drag_drop' : c.type,
          grammarRule: suggestion.grammarRule || c.grammarRule || '',
          grammarExplanation: suggestion.grammarExplanation || c.grammarExplanation || '',
        };
      })
    );
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    if (!title.trim()) {
      setErrors({ title: true });
      document.getElementById('deck-title')?.focus();
      return;
    }

    // Filter out cards that are completely empty (user didn't type anything into term or definition)
    const validCards = cards.filter((c) => c.term.trim().length > 0 || c.definition.trim().length > 0);

    if (validCards.length === 0) {
      alert(isVi ? 'Vui lòng nhập nội dung cho ít nhất 1 thẻ từ vựng!' : 'Please enter at least 1 card with content!');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const formattedCards: CardItem[] = validCards.map((c, index) => {
        const cleanTerm = c.term.trim();
        const cleanDef = c.definition.trim();

        if (c.type === 'drag_drop') {
          const rawWords = (cleanTerm || cleanDef).split(/\s+/).filter(Boolean);
          const words = rawWords.map((w, idx) => ({
            id: `w_${index + 1}_${idx}`,
            word: w,
            type: 'other' as const,
          }));
          return {
            id: index + 1,
            type: 'drag_drop',
            meaning: cleanDef || cleanTerm,
            shuffled: [...words].sort(() => Math.random() - 0.5),
            correctOrder: words.map((w) => w.id),
            grammarRule: c.grammarRule?.trim() || undefined,
            grammarExplanation: c.grammarExplanation?.trim() || undefined,
          };
        }
        return {
          id: index + 1,
          type: 'flashcard',
          front: cleanTerm || cleanDef,
          back: cleanDef || cleanTerm,
        };
      });

      if (isEditMode && id) {
        await updateDeck(id, {
          title: title.trim(),
          description: description.trim(),
          category,
          isPublic,
          cards: formattedCards,
          itemCount: formattedCards.length,
        });

        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setIsSubmitting(false);
          navigate(getDeckDetailRoute(id));
        }, 800);
      } else {
        const newDeck: Deck = {
          id: `deck-${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          creator: user ? user.name : (isVi ? 'Người dùng' : 'Learner'),
          creatorId: user?.id,
          itemCount: formattedCards.length,
          category,
          color: 'from-indigo-500 to-violet-600',
          isPublic,
          cards: formattedCards,
          createdAt: new Date().toISOString(),
        };

        const created = await addDeck(newDeck);
        recordCreatedDeck(created || newDeck);
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setIsSubmitting(false);
          navigate(ROUTES.HOME);
        }, 800);
      }
    } catch (e) {
      console.error('Error saving deck:', e);
      setIsSubmitting(false);
    }
  };

  const filledCards = cards.filter((c) => c.term.trim() || c.definition.trim()).length;

  if (isLoadingDeck) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {isVi ? 'Không có quyền chỉnh sửa' : 'Permission Denied'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {isVi
              ? 'Chỉ tác giả sở hữu bộ thẻ mới có quyền chỉnh sửa nội dung (tương tự quyền xóa bộ thẻ).'
              : 'Only the creator of this deck has permission to edit its content.'}
          </p>
          <button
            onClick={() => navigate(id ? getDeckDetailRoute(id) : ROUTES.HOME)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(isEditMode && id ? getDeckDetailRoute(id) : ROUTES.HOME)}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-semibold transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <ArrowLeft size={15} /> {t('back')}
          </button>

          <div className="flex items-center gap-2">
            {isEditMode ? <Edit3 size={15} className="text-amber-500" /> : <BookOpen size={15} className="text-indigo-500" />}
            <span className="text-sm font-black text-slate-800 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {isEditMode ? (isVi ? 'Chỉnh Sửa Bộ Thẻ' : 'Edit Deck') : t('create_deck_title')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-all cursor-pointer shadow-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Upload size={13} />
              <span className="hidden sm:inline">{isVi ? 'Nhập từ File (CSV/JSON)' : 'Import File (CSV/JSON)'}</span>
              <span className="sm:hidden">{isVi ? 'Nhập file' : 'Import'}</span>
            </button>

            <span
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>{filledCards}/{cards.length} {t('cards')}</span>
              {cards.length > filledCards && (
                <span className="text-[11px] text-amber-500 font-semibold hidden sm:inline">
                  ({isVi ? `bỏ ${cards.length - filledCards} thẻ trống` : `ignoring ${cards.length - filledCards} empty`})
                </span>
              )}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">
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
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-semibold text-red-500 mt-1.5"
                  >
                    {t('create_deck_err_title')}
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
                <option value="Beginner">{t('category_beginner')}</option>
                <option value="Intermediate">{t('category_intermediate')}</option>
                <option value="Advanced">{t('category_advanced')}</option>
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
              <GripVertical size={11} /> {isVi ? 'Kéo để đổi vị trí' : 'Drag to reorder'}
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
                  onApplySuggestion={applySuggestion}
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
        <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
            <span className="font-bold text-slate-700 dark:text-slate-200">{filledCards}</span> {t('cards')}
            {cards.length > filledCards && (
              <span className="text-amber-500 font-medium ml-1">
                ({isVi ? `bỏ qua ${cards.length - filledCards} thẻ trống` : `ignoring ${cards.length - filledCards} empty`})
              </span>
            )} · {isPublic ? (isVi ? 'Công khai' : 'Public') : (isVi ? 'Riêng tư' : 'Private')}
            {title && <span className="text-slate-600 dark:text-slate-300"> · "{title}"</span>}
          </div>
          <div className="flex gap-3 ml-auto">
            <button
              onClick={() => navigate(isEditMode && id ? getDeckDetailRoute(id) : ROUTES.HOME)}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>{isSubmitting ? (isEditMode ? (isVi ? 'Đang lưu thay đổi...' : 'Saving Changes...') : (isVi ? 'Đang tạo bộ thẻ...' : 'Creating Deck...')) : ''}</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{isEditMode ? (isVi ? 'Lưu thay đổi' : 'Save Changes') : t('create_deck_save_btn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <SaveToast
        visible={saved}
        message={isEditMode ? (isVi ? 'Đã lưu thay đổi bộ thẻ!' : 'Deck updated successfully!') : undefined}
      />

      {/* Import Modal */}
      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportCards={handleImportCards}
      />
    </div>
  );
}

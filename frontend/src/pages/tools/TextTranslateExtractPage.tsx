import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Volume2,
  Copy,
  Check,
  BookOpen,
  FolderPlus,
  Download,
  Trash2,
  RefreshCw,
  Lightbulb,
  ClipboardPaste,
  Edit3,
  Globe,
  Lock,
  X,
  Info,
  ChevronDown,
} from 'lucide-react';
import useSpeech from '../../hooks/useSpeech';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import {
  translateText,
  extractKeyVocabulary,
  enrichExtractedItemsMeanings,
  detectDeckLevel,
  generateSmartDeckTitle,
  ExtractedVocabItem,
  VocabCategoryType,
} from '../../utils/textExtractor';
import { exportDeckToCsv } from '../../utils/deckExportImport';
import { ROUTES, getDeckDetailRoute } from '../../constants/routers';
import ChickenMascot from '../../components/general/ChickenMascot';
import type { Deck, FlashcardItem } from '../../types/DeckType';

const SAMPLE_TEXTS = [
  {
    title: 'Học Thuật & Đảo Ngữ',
    tag: 'IELTS / Ngữ pháp',
    text: 'Not only does consistent practice help you make progress, but it also allows you to look forward to new academic challenges. If students had taken these methods into account earlier, they would have achieved language fluency much faster. The more you explore, the more confident you will become.',
  },
  {
    title: 'Công Nghệ AI',
    tag: 'Từ vựng B2-C1',
    text: 'Artificial intelligence is an extraordinary breakthrough that will transform human communication and education. Although machine learning algorithms enhance comprehension, humans must continue to make decisions and carry out creative research.',
  },
  {
    title: 'Giao Tiếp Hằng Ngày',
    tag: 'Phrasal Verbs',
    text: 'Active listening facilitates meaningful collaboration and builds strong friendships. When you pay attention to people and get along with others, it is much easier to cope with difficult challenges and succeed.',
  },
];

const DECK_GRADIENTS = [
  { name: 'Indigo / Violet', value: 'from-indigo-600 to-violet-600' },
  { name: 'Blue / Cyan', value: 'from-blue-600 to-cyan-600' },
  { name: 'Emerald / Teal', value: 'from-emerald-600 to-teal-600' },
  { name: 'Rose / Pink', value: 'from-rose-600 to-pink-600' },
  { name: 'Amber / Orange', value: 'from-amber-500 to-orange-600' },
  { name: 'Purple / Fuchsia', value: 'from-purple-600 to-fuchsia-600' },
];

export default function TextTranslateExtractPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { speak } = useSpeech();
  const { addDeck } = useDecks();
  const { user, isAuthenticated } = useAuth();

  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [extractedVocab, setExtractedVocab] = useState<ExtractedVocabItem[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslated, setCopiedTranslated] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editMeaning, setEditMeaning] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | VocabCategoryType>('all');

  // Modal State for Customizing Deck Creation
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckCategory, setDeckCategory] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [deckLevelReason, setDeckLevelReason] = useState('');
  const [deckIsPublic, setDeckIsPublic] = useState(false);
  const [deckColor, setDeckColor] = useState('from-indigo-600 to-violet-600');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isSampleMenuOpen, setIsSampleMenuOpen] = useState(false);

  // Always ensure the page starts completely clean and empty so users can immediately paste their own text
  useEffect(() => {
    setInputText('');
    setTranslatedText('');
    setExtractedVocab([]);
  }, []);

  // Paste text directly from clipboard (only fills input, does not auto-translate)
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(text);
          setTranslatedText('');
          setExtractedVocab([]);
        }
      }
    } catch (e) {
      console.warn('Clipboard read permission denied or unavailable:', e);
    }
  };

  // Trigger translation & extraction only when requested
  const triggerProcess = async (textToProcess: string) => {
    const text = textToProcess.trim();
    if (!text) return;
    setIsTranslating(true);
    try {
      // 1. Extract vocabulary, phrases, and grammar patterns
      const vocabList = extractKeyVocabulary(text);
      setExtractedVocab(vocabList);

      // 2. Translate text
      const viTranslation = await translateText(text);
      setTranslatedText(viTranslation);

      // 3. Background async enrichment for words needing translated meanings
      enrichExtractedItemsMeanings(vocabList, setExtractedVocab);
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleProcessText = () => {
    triggerProcess(inputText);
  };

  const handleToggleSelectVocab = (id: string) => {
    setExtractedVocab((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setExtractedVocab((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Category counts
  const vocabCount = extractedVocab.filter((v) => v.categoryType === 'vocab').length;
  const phraseCount = extractedVocab.filter((v) => v.categoryType === 'phrase').length;
  const grammarCount = extractedVocab.filter((v) => v.categoryType === 'grammar').length;

  const filteredItems = extractedVocab.filter((item) => {
    if (activeCategoryTab === 'all') return true;
    return item.categoryType === activeCategoryTab;
  });

  const selectedItems = extractedVocab.filter((v) => v.selected);
  const selectedCount = selectedItems.length;

  const handleCopyText = (text: string, isOrig: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOrig) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedTranslated(true);
      setTimeout(() => setCopiedTranslated(false), 2000);
    }
  };

  const handleStartEdit = (item: ExtractedVocabItem) => {
    setEditingItemId(item.id);
    setEditMeaning(item.meaning);
  };

  const handleSaveEdit = (id: string) => {
    setExtractedVocab((prev) =>
      prev.map((item) => (item.id === id ? { ...item, meaning: editMeaning } : item))
    );
    setEditingItemId(null);
  };

  // Open Modal to customize Deck title, level, privacy before saving
  const handleOpenCreateDeckModal = () => {
    if (selectedCount === 0) {
      alert(isVi ? 'Vui lòng chọn ít nhất 1 mục để tạo bộ thẻ!' : 'Please select at least 1 item to create deck!');
      return;
    }

    if (!isAuthenticated || !user) {
      const confirmLogin = window.confirm(
        isVi
          ? 'Bạn cần đăng nhập tài khoản để lưu bộ thẻ vào thư viện cá nhân và theo dõi tiến độ học tập. Bạn có muốn chuyển đến trang Đăng nhập ngay bây giờ không?'
          : 'You need to log in to save decks to your library. Would you like to go to the Login page now?'
      );
      if (confirmLogin) {
        navigate(ROUTES.LOGIN, { state: { from: window.location.pathname } });
      }
      return;
    }

    const detected = detectDeckLevel(selectedItems);
    const suggestedTitle = generateSmartDeckTitle(selectedItems, inputText);

    setDeckTitle(suggestedTitle);
    setDeckDescription(
      inputText.trim() ? `Được trích xuất từ đoạn văn: "${inputText.slice(0, 90)}..."` : ''
    );
    setDeckCategory(detected.level);
    setDeckLevelReason(detected.reason);
    setDeckIsPublic(false); // Default to private for security
    setDeckColor('from-indigo-600 to-violet-600');
    setIsCreateDeckModalOpen(true);
  };

  // Confirm creation inside modal (guarded against duplicate clicks)
  const handleConfirmCreateDeck = async () => {
    if (isCreatingDeck) return;
    if (selectedCount === 0 || !deckTitle.trim()) return;

    setIsCreatingDeck(true);
    try {
      const cards: FlashcardItem[] = selectedItems.map((item, idx) => {
        if (item.categoryType === 'grammar') {
          return {
            id: idx + 1,
            type: 'flashcard',
            front: `${item.word}\n\n[Công thức]: ${item.grammarRule || ''}`,
            back: `${item.meaning}\n\n[Giải thích]: ${item.grammarExplanation || ''}`,
            exampleEn: item.contextSentence,
          };
        }
        return {
          id: idx + 1,
          type: 'flashcard',
          front: item.word,
          back: item.meaning,
          exampleEn: item.contextSentence,
        };
      });

      const newDeck: Deck = {
        id: `deck-extract-${Date.now()}`,
        title: deckTitle.trim(),
        description: deckDescription.trim(),
        creator: user ? user.name : 'Người dùng',
        creatorId: user?.id,
        itemCount: cards.length,
        category: deckCategory,
        isPublic: deckIsPublic,
        color: deckColor,
        cards,
      };

      const created = await addDeck(newDeck);
      const targetId = created?.id || newDeck.id;
      setSaveSuccessMsg(
        isVi
          ? `Đã tạo bộ thẻ "${deckTitle}" thành công (${cards.length} thẻ · ${deckIsPublic ? 'Công khai' : 'Riêng tư'})!`
          : `Deck "${deckTitle}" created successfully (${cards.length} cards · ${deckIsPublic ? 'Public' : 'Private'})!`
      );
      setIsCreateDeckModalOpen(false);
      setTimeout(() => {
        navigate(getDeckDetailRoute(targetId));
      }, 1000);
    } catch (err) {
      console.error('Failed to create deck:', err);
      alert(isVi ? 'Có lỗi xảy ra khi tạo bộ thẻ. Vui lòng thử lại!' : 'Failed to create deck.');
    } finally {
      setIsCreatingDeck(false);
    }
  };

  // Export selected cards to CSV
  const handleExportSelectedCsv = () => {
    if (selectedCount === 0) return;

    const tempDeck: Deck = {
      id: 'temp-extract',
      title: 'Extracted_Vocabulary',
      creator: 'User',
      itemCount: selectedCount,
      category: 'Intermediate',
      color: 'from-indigo-600 to-violet-600',
      cards: selectedItems.map((item, idx) => ({
        id: idx + 1,
        type: 'flashcard',
        front: item.categoryType === 'grammar' ? `${item.word} | ${item.grammarRule}` : item.word,
        back: item.meaning,
        exampleEn: item.contextSentence,
      })),
    };
    exportDeckToCsv(tempDeck);
  };

  // Visual POS / Category Badge
  const renderPosBadge = (item: ExtractedVocabItem) => {
    if (item.categoryType === 'grammar') {
      return (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs">
          NGỮ PHÁP
        </span>
      );
    }
    if (item.categoryType === 'phrase') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/40">
          {item.pos === 'idiom' ? 'THÀNH NGỮ' : 'CỤM TỪ'}
        </span>
      );
    }
    switch (item.pos) {
      case 'verb':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
            ĐỘNG TỪ
          </span>
        );
      case 'adjective':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300/40">
            TÍNH TỪ
          </span>
        );
      case 'adverb':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40">
            TRẠNG TỪ
          </span>
        );
      case 'noun':
      default:
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300/40">
            DANH TỪ
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-24">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white py-8 px-4 relative overflow-hidden shadow-lg">
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 text-xs font-bold mb-2">
              <Sparkles size={14} />
              <span>{isVi ? 'NLP & AI Smart Extraction' : 'NLP & AI Smart Extraction'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isVi ? 'Dịch Đoạn Văn & Trích Xuất Toàn Diện' : 'Translate & Extract Learning Items'}
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              {isVi
                ? 'Tự động bóc tách Từ vựng (Động từ, Tính từ, Danh từ), Cụm từ thông dụng & Cấu trúc ngữ pháp đặc biệt để lưu thành Bộ Thẻ chỉ với 1 cú nhấp chuột.'
                : 'Translate English paragraphs, extract key vocabulary with parts of speech, phrasal collocations, and grammar patterns into flashcards.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ChickenMascot size="lg" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast / Save Success Banner */}
        <AnimatePresence>
          {saveSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-md"
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <Check size={18} className="text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
              <button
                onClick={() => setSaveSuccessMsg(null)}
                className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2 Columns Layout: Left = Translator, Right = Extracted Vocabulary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input & Translation (7 cols) */}
          <div className={`lg:col-span-7 space-y-4 ${isSampleMenuOpen ? 'relative z-30' : ''}`}>
            {/* Input Box */}
            <div className={`p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-3 transition-all ${
              isSampleMenuOpen ? 'relative z-40' : 'relative z-10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    {isVi ? 'Văn Bản Tiếng Anh Cần Học' : 'English Text'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">({inputText.length} ký tự)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Sample Snippet Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSampleMenuOpen((prev) => !prev)}
                      title={isVi ? 'Xem và chọn đoạn văn mẫu tham khảo' : 'Try sample paragraphs'}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/70 transition-all text-xs flex items-center gap-1.5 font-bold cursor-pointer shadow-xs"
                    >
                      <Lightbulb size={14} className="text-amber-500" />
                      <span>{isVi ? 'Đoạn mẫu' : 'Samples'}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${isSampleMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Popover / Dropdown Menu */}
                    <AnimatePresence>
                      {isSampleMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] dark:bg-black/25"
                            onClick={() => setIsSampleMenuOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-96 max-w-[420px] z-50 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col gap-2"
                          >
                            <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {isVi ? 'Chọn đoạn mẫu tham khảo' : 'Choose a sample'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                {SAMPLE_TEXTS.length} {isVi ? 'bài' : 'items'}
                              </span>
                            </div>

                            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-0.5">
                              {SAMPLE_TEXTS.map((sample, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setInputText(sample.text);
                                    setTranslatedText('');
                                    setExtractedVocab([]);
                                    setIsSampleMenuOpen(false);
                                  }}
                                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                                    inputText === sample.text
                                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:border-slate-200 dark:hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                      {sample.title}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold shrink-0">
                                      {sample.tag}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {sample.text}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={handlePasteClipboard}
                    title="Dán từ Clipboard"
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 transition-colors text-xs flex items-center gap-1.5 font-bold cursor-pointer shadow-xs"
                  >
                    <ClipboardPaste size={14} />
                    <span>{isVi ? 'Dán từ Clipboard' : 'Paste'}</span>
                  </button>
                  {inputText && (
                    <button
                      onClick={() => {
                        setInputText('');
                        setTranslatedText('');
                        setExtractedVocab([]);
                      }}
                      title={isVi ? 'Xóa nội dung' : 'Clear text'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isVi
                    ? 'Dán hoặc gõ đoạn văn tiếng Anh của bạn vào đây (ví dụ: bài báo, tin tức, tài liệu IELTS, truyện ngắn...)'
                    : 'Paste or write any English text here...'
                }
                rows={5}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-all"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {inputText && (
                    <button
                      onClick={() => speak(inputText)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Volume2 size={14} />
                      <span>{isVi ? 'Nghe phát âm' : 'Listen'}</span>
                    </button>
                  )}
                  {inputText && (
                    <button
                      onClick={() => handleCopyText(inputText, true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {copiedOriginal ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedOriginal ? (isVi ? 'Đã sao chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleProcessText}
                  disabled={!inputText.trim() || isTranslating}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{isVi ? 'Đang phân tích & dịch...' : 'Analyzing & Translating...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>{isVi ? 'Dịch & Trích Xuất Ngay' : 'Translate & Extract'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Translation Output Box */}
            <div className="relative z-0 p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                    {isVi ? 'Bản Dịch Tiếng Việt Tương Ứng' : 'Vietnamese Translation'}
                  </span>
                </div>

                {translatedText && (
                  <button
                    onClick={() => handleCopyText(translatedText, false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedTranslated ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedTranslated ? (isVi ? 'Đã sao chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}</span>
                  </button>
                )}
              </div>

              <div className="min-h-[120px] p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                {isTranslating ? (
                  <div className="h-full flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                    <RefreshCw size={16} className="animate-spin text-indigo-500" />
                    <span>{isVi ? 'Đang dịch văn bản và bóc tách cấu trúc...' : 'Translating and parsing text...'}</span>
                  </div>
                ) : translatedText ? (
                  translatedText
                ) : (
                  <span className="text-slate-400 italic text-xs">
                    {isVi
                      ? 'Bản dịch tiếng Việt sẽ tự động xuất hiện tại đây sau khi bạn bấm nút "Dịch & Trích Xuất Ngay"...'
                      : 'Vietnamese translation will appear here...'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Key Items (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                      {isVi ? 'Nội Dung Học Trọng Tâm' : 'Extracted Learning Items'}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {extractedVocab.length} {isVi ? 'mục' : 'items'} ({selectedCount} {isVi ? 'được chọn' : 'selected'})
                    </span>
                  </div>
                </div>

                {extractedVocab.length > 0 && (
                  <button
                    onClick={() => handleSelectAll(selectedCount !== extractedVocab.length)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {selectedCount === extractedVocab.length
                      ? isVi
                        ? 'Bỏ chọn hết'
                        : 'Deselect all'
                      : isVi
                      ? 'Chọn tất cả'
                      : 'Select all'}
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              {extractedVocab.length > 0 && (
                <div className="flex items-center gap-1.5 p-1 mb-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 overflow-x-auto text-[11px] font-bold">
                  <button
                    onClick={() => setActiveCategoryTab('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      activeCategoryTab === 'all'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {isVi ? 'Tất cả' : 'All'} ({extractedVocab.length})
                  </button>

                  <button
                    onClick={() => setActiveCategoryTab('vocab')}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      activeCategoryTab === 'vocab'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {isVi ? 'Từ vựng' : 'Vocab'} ({vocabCount})
                  </button>

                  <button
                    onClick={() => setActiveCategoryTab('phrase')}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      activeCategoryTab === 'phrase'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {isVi ? 'Cụm từ & Collocation' : 'Phrases'} ({phraseCount})
                  </button>

                  <button
                    onClick={() => setActiveCategoryTab('grammar')}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      activeCategoryTab === 'grammar'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {isVi ? 'Mẫu câu & Ngữ pháp' : 'Grammar'} ({grammarCount})
                  </button>
                </div>
              )}

              {/* Items List */}
              <div className="flex-1 max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
                {extractedVocab.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                    <BookOpen size={32} className="opacity-30 mb-2" />
                    <span>
                      {isVi
                        ? 'Chưa có dữ liệu. Hãy dán đoạn văn tiếng Anh và bấm nút Dịch để trích xuất từ vựng, cụm từ & ngữ pháp!'
                        : 'Paste your paragraph and click Translate to extract words, phrases, and grammar!'}
                    </span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {isVi ? 'Không có mục nào trong danh mục này.' : 'No items found in this category.'}
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all select-none ${
                        item.selected
                          ? item.categoryType === 'grammar'
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-400 shadow-sm'
                            : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          onClick={() => handleToggleSelectVocab(item.id)}
                        >
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer shrink-0"
                          />
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {item.word}
                          </span>
                          {renderPosBadge(item)}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(item)}
                            title="Sửa nghĩa mục này"
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => speak(item.categoryType === 'grammar' ? item.contextSentence : item.word)}
                            title={item.categoryType === 'grammar' ? 'Nghe phát âm câu ví dụ' : 'Phát âm từ này'}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Volume2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Grammar Rule Box if grammar pattern */}
                      {item.categoryType === 'grammar' && item.grammarRule && (
                        <div className="mt-2 pl-6">
                          <div className="px-2.5 py-1.5 rounded-xl bg-indigo-100/70 dark:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800 text-[11px] font-mono text-indigo-900 dark:text-indigo-200">
                            {item.grammarRule}
                          </div>
                        </div>
                      )}

                      {/* Editing or Displaying Meaning */}
                      {editingItemId === item.id ? (
                        <div className="mt-2 pl-6 flex gap-1.5">
                          <input
                            type="text"
                            value={editMeaning}
                            onChange={(e) => setEditMeaning(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-indigo-400 text-slate-800 dark:text-slate-100 outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleToggleSelectVocab(item.id)}
                          className="mt-1 text-xs text-slate-700 dark:text-slate-300 font-medium pl-6 cursor-pointer"
                        >
                          {item.meaning}
                        </div>
                      )}

                      {item.contextSentence && (
                        <div className="mt-1.5 text-[10px] text-slate-400 italic pl-6 border-l-2 border-slate-200 dark:border-slate-700 ml-6 truncate">
                          "{item.contextSentence}"
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons: Save to Deck / Export */}
              {extractedVocab.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    onClick={handleOpenCreateDeckModal}
                    disabled={selectedCount === 0 || isCreatingDeck}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FolderPlus size={15} />
                    <span>
                      {isVi
                        ? `Tạo Bộ Thẻ Mới (${selectedCount} mục đã chọn)`
                        : `Create Deck with ${selectedCount} items`}
                    </span>
                  </button>

                  <button
                    onClick={handleExportSelectedCsv}
                    disabled={selectedCount === 0}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>{isVi ? 'Tải File CSV / Anki' : 'Export CSV'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Customize and Confirm Deck Creation */}
      <AnimatePresence>
        {isCreateDeckModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-slate-800/60 dark:to-slate-900">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                    <FolderPlus size={18} />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
                      {isVi ? 'Tùy Chỉnh & Lưu Bộ Thẻ Mới' : 'Create New Deck'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selectedCount} {isVi ? 'mục đã chọn để tạo flashcard' : 'items selected'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => !isCreatingDeck && setIsCreateDeckModalOpen(false)}
                  disabled={isCreatingDeck}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Deck Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isVi ? 'Tiêu đề bộ thẻ' : 'Deck Title'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    placeholder={isVi ? 'Nhập tên bộ thẻ...' : 'Enter deck title...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isVi ? '💡 Tên gợi ý dựa trên nội dung trọng tâm trích xuất được.' : 'Suggested title based on extracted items.'}
                  </p>
                </div>

                {/* Level / Category with Smart Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isVi ? 'Cấp độ phân loại (Level)' : 'Difficulty Level'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'Beginner', label: 'Cơ bản', sub: 'A1-A2', color: 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40' },
                      { key: 'Intermediate', label: 'Trung cấp', sub: 'B1-B2', color: 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/40' },
                      { key: 'Advanced', label: 'Nâng cao', sub: 'C1-C2', color: 'border-purple-500 text-purple-600 bg-purple-50/50 dark:bg-purple-950/40' },
                    ].map((lvl) => (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setDeckCategory(lvl.key as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          deckCategory === lvl.key
                            ? `${lvl.color} font-bold shadow-xs ring-2 ring-indigo-400/40`
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{lvl.label}</div>
                        <div className="text-[10px] opacity-70">{lvl.sub}</div>
                      </button>
                    ))}
                  </div>
                  {deckLevelReason && (
                    <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-start gap-2 text-[11px] text-indigo-800 dark:text-indigo-300">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <span>{deckLevelReason}</span>
                    </div>
                  )}
                </div>

                {/* Privacy Setting (Public vs Private) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isVi ? 'Chế độ hiển thị (Quyền riêng tư)' : 'Privacy Setting'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeckIsPublic(false)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        !deckIsPublic
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Lock size={16} className="shrink-0 mt-0.5 text-indigo-600" />
                      <div>
                        <div className="text-xs font-bold">{isVi ? 'Riêng tư (Private)' : 'Private'}</div>
                        <div className="text-[10px] opacity-75">{isVi ? 'Chỉ bạn mới có quyền xem & học bộ thẻ này' : 'Only you can see this deck'}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeckIsPublic(true)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        deckIsPublic
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Globe size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold">{isVi ? 'Công khai (Public)' : 'Public'}</div>
                        <div className="text-[10px] opacity-75">{isVi ? 'Chia sẻ lên cộng đồng cho mọi người cùng học' : 'Share with community'}</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Color Theme Gradient */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isVi ? 'Màu sắc chủ đề' : 'Card Color'}
                  </label>
                  <div className="flex items-center gap-2">
                    {DECK_GRADIENTS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setDeckColor(g.value)}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.value} transition-transform cursor-pointer flex items-center justify-center ${
                          deckColor === g.value ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={g.name}
                      >
                        {deckColor === g.value && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isVi ? 'Mô tả ngắn' : 'Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                    placeholder={isVi ? 'Thêm ghi chú hoặc nguồn đoạn văn...' : 'Add description...'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setIsCreateDeckModalOpen(false)}
                  disabled={isCreatingDeck}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isVi ? 'Hủy bỏ' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCreateDeck}
                  disabled={!deckTitle.trim() || isCreatingDeck}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  {isCreatingDeck ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{isVi ? 'Đang tạo bộ thẻ...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{isVi ? 'Xác Nhận Tạo Bộ Thẻ' : 'Confirm & Save Deck'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

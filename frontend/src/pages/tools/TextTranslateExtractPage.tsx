import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Languages,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Plus,
  ArrowRight,
  BookOpen,
  FolderPlus,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  Lightbulb,
  ClipboardPaste,
  Edit3,
} from 'lucide-react';
import useSpeech from '../../hooks/useSpeech';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import { translateText, extractKeyVocabulary, translateSingleWord, ExtractedVocabItem } from '../../utils/textExtractor';
import { exportDeckToCsv } from '../../utils/deckExportImport';
import { ROUTES, getDeckDetailRoute } from '../../constants/routers';
import ChickenMascot from '../../components/general/ChickenMascot';
import type { Deck, FlashcardItem } from '../../types/DeckType';

const SAMPLE_TEXTS = [
  {
    title: 'Công Nghệ AI (Technology)',
    text: 'Artificial intelligence is an extraordinary breakthrough that will transform human communication and education. Machine learning algorithms enhance language learning and comprehension by analyzing individual study patterns.',
  },
  {
    title: 'Học Tập & Hoài Bão (Motivation)',
    text: 'Dedication and consistent practice are essential ingredients for academic achievement and language fluency. When students embrace curiosity and perseverance, they discover infinite potential and overcome every challenge.',
  },
  {
    title: 'Giao Tiếp Hàng Ngày (Everyday)',
    text: 'Active listening facilitates meaningful collaboration and builds strong friendships. Small daily conversations help people comprehend diverse perspectives and improve their confidence.',
  },
];

export default function TextTranslateExtractPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { speak } = useSpeech();
  const { decks, addDeck } = useDecks();
  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [extractedVocab, setExtractedVocab] = useState<ExtractedVocabItem[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslated, setCopiedTranslated] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editMeaning, setEditMeaning] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Paste text directly from clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(text);
          triggerProcess(text);
        }
      }
    } catch (e) {
      console.warn('Clipboard read permission denied or unavailable:', e);
    }
  };

  // Trigger translation & extraction
  const triggerProcess = async (textToProcess: string) => {
    const text = textToProcess.trim();
    if (!text) return;
    setIsTranslating(true);
    try {
      // 1. Extract vocabulary
      const vocabList = extractKeyVocabulary(text);
      setExtractedVocab(vocabList);

      // 2. Translate text
      const viTranslation = await translateText(text);
      setTranslatedText(viTranslation);
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

  const selectedCount = extractedVocab.filter((v) => v.selected).length;

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

  // 1-Click: Create a Brand New Deck with Selected Vocabulary
  const handleCreateNewDeckWithVocab = async () => {
    const selected = extractedVocab.filter((v) => v.selected);
    if (selected.length === 0) return;

    const cards: FlashcardItem[] = selected.map((item, idx) => ({
      id: idx + 1,
      type: 'flashcard',
      front: item.word,
      back: item.meaning,
    }));

    const firstWord = selected[0]?.word || 'Vocabulary';
    const newDeck: Deck = {
      id: `deck-extract-${Date.now()}`,
      title: `Trích xuất: ${firstWord} (${cards.length} từ)`,
      description: `Được tạo tự động từ đoạn văn: "${inputText.slice(0, 80)}..."`,
      creator: user ? user.name : 'Người dùng',
      creatorId: user?.id,
      itemCount: cards.length,
      category: 'Intermediate',
      color: 'from-indigo-600 to-violet-600',
      cards,
    };

    const created = await addDeck(newDeck);
    const targetId = created?.id || newDeck.id;
    setSaveSuccessMsg(isVi ? `Đã tạo bộ thẻ mới thành công với ${cards.length} từ vựng!` : 'New deck created successfully!');
    setTimeout(() => {
      navigate(getDeckDetailRoute(targetId));
    }, 1200);
  };

  // Export selected cards to CSV
  const handleExportSelectedCsv = () => {
    const selected = extractedVocab.filter((v) => v.selected);
    if (selected.length === 0) return;

    const tempDeck: Deck = {
      id: 'temp-extract',
      title: 'Extracted_Vocabulary',
      creator: 'User',
      itemCount: selected.length,
      category: 'Intermediate',
      color: 'from-indigo-600 to-violet-600',
      cards: selected.map((item, idx) => ({
        id: idx + 1,
        type: 'flashcard',
        front: item.word,
        back: item.meaning,
      })),
    };
    exportDeckToCsv(tempDeck);
  };

  return (
    <div className="min-h-screen bg-transparent pb-24">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white py-8 px-4 relative overflow-hidden shadow-lg">
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 text-xs font-bold mb-2">
              <Sparkles size={14} />
              <span>{isVi ? 'Dịch Đoạn Văn & Tạo Bộ Thẻ Thông Minh' : 'Paragraph Translator & Vocab Extractor'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {isVi ? 'Dán Đoạn Văn & Trích Xuất Từ Vựng' : 'Paste Paragraph & Extract Vocabulary'}
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-xl">
              {isVi
                ? 'Dán bất kỳ văn bản tiếng Anh nào bạn muốn học. Hệ thống sẽ tự động dịch nghĩa song ngữ và chọn lọc các từ vựng quan trọng để bạn lưu vào bộ Flashcard.'
                : 'Paste any English text to translate and instantly generate Flashcards with Spaced Repetition.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ChickenMascot size="md" />
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        {/* Sample Templates Bar */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
            <Lightbulb size={13} className="text-amber-500" />
            {isVi ? 'Hoặc thử mẫu:' : 'Or try sample:'}
          </span>
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(sample.text);
                triggerProcess(sample.text);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              {sample.title}
            </button>
          ))}
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {saveSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              <Check size={18} />
              <span>{saveSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Text & Bilingual Translation (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Input Box */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-500" />
                  {isVi ? 'Đoạn Văn Tiếng Anh (Dán Tại Đây)' : 'English Source Text (Paste Here)'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePasteClipboard}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <ClipboardPaste size={13} />
                    <span>{isVi ? 'Dán văn bản' : 'Paste'}</span>
                  </button>

                  {inputText && (
                    <>
                      <button
                        onClick={() => speak(inputText)}
                        title="Nghe đọc toàn bộ đoạn văn"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button
                        onClick={() => handleCopyText(inputText, true)}
                        title="Sao chép văn bản"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {copiedOriginal ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setInputText('');
                          setTranslatedText('');
                          setExtractedVocab([]);
                        }}
                        title="Xóa văn bản"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isVi ? 'Dán hoặc gõ đoạn văn tiếng Anh vào đây (ví dụ: bài báo, đoạn văn luyện thi IELTS/TOEIC, truyện tiếng Anh)...' : 'Paste or type your English paragraph here...'}
                rows={6}
                className="w-full p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all leading-relaxed placeholder:text-slate-400"
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {inputText.trim() ? `${inputText.trim().split(/\s+/).filter(Boolean).length} ${isVi ? 'từ' : 'words'}` : (isVi ? 'Chưa có dữ liệu' : 'Empty')}
                </span>

                <button
                  onClick={handleProcessText}
                  disabled={isTranslating || !inputText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <RefreshCw size={15} className={isTranslating ? 'animate-spin' : ''} />
                  <span>{isTranslating ? (isVi ? 'Đang dịch & phân tích...' : 'Translating...') : (isVi ? 'Dịch & Trích Từ Vựng Ngay' : 'Translate & Extract')}</span>
                </button>
              </div>
            </div>

            {/* Translated Vietnamese Box */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Languages size={14} className="text-emerald-500" />
                  {isVi ? 'Bản Dịch Tiếng Việt Song Ngữ' : 'Vietnamese Meaning'}
                </span>

                {translatedText && (
                  <button
                    onClick={() => handleCopyText(translatedText, false)}
                    title="Sao chép bản dịch"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    {copiedTranslated ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 min-h-[100px] text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                {translatedText || (
                  <span className="text-slate-400 italic text-xs">
                    {isVi
                      ? 'Dán đoạn văn ở trên và bấm "Dịch & Trích Từ Vựng Ngay" để xem bản dịch tiếng Việt tại đây...'
                      : 'Paste text above and click "Translate & Extract" to see bilingual translation...'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Key Vocabulary (5 cols) */}
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
                      {isVi ? 'Từ Vựng Quan Trọng' : 'Key Vocabulary'}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {extractedVocab.length} {isVi ? 'từ trích xuất' : 'extracted'} ({selectedCount} {isVi ? 'được chọn' : 'selected'})
                    </span>
                  </div>
                </div>

                {extractedVocab.length > 0 && (
                  <button
                    onClick={() => handleSelectAll(selectedCount !== extractedVocab.length)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {selectedCount === extractedVocab.length ? (isVi ? 'Bỏ chọn hết' : 'Deselect all') : (isVi ? 'Chọn tất cả' : 'Select all')}
                  </button>
                )}
              </div>

              {/* Vocabulary List */}
              <div className="flex-1 max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                {extractedVocab.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                    <BookOpen size={32} className="opacity-30 mb-2" />
                    <span>{isVi ? 'Chưa có từ vựng nào. Hãy dán đoạn văn tiếng Anh của bạn và bấm Dịch để trích xuất từ vựng!' : 'Paste your paragraph and click Translate to extract words!'}</span>
                  </div>
                ) : (
                  extractedVocab.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all select-none ${
                        item.selected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/60 shadow-sm'
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
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            {item.pos}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(item)}
                            title="Sửa nghĩa từ này"
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => speak(item.word)}
                            title="Phát âm từ này"
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Volume2 size={13} />
                          </button>
                        </div>
                      </div>

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
                            className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold"
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
                    onClick={handleCreateNewDeckWithVocab}
                    disabled={selectedCount === 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FolderPlus size={15} />
                    <span>{isVi ? `Tạo Bộ Thẻ Mới (${selectedCount} từ đã chọn)` : `Create Deck with ${selectedCount} cards`}</span>
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
    </div>
  );
}

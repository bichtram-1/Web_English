import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, FileText, FileSpreadsheet, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { exportDeckToJson, exportDeckToCsv, parseVocabularyFile, ParsedCard } from '../../utils/deckExportImport';
import type { Deck } from '../../types/DeckType';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck?: Deck;
  onImportCards?: (cards: ParsedCard[], suggestedTitle?: string) => void;
}

export default function ImportExportModal({
  isOpen,
  onClose,
  deck,
  onImportCards,
}: ImportExportModalProps) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { isAuthenticated } = useAuth();

  const [mode, setMode] = useState<'export' | 'import'>(deck ? 'export' : 'import');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewCards, setPreviewCards] = useState<ParsedCard[]>([]);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    if (!deck) return;
    exportDeckToJson(deck);
    setSuccessMsg(isVi ? 'Đã tải xuống file JSON thành công!' : 'JSON exported successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleExportCsv = () => {
    if (!deck) return;
    exportDeckToCsv(deck);
    setSuccessMsg(isVi ? 'Đã tải xuống file CSV thành công!' : 'CSV exported successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const result = await parseVocabularyFile(file);
      setPreviewCards(result.cards);
      setPreviewTitle(result.title || '');
      setSuccessMsg(isVi ? `Đã đọc thành công ${result.cards.length} từ vựng!` : `Successfully loaded ${result.cards.length} cards!`);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi đọc file');
      setPreviewCards([]);
    }
  };

  const handleConfirmImport = () => {
    if (previewCards.length === 0) return;
    if (onImportCards) {
      onImportCards(previewCards, previewTitle);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                {mode === 'export' ? <Download size={18} /> : <Upload size={18} />}
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {mode === 'export'
                  ? (isVi ? 'Xuất Dữ Liệu Bộ Thẻ (Export)' : 'Export Deck')
                  : (isVi ? 'Nhập Từ Vựng Từ File (Import)' : 'Import Vocabulary')}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="px-6 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-800">
            {deck && (
              <button
                onClick={() => setMode('export')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  mode === 'export'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Download size={14} />
                <span>{isVi ? 'Tải Về (Export)' : 'Export'}</span>
              </button>
            )}

            <button
              onClick={() => setMode('import')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                mode === 'import'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload size={14} />
              <span>{isVi ? 'Nạp File Vào (Import)' : 'Import'}</span>
            </button>
          </div>

          {/* Feedback messages */}
          {successMsg && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {mode === 'export' && deck && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isVi
                    ? `Bạn đang xuất bộ thẻ "${deck.title}" (${deck.cards.length} từ vựng). Chọn định dạng file tải về:`
                    : `Exporting "${deck.title}" (${deck.cards.length} cards). Select file format:`}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleExportCsv}
                    className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      {isVi ? 'Định dạng CSV / Excel' : 'CSV / Excel format'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isVi ? 'Tương thích Anki, Quizlet, Excel' : 'Compatible with Anki & Quizlet'}
                    </div>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      {isVi ? 'Định dạng JSON Đầy Đủ' : 'Full JSON Backup'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isVi ? 'Bao gồm ngữ pháp & kéo thả' : 'Complete cards & grammar data'}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {mode === 'import' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.json,.txt,.tsv"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl text-center bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/20 cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                    <Upload size={22} />
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white mb-0.5">
                    {isVi ? 'Bấm để chọn file CSV, JSON hoặc TXT' : 'Select a CSV, JSON or TXT file'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {isVi
                      ? 'Hỗ trợ định dạng: Từ - Nghĩa, CSV 2 cột, hoặc file JSON chuẩn'
                      : 'Supports 2-column CSV, JSON and line-by-line format'}
                  </p>
                </div>

                {/* Preview Cards */}
                {previewCards.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span>{isVi ? `Xem trước (${previewCards.length} từ vựng):` : `Preview (${previewCards.length} items):`}</span>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      {previewCards.slice(0, 8).map((card, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700"
                        >
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[45%]">
                            {card.front}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[50%] text-right">
                            {card.back}
                          </span>
                        </div>
                      ))}
                      {previewCards.length > 8 && (
                        <div className="text-center text-[10px] text-slate-400 pt-1">
                          + {previewCards.length - 8} {isVi ? 'từ khác...' : 'more words...'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              {isVi ? 'Đóng' : 'Close'}
            </button>

            {mode === 'import' && previewCards.length > 0 && (
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>{isVi ? `Thêm ${previewCards.length} Thẻ Này` : `Import ${previewCards.length} Cards`}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

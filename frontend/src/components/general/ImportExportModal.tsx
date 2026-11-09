import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, FileText, FileSpreadsheet, Check, X, AlertCircle, Sparkles, Loader2, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  exportDeckToJson,
  exportDeckToCsv,
  exportDeckToDocx,
  parseVocabularyFile,
  ParsedCard,
} from '../../utils/deckExportImport';
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

  const mode: 'export' | 'import' = deck ? 'export' : 'import';
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [previewCards, setPreviewCards] = useState<ParsedCard[]>([]);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processSelectedFile = async (file: File) => {
    if (!file) return;

    if (file.size === 0 && !file.type) {
      setError(isVi ? 'Không thể đọc tệp này (có thể là thư mục hoặc tệp rỗng).' : 'Cannot read this file (might be a folder or empty).');
      return;
    }

    const validExtensions = ['.csv', '.json', '.txt', '.tsv', '.docx', '.doc', '.pdf'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!hasValidExt) {
      setError(
        isVi
          ? 'Định dạng tệp không được hỗ trợ. Vui lòng tải lên file Word (.docx), PDF (.pdf), TXT, CSV hoặc JSON.'
          : 'Unsupported file format. Please upload Word (.docx), PDF (.pdf), TXT, CSV, or JSON.'
      );
      return;
    }

    setError(null);
    setIsProcessing(true);
    setSelectedFileName(file.name);
    setSelectedFileSize(formatFileSize(file.size));

    try {
      const result = await parseVocabularyFile(file);
      setPreviewCards(result.cards);
      setPreviewTitle(result.title || '');
      setSuccessMsg(
        isVi
          ? `Đã nhận diện thành công ${result.cards.length} từ vựng từ "${file.name}"!`
          : `Successfully loaded ${result.cards.length} cards from "${file.name}"!`
      );
    } catch (err: any) {
      setError(err.message || (isVi ? 'Lỗi khi đọc file' : 'Error reading file'));
      setPreviewCards([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processSelectedFile(files[0]!);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileName(null);
    setSelectedFileSize(null);
    setPreviewCards([]);
    setError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const handleExportDocx = async () => {
    if (!deck) return;
    setIsExporting('docx');
    setError(null);
    try {
      await exportDeckToDocx(deck);
      setSuccessMsg(isVi ? 'Đã xuất file Word (.docx) thành công!' : 'Word (.docx) exported successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xuất file Word');
    } finally {
      setIsExporting(null);
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
                  ? (isVi ? 'Tải Về Bộ Thẻ (Export)' : 'Export Deck')
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

          {/* Feedback messages */}
          {successMsg && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="whitespace-pre-line leading-relaxed">{error}</div>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Xuất file Word (.docx) */}
                  <button
                    onClick={handleExportDocx}
                    disabled={!!isExporting}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-pointer disabled:opacity-60"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {isExporting === 'docx' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                        Word (.docx)
                      </span>
                      {isExporting === 'docx' && <span className="text-[10px] text-blue-500 font-medium block">Đang tạo...</span>}
                    </div>
                  </button>

                  {/* Xuất file CSV / Excel */}
                  <button
                    onClick={handleExportCsv}
                    disabled={!!isExporting}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-left group cursor-pointer disabled:opacity-60"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                        CSV / Excel
                      </span>
                    </div>
                  </button>

                  {/* Xuất file JSON */}
                  <button
                    onClick={handleExportJson}
                    disabled={!!isExporting}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-left group cursor-pointer disabled:opacity-60"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Code size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                        JSON (.json)
                      </span>
                    </div>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 leading-relaxed">
                  {isVi
                    ? '💡 Mẹo: File Word (.docx) được thiết kế sẵn bảng đẹp mắt, chuẩn font tiếng Việt; bạn có thể mở trong Word và bấm Ctrl + P để lưu sang PDF nếu cần in ấn.'
                    : '💡 Tip: The Word (.docx) file is styled with clean tables and full Unicode support; you can open it in Word and press Ctrl + P to save as PDF.'}
                </p>
              </div>
            )}

            {mode === 'import' && (
              <div className="space-y-3.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.json,.txt,.tsv,.docx,.doc,.pdf"
                  className="hidden"
                />

                {/* Selected File Badge */}
                {selectedFileName && (
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-white block truncate">
                          {selectedFileName}
                        </span>
                        {selectedFileSize && (
                          <span className="text-[10px] text-slate-400 block">{selectedFileSize}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleClearFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={isVi ? 'Đổi tệp khác' : 'Change file'}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 select-none ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/60 ring-4 ring-indigo-500/20 scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500/70 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/20'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-all duration-200 ${
                      isDragging
                        ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-300 dark:shadow-none'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 size={22} className="animate-spin" />
                    ) : (
                      <Upload size={22} className={isDragging ? 'animate-bounce' : ''} />
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-slate-800 dark:text-white mb-1">
                    {isProcessing
                      ? (isVi ? 'Đang đọc và kiểm duyệt tệp...' : 'Analyzing file...')
                      : isDragging
                      ? (isVi ? 'Thả tệp vào đây để tải lên ngay!' : 'Drop file here to upload!')
                      : (isVi ? 'Bấm để chọn file hoặc kéo thả tệp vào đây' : 'Click to upload or drag and drop')}
                  </h4>

                  <p className="text-[10px] text-slate-400">
                    {isVi
                      ? 'Hỗ trợ: Word (.docx), PDF (.pdf), TXT, CSV, JSON'
                      : 'Supports: Word (.docx), PDF (.pdf), TXT, CSV, JSON'}
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

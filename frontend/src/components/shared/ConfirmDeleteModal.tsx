import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  itemName?: string;
  description?: string;
  isDeleting?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  description,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl overflow-hidden"
        >
          {/* Top Danger Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-inner">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              {itemName && (
                <p className="text-sm font-extrabold text-red-600 dark:text-red-400 mt-0.5 line-clamp-1">
                  "{itemName}"
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            {description ||
              (isVi
                ? 'Hành động này sẽ xóa vĩnh viễn dữ liệu và không thể hoàn tác. Bạn có chắc chắn muốn xóa không?'
                : 'This action will permanently delete this item and cannot be undone. Are you sure?')}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isVi ? 'Hủy bỏ' : 'Cancel'}
            </button>

            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isVi ? 'Đang xóa...' : 'Deleting...'}</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>{isVi ? 'Xác nhận xóa' : 'Confirm Delete'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

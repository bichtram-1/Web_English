import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Trash2, Edit3, BookOpen, Lock, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ItemOptionsMenuProps {
  onStudy?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit: boolean;
  canDelete: boolean;
  creatorName?: string;
  isOwner: boolean;
  darkIcon?: boolean;
}

export default function ItemOptionsMenu({
  onStudy,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  creatorName,
  isOwner,
  darkIcon = false,
}: ItemOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative z-30 inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          darkIcon
            ? 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm'
            : 'bg-black/30 hover:bg-black/50 text-white backdrop-blur-md shadow-sm'
        }`}
        title="Tùy chọn"
        aria-label="Tùy chọn"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden py-1 z-50 backdrop-blur-xl"
          >
            {onStudy && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onStudy();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <BookOpen size={14} className="text-indigo-500" />
                <span>{isVi ? 'Học ngay' : 'Study Now'}</span>
              </button>
            )}

            {onEdit && (
              <button
                disabled={!canEdit}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canEdit) return;
                  setIsOpen(false);
                  onEdit();
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                  canEdit
                    ? 'text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
                title={canEdit ? '' : isVi ? `Chỉ người tạo (${creatorName || 'tác giả'}) mới có quyền chỉnh sửa` : 'Only the creator can edit this'}
              >
                <div className="flex items-center gap-2">
                  <Edit3 size={14} className={canEdit ? 'text-amber-500' : 'text-slate-400'} />
                  <span>{isVi ? 'Chỉnh sửa' : 'Edit'}</span>
                </div>
                {!canEdit && <Lock size={12} className="text-slate-400" />}
              </button>
            )}

            {onDelete && (
              <button
                disabled={!canDelete}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canDelete) return;
                  setIsOpen(false);
                  onDelete();
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                  canDelete
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                }`}
                title={canDelete ? '' : isVi ? `Chỉ người tạo (${creatorName || 'tác giả'}) mới có quyền xóa` : 'Only the creator can delete this'}
              >
                <div className="flex items-center gap-2">
                  <Trash2 size={14} className={canDelete ? 'text-red-500' : 'text-slate-400'} />
                  <span>{isVi ? 'Xóa' : 'Delete'}</span>
                </div>
                {!canDelete && <Lock size={12} className="text-slate-400" />}
              </button>
            )}

            {!isOwner && (
              <div className="px-3.5 py-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] text-slate-400 leading-tight">
                Tạo bởi: <strong className="text-slate-600 dark:text-slate-300">{creatorName || 'LinguaTeam'}</strong>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Lock, Palette, Check, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DeckCollection } from '../../types/DeckType';

export const COLLECTION_GRADIENTS = [
  { name: 'Indigo / Violet', value: 'from-indigo-600 to-violet-600' },
  { name: 'Blue / Cyan', value: 'from-blue-600 to-cyan-600' },
  { name: 'Purple / Pink', value: 'from-purple-600 to-pink-600' },
  { name: 'Emerald / Teal', value: 'from-emerald-600 to-teal-600' },
  { name: 'Amber / Orange', value: 'from-amber-500 to-orange-600' },
  { name: 'Rose / Red', value: 'from-rose-600 to-red-600' },
];

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: DeckCollection | null;
  onSave: (id: string, updates: { title: string; description: string; isPublic: boolean; color: string }) => Promise<void>;
}

export default function EditCollectionModal({
  isOpen,
  onClose,
  collection,
  onSave,
}: EditCollectionModalProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [color, setColor] = useState('from-indigo-600 to-violet-600');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (collection) {
      setTitle(collection.title || '');
      setDescription(collection.description || '');
      setIsPublic(collection.isPublic !== undefined ? collection.isPublic : true);
      setColor(collection.color || 'from-indigo-600 to-violet-600');
    }
  }, [collection, isOpen]);

  if (!isOpen || !collection) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(collection.id, {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        color,
      });
      onClose();
    } catch (err) {
      console.error('Failed to update collection:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3
              className="text-lg font-black text-slate-900 dark:text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {isVi ? 'Chỉnh sửa danh sách bộ thẻ' : 'Edit Deck Collection'}
            </h3>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                {t('collection_name_label')} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('collection_name_placeholder')}
                className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                {t('collection_desc_label')}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('collection_desc_placeholder')}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>

            {/* Privacy Setting Toggle: Public <-> Private */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                {isVi ? 'Quyền riêng tư' : 'Privacy Settings'}
              </label>
              <div
                onClick={() => setIsPublic(!isPublic)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  isPublic
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
                    : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isPublic ? 'bg-indigo-600 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'
                    }`}
                  >
                    {isPublic ? <Globe size={18} /> : <Lock size={18} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {isPublic
                        ? (isVi ? 'Công khai (Public)' : 'Public Collection')
                        : (isVi ? 'Riêng tư (Private)' : 'Private Collection')}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block">
                      {isPublic
                        ? (isVi
                            ? 'Mọi người đều có thể thấy và học danh sách này'
                            : 'Anyone can find and view this collection')
                        : (isVi
                            ? 'Chỉ bạn và thành viên được mời mới có thể xem'
                            : 'Only you and invited members can access')}
                    </span>
                  </div>
                </div>

                <div
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-2 ${
                    isPublic ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <motion.div
                    animate={{ left: isPublic ? '22px' : '2px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Color Theme */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Palette size={12} />
                <span>{isVi ? 'Màu chủ đề' : 'Color Theme'}</span>
              </label>
              <div className="grid grid-cols-6 gap-2">
                {COLLECTION_GRADIENTS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setColor(g.value)}
                    className={`h-8 rounded-xl bg-gradient-to-br ${g.value} flex items-center justify-center transition-all cursor-pointer ${
                      color === g.value ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105' : 'hover:opacity-80'
                    }`}
                    title={g.name}
                  >
                    {color === g.value && <Check size={14} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isVi ? 'Đang lưu...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>{isVi ? 'Lưu thay đổi' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

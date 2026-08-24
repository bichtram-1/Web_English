import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Check, Plus, Lock, Globe, Sparkles } from 'lucide-react';
import { useCollections } from '../../hooks/useCollections';
import { useAuth } from '../../hooks/useAuth';
import type { Deck } from '../../types/DeckType';

interface AddToCollectionModalProps {
  deck: Deck;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToCollectionModal({ deck, isOpen, onClose }: AddToCollectionModalProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { collections, addDeckToCollection, removeDeckFromCollection, createCollection } = useCollections();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleToggleDeckInCollection = async (collectionId: string, isCurrentlyIncluded: boolean) => {
    if (isCurrentlyIncluded) {
      await removeDeckFromCollection(collectionId, deck.id);
      showToast(t('collection_removed_toast'));
    } else {
      await addDeckToCollection(collectionId, deck.id);
      showToast(t('collection_added_toast'));
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await createCollection({
      title: newTitle.trim(),
      description: newDesc.trim(),
      isPublic,
      deckIds: [deck.id],
    });

    if (created) {
      showToast(t('collection_added_toast'));
      setIsCreatingNew(false);
      setNewTitle('');
      setNewDesc('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {t('collection_add_to_collection')}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[240px]">
                    "{deck.title}"
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Toast feedback */}
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center"
              >
                {toastMsg}
              </motion.div>
            )}

            {/* List of existing collections */}
            {!isCreatingNew ? (
              <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t('collection_select_target')}
                </span>

                {collections.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                    {t('collection_empty_desc')}
                  </div>
                ) : (
                  collections.map((col) => {
                    const isIncluded = col.deckIds.includes(deck.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => handleToggleDeckInCollection(col.id, isIncluded)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isIncluded
                            ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{col.title}</span>
                            {col.isPublic ? (
                              <Globe size={11} className="text-slate-400" />
                            ) : (
                              <Lock size={11} className="text-amber-500" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {t('collection_decks_count', { count: col.deckIds.length })}
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isIncluded
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-200 dark:border-slate-700 text-transparent'
                          }`}
                        >
                          <Check size={14} />
                        </div>
                      </button>
                    );
                  })
                )}

                {/* Button to show Create New form */}
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Plus size={14} />
                  <span>{t('collection_create_btn')}</span>
                </button>
              </div>
            ) : (
              /* Inline Create Collection Form */
              <form onSubmit={handleCreateAndAdd} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {t('collection_name_label')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('collection_name_placeholder')}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    {t('collection_desc_label')}
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={t('collection_desc_placeholder')}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                {/* Public / Private toggle (Default Public) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {isPublic ? <Globe size={15} className="text-indigo-600" /> : <Lock size={15} className="text-amber-500" />}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isPublic ? t('collection_public_badge') : t('collection_private_badge')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {isPublic ? 'Chuyển sang Riêng tư' : 'Chuyển sang Công khai'}
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
                  >
                    {t('create')} &amp; Thêm
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

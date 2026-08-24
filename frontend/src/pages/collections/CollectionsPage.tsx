import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  Search,
  Sparkles,
  Zap,
  Globe,
  Lock,
  ChevronRight,
  FolderOpen,
  X,
} from 'lucide-react';
import { useCollections } from '../../hooks/useCollections';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import { getCollectionDetailRoute, getStudyRoute, ROUTES } from '../../constants/routers';
import Loading from '../../components/shared/Loading';
import type { DeckCollection } from '../../types/DeckType';

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { decks } = useDecks();
  const { collections, loading, createCollection } = useCollections();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'my'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(true);

  if (loading) return <Loading />;

  const filtered = collections.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.creator.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

    if (tab === 'my') {
      return matchSearch && user?.id && c.creatorId === user.id;
    }
    return matchSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await createCollection({
      title: newTitle.trim(),
      description: newDesc.trim(),
      isPublic: newIsPublic,
      deckIds: [],
    });

    if (created) {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      navigate(getCollectionDetailRoute(created.id));
    }
  };

  const getCollectionCardCount = (deckIds: string[]) => {
    return decks
      .filter((d) => deckIds.includes(d.id))
      .reduce((sum, d) => sum + (d.cards?.length || d.itemCount || 0), 0);
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto flex flex-col gap-6" style={{ background: 'var(--background)' }}>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-amber-300" size={20} />
              <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider">
                Multi-Deck Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {t('collection_title')}
            </h1>
            <p className="text-indigo-100 text-sm font-medium max-w-xl leading-relaxed">
              {t('collection_subtitle')}
            </p>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate(ROUTES.LOGIN);
                return;
              }
              setIsCreateModalOpen(true);
            }}
            className="px-6 py-3.5 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-black text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Plus size={18} />
            <span>{t('collection_create_btn')}</span>
          </button>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-300 font-medium shadow-xs"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setTab('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('collection_all_public')} ({collections.length})
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setTab('my')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'my'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('collection_my_collections')}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((col, index) => {
          const totalCards = getCollectionCardCount(col.deckIds);
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Banner */}
                <div className={`h-24 bg-gradient-to-r ${col.color || 'from-indigo-600 to-violet-600'} p-4 flex items-start justify-between text-white relative`}>
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <FolderOpen size={20} className="text-white" />
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 ${
                      col.isPublic ? 'bg-white/20 text-white' : 'bg-amber-400/30 text-amber-200 border border-amber-300/40'
                    }`}
                  >
                    {col.isPublic ? <Globe size={11} /> : <Lock size={11} />}
                    <span>{col.isPublic ? t('collection_public_badge') : t('collection_private_badge')}</span>
                  </span>
                </div>

                {/* Body */}
                <div className="p-5">
                  <h3
                    onClick={() => navigate(getCollectionDetailRoute(col.id))}
                    className="text-lg font-black text-slate-900 dark:text-white mb-1.5 leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {col.title}
                  </h3>

                  {col.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                      {col.description}
                    </p>
                  )}

                  <div className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    {t('deck_creator_label')}: <span className="font-bold text-slate-700 dark:text-slate-300">{col.creator}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <Layers size={14} />
                      {t('collection_decks_count', { count: col.deckIds.length })}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Sparkles size={14} />
                      {t('cards_count', { count: totalCards })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={() => navigate(getCollectionDetailRoute(col.id))}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span>Chi tiết</span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => navigate(getStudyRoute(col.id))}
                  disabled={totalCards === 0}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Zap size={14} className="text-amber-400" />
                  <span>Ôn tập ngay</span>
                </button>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3">
            <FolderOpen size={44} className="opacity-30" />
            <p className="font-bold text-base text-slate-700 dark:text-slate-300">{t('collection_empty')}</p>
            <p className="text-xs max-w-sm">{t('collection_empty_desc')}</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
            >
              {t('collection_create_btn')}
            </button>
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('collection_create_btn')}
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('collection_name_label')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('collection_name_placeholder')}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('collection_desc_label')}
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={t('collection_desc_placeholder')}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />
                </div>

                {/* Public / Private Option (Default Public) */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {newIsPublic ? (
                      <Globe size={16} className="text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Lock size={16} className="text-amber-500" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                        {newIsPublic ? t('collection_public_badge') : t('collection_private_badge')}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {newIsPublic
                          ? 'Mọi người sẽ thấy danh sách và tên của bạn'
                          : 'Chỉ bạn mới có thể thấy danh sách này'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewIsPublic(!newIsPublic)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {newIsPublic ? 'Đổi sang Riêng tư' : 'Đổi sang Công khai'}
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer"
                  >
                    {t('create')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

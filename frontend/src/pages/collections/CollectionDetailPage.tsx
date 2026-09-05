import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Zap,
  PenLine,
  Plus,
  Trash2,
  Globe,
  Lock,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  X,
  UserPlus,
  Users,
  Shield,
  PenTool,
} from 'lucide-react';
import { useCollections } from '../../hooks/useCollections';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import { getRecentViewedDecks, getRecentCreatedDecks } from '../../utils/recentDecks';
import collectionApi from '../../api/collectionApi';
import { getDeckDetailRoute, getStudyRoute, getWrittenRoute, ROUTES } from '../../constants/routers';
import Loading from '../../components/shared/Loading';
import InviteCollaboratorModal from '../../components/shared/InviteCollaboratorModal';
import ItemOptionsMenu from '../../components/shared/ItemOptionsMenu';
import ConfirmDeleteModal from '../../components/shared/ConfirmDeleteModal';
import { isCollectionCreator, canEditCollection, canViewCollection } from '../../utils/permission';
import type { Deck, DeckCollection, CollaboratorRole } from '../../types/DeckType';

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { user, isAuthenticated } = useAuth();
  const { decks } = useDecks();
  const { addDeckToCollection, removeDeckFromCollection, deleteCollection } = useCollections();

  const [collection, setCollection] = useState<DeckCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const fetchCollection = async () => {
    if (!id) return;
    setLoading(true);
    const data = await collectionApi.getCollectionById(id);
    setCollection(data || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollection();
  }, [id]);

  // Handle URL join invitation: ?join=true&role=editor
  useEffect(() => {
    if (!collection || !isAuthenticated || !user) return;
    if (searchParams.get('join') === 'true') {
      const inviteRole = (searchParams.get('role') as CollaboratorRole) || 'viewer';
      collectionApi
        .inviteCollaborator(collection.id, {
          email: user.email,
          name: user.name,
          role: inviteRole,
          userId: user.id,
        })
        .then((updated) => {
          if (updated) {
            setCollection(updated);
            showToast(t('invite_joined_toast'));
          }
          // Remove query params from url
          setSearchParams({});
        });
    }
  }, [collection?.id, isAuthenticated, user]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Permissions calculation
  const isOwner = isCollectionCreator(collection, user);
  const isEditor = Boolean(
    collection?.collaborators?.some(
      (c) =>
        (c.userId === user?.id || (user?.email && c.email.toLowerCase() === user.email.toLowerCase())) &&
        c.role === 'editor'
    )
  );
  const isViewer = Boolean(
    collection?.collaborators?.some(
      (c) =>
        (c.userId === user?.id || (user?.email && c.email.toLowerCase() === user.email.toLowerCase())) &&
        c.role === 'viewer'
    )
  );
  const canEdit = canEditCollection(collection, user);

  // Included decks details
  const includedDecks = useMemo(() => {
    if (!collection) return [];
    return decks.filter((d) => collection.deckIds.includes(d.id));
  }, [collection, decks]);

  // Total cards combined across all decks in this collection
  const totalCards = useMemo(() => {
    return includedDecks.reduce((sum, d) => sum + (d.cards?.length || d.itemCount || 0), 0);
  }, [includedDecks]);

  // Recent decks (viewed and created) for quick 1-click addition
  const recentViewed = useMemo(() => getRecentViewedDecks(), []);
  const recentCreated = useMemo(() => getRecentCreatedDecks(), []);

  // Quick suggestion items that are not yet added to this collection
  const quickSuggestions = useMemo(() => {
    if (!collection) return [];
    const combined = [...recentCreated, ...recentViewed];
    const uniqueIds = new Set<string>();
    const filtered: typeof combined = [];

    combined.forEach((item) => {
      if (!uniqueIds.has(item.id) && !collection.deckIds.includes(item.id)) {
        uniqueIds.add(item.id);
        filtered.push(item);
      }
    });
    return filtered.slice(0, 6);
  }, [collection, recentCreated, recentViewed]);

  // Available decks for search in Add Modal
  const searchResults = useMemo(() => {
    if (!collection) return [];
    const q = searchQuery.toLowerCase().trim();
    return decks.filter(
      (d) =>
        !collection.deckIds.includes(d.id) &&
        (d.title.toLowerCase().includes(q) || d.creator.toLowerCase().includes(q))
    );
  }, [collection, decks, searchQuery]);

  const handleAddDeck = async (deckId: string) => {
    if (!collection || !canEdit) return;
    const updated = await addDeckToCollection(collection.id, deckId);
    if (updated) {
      setCollection(updated);
      showToast(t('collection_added_toast'));
    }
  };

  const handleRemoveDeck = async (deckId: string) => {
    if (!collection || !canEdit) return;
    const updated = await removeDeckFromCollection(collection.id, deckId);
    if (updated) {
      setCollection(updated);
      showToast(t('collection_removed_toast'));
    }
  };

  const handleDeleteCollection = async () => {
    if (!collection || !isCollectionCreator(collection, user)) return;
    setIsDeleting(true);
    try {
      await deleteCollection(collection.id);
      setIsDeleteModalOpen(false);
      navigate(ROUTES.COLLECTIONS);
    } catch (e) {
      console.error('Error deleting collection:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Loading />;

  if (!collection || !canViewCollection(collection, user)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {collection && collection.isPublic === false ? (isVi ? 'Bộ Sưu Tập Riêng Tư' : 'Private Collection') : (isVi ? 'Không tìm thấy bộ sưu tập' : 'Collection not found')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {collection && collection.isPublic === false
              ? (isVi
                  ? 'Bộ sưu tập này được thiết lập ở chế độ Riêng tư (Private). Chỉ tác giả hoặc thành viên được mời mới có quyền xem.'
                  : 'This collection is private. Only the creator and invited members have permission to view it.')
              : (isVi ? 'Bộ sưu tập không tồn tại hoặc đã bị xóa.' : 'Collection not found or has been deleted.')}
          </p>
          <button
            onClick={() => navigate(ROUTES.COLLECTIONS)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            {isVi ? 'Về Danh Sách Bộ Sưu Tập' : 'Back to Collections'}
          </button>
        </div>
      </div>
    );
  }

  const collaborators = collection.collaborators || [];

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto flex flex-col gap-6 bg-transparent">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white shadow-2xl text-xs sm:text-sm font-bold border border-slate-700 flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.COLLECTIONS)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <ArrowLeft size={16} /> {t('collection_title')}
        </button>

        <div className="flex items-center gap-2">
          {/* Permission / Status Badge */}
          {isOwner ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
              <Shield size={12} />
              <span>{t('invite_author_badge')}</span>
            </span>
          ) : isEditor ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <PenTool size={12} />
              <span>{t('invite_can_edit_badge')}</span>
            </span>
          ) : isViewer ? (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
              <Users size={12} />
              <span>{t('invite_readonly_badge')}</span>
            </span>
          ) : null}

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${
              collection.isPublic
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                : 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}
          >
            {collection.isPublic ? <Globe size={13} /> : <Lock size={13} />}
            <span>{collection.isPublic ? t('collection_public_badge') : t('collection_private_badge')}</span>
          </span>

          {/* 3-dots Menu with permission check */}
          <ItemOptionsMenu
            darkIcon
            onDelete={() => setIsDeleteModalOpen(true)}
            canEdit={canEditCollection(collection, user)}
            canDelete={isCollectionCreator(collection, user)}
            creatorName={collection.creator}
            isOwner={isCollectionCreator(collection, user)}
          />
        </div>
      </div>

      {/* Collection Hero Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                {t('deck_creator_label')}: {collection.creator}
              </span>

              {collaborators.length > 0 && (
                <span className="text-xs font-bold text-amber-200 bg-amber-500/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 border border-amber-300/30">
                  <Users size={12} />
                  <span>+{collaborators.length} bạn bè cùng học</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {collection.title}
            </h1>
            {collection.description && (
              <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-4">
                {collection.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs font-bold text-indigo-200 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Layers size={15} />
                {t('collection_decks_count', { count: collection.deckIds.length })}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber-300" />
                {t('cards_count', { count: totalCards })}
              </span>
            </div>
          </div>

          {/* Quick Study Action & Invite Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => navigate(getStudyRoute(collection.id))}
              disabled={totalCards === 0}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-black text-sm shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Zap size={16} className="text-amber-500" />
              <span>{t('collection_study_all_btn', { count: totalCards })}</span>
            </button>

            <button
              onClick={() => navigate(getWrittenRoute(collection.id))}
              disabled={totalCards === 0}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-sm backdrop-blur-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/30"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <PenLine size={16} />
              <span>{t('collection_written_all_btn', { count: totalCards })}</span>
            </button>

            {/* Invite Collaborator Button */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate(ROUTES.LOGIN);
                  return;
                }
                setIsInviteModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-bold text-xs backdrop-blur-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/40"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <UserPlus size={15} className="text-amber-300" />
              <span>{t('invite_collaborator_btn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick suggestions strip: Recently viewed / created decks (Only if canEdit) */}
      {canEdit && quickSuggestions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                {t('collection_quick_suggestions')}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold hidden sm:inline">
              {isVi ? 'Nhấp dấu cộng để thêm ngay vào danh sách' : 'Click plus to add to collection'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {quickSuggestions.map((deckItem) => (
              <div
                key={deckItem.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={deckItem.title}>
                    {deckItem.title}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <span>{deckItem.creator}</span>
                    <span>·</span>
                    <span>{deckItem.itemCount} {isVi ? 'thẻ' : 'cards'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddDeck(deckItem.id)}
                  title={isVi ? 'Thêm vào danh sách' : 'Add to collection'}
                  className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Included Decks List Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Layers size={20} className="text-indigo-600 dark:text-indigo-400" />
            <span>{isVi ? 'Các bộ thẻ trong danh sách' : 'Decks in Collection'}</span>
            <span className="text-xs text-slate-400 font-semibold">({includedDecks.length})</span>
          </h2>

          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none active:scale-95 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Plus size={15} />
              <span>{t('collection_add_deck_btn')}</span>
            </button>
          )}
        </div>

        {includedDecks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center gap-3">
            <BookOpen size={40} className="text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {isVi ? 'Danh sách này hiện chưa có bộ thẻ nào.' : 'This collection currently has no decks.'}
            </p>
            {canEdit && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
              >
                {t('collection_add_deck_btn')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {includedDecks.map((deck) => (
              <div
                key={deck.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                      {deck.category}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveDeck(deck.id)}
                        title={isVi ? 'Gỡ khỏi danh sách' : 'Remove from collection'}
                        className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <h3
                    onClick={() => navigate(getDeckDetailRoute(deck.id))}
                    className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {deck.title}
                  </h3>

                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {t('deck_creator_label')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{deck.creator}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">
                    {t('cards_count', { count: deck.cards?.length || deck.itemCount })}
                  </span>
                  <button
                    onClick={() => navigate(getStudyRoute(deck.id))}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {isVi ? 'Học riêng bộ này →' : 'Study this deck →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Deck Search Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('collection_add_deck_btn')}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('collection_search_decks')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                />
              </div>

              {/* Search results list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                {searchResults.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                    Không còn bộ thẻ nào phù hợp hoặc tất cả đã được thêm.
                  </div>
                ) : (
                  searchResults.map((deck) => (
                    <div
                      key={deck.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {deck.title}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <span>{deck.creator}</span>
                          <span>·</span>
                          <span>{deck.category}</span>
                          <span>·</span>
                          <span>{deck.itemCount} thẻ</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddDeck(deck.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        <Plus size={13} />
                        <span>Thêm</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Collaborator Modal */}
      <InviteCollaboratorModal
        collection={collection}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onUpdateCollection={(updated) => setCollection(updated)}
      />

      {/* Delete Collection Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCollection}
        title={isVi ? 'Xóa danh sách bộ thẻ' : 'Delete Deck Collection'}
        itemName={collection.title}
        description={
          isVi
            ? `Bạn có chắc chắn muốn xóa danh sách bộ thẻ "${collection.title}"? Các bộ thẻ con bên trong vẫn được giữ nguyên.`
            : `Are you sure you want to permanently delete the collection "${collection.title}"?`
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}

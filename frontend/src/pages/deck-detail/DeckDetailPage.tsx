import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Gamepad2,
  Leaf,
  PenLine,
  Users,
  Sparkles,
  ChevronRight,
  FolderPlus,
  Globe,
  Lock,
  Crown,
  Download,
  Star,
  Brain,
  Volume2,
  Layers,
  Search,
  Copy,
} from 'lucide-react';

import deckApi, { getStoredDecks } from '../../api/deckApi';
import { getClonedDeckTitle } from '../../utils/cloneTitle';
import { recordViewedDeck } from '../../utils/recentDecks';
import { useAuth } from '../../hooks/useAuth';
import { cleanTtsText } from '../../hooks/useSpeech';
import Loading from '../../components/shared/Loading';
import AddToCollectionModal from '../../components/shared/AddToCollectionModal';
import ImportExportModal from '../../components/general/ImportExportModal';
import ItemOptionsMenu from '../../components/shared/ItemOptionsMenu';
import ConfirmDeleteModal from '../../components/shared/ConfirmDeleteModal';
import DeckRatingStars from '../../components/shared/DeckRatingStars';
import { isDeckCreator, canEditDeck, canViewDeck } from '../../utils/permission';
import { generateFriendlyId } from '../../utils/slugify';
import { getCategoryLabel } from '../home/HomePage';
import { useStarredCards } from '../../utils/starredCards';
import { getDeckSRSStats } from '../../utils/sm2';

import {
  ROUTES,
  getCollectionDetailRoute,
  getEditDeckRoute,
  getStudyRoute,
  getTestRoute,
  getMinigameRoute,
  getZenRoute,
  getWrittenRoute,
  getMatchRoute,
  getTreasureRoute,
} from '../../constants/routers';
import type { Deck } from '../../types/DeckType';
import type { StudyMode } from '../../types/deck.types';

export default function DeckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [cardSearch, setCardSearch] = useState('');

  const handleToggleDeckPrivacy = async () => {
    if (!deck || isUpdatingPrivacy) return;
    const targetPrivacy = !isPublic;
    const confirmMsg = targetPrivacy
      ? (isVi ? 'Bạn có muốn chuyển bộ thẻ này sang CÔNG KHAI (mọi người đều có thể học)?' : 'Switch this deck to PUBLIC?')
      : (isVi ? 'Bạn có muốn chuyển bộ thẻ này sang RIÊNG TƯ (chỉ bạn và người được mời mới có thể xem)?' : 'Switch this deck to PRIVATE?');
    if (!window.confirm(confirmMsg)) return;

    setIsUpdatingPrivacy(true);
    try {
      const updated = await deckApi.updateDeck(deck.id, { isPublic: targetPrivacy });
      if (updated) {
        setDeck({ ...deck, ...updated, isPublic: targetPrivacy });
      }
    } catch (e) {
      console.error('Failed to update deck privacy:', e);
      alert(isVi ? 'Không thể đổi quyền riêng tư bộ thẻ. Vui lòng thử lại!' : 'Failed to update deck privacy.');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const targetDeckId = id || '';
  const { starredIds, starredCount, isStarred, toggleStar, starAll, unstarAll } = useStarredCards(targetDeckId);
  const [starredOnlyFilter, setStarredOnlyFilter] = useState(false);

  const srsStats = useMemo(() => {
    if (!deck) return { totalCards: 0, dueTodayCount: 0, newCardsCount: 0, learningCount: 0, masteredCount: 0 };
    const cardIds = deck.cards.filter((c) => c.type === 'flashcard').map((c) => c.id);
    return getDeckSRSStats(deck.id, cardIds);
  }, [deck]);

  const speakWord = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleaned = cleanTtsText(text);
    if (!cleaned) return;
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleCloneDeck = async () => {
    if (!isAuthenticated || !user) {
      navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
      return;
    }
    if (!deck) return;

    setIsCloning(true);
    try {
      const storedDecks = getStoredDecks();
      const existingTitles = storedDecks.map((d) => d.title);
      const clonedTitle = getClonedDeckTitle(deck.title, existingTitles, isVi);
      const clonedDeck = await deckApi.createDeck({
        id: generateFriendlyId(clonedTitle),
        title: clonedTitle,
        description: deck.description || '',
        creator: user.name || (user.email ? user.email.split('@')[0] : 'User'),
        creatorId: user.id,
        category: deck.category || 'Beginner',
        color: deck.color || 'from-indigo-500 to-violet-600',
        isPublic: false,
        cards: deck.cards || [],
      });
      if (clonedDeck?.id) {
        navigate(getEditDeckRoute(clonedDeck.id));
      }
    } catch (e) {
      console.error('Failed to clone deck:', e);
      alert(isVi ? 'Không thể sao chép bộ thẻ. Vui lòng thử lại!' : 'Failed to clone deck. Please try again!');
    } finally {
      setIsCloning(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (!deck) return;
    setIsDeleting(true);
    try {
      await deckApi.deleteDeck(deck.id);
      setIsDeleteModalOpen(false);
      navigate(ROUTES.HOME);
    } catch (e) {
      console.error('Error deleting deck:', e);
    } finally {
      setIsDeleting(false);
    }
  };


  useEffect(() => {
    if (!id) return;
    if (id.startsWith('col-')) {
      navigate(getCollectionDetailRoute(id), { replace: true });
      return;
    }
    setLoading(true);
    deckApi.getDeckById(id).then((data) => {
      setDeck(data || null);
      if (data) {
        recordViewedDeck(data);
      }
      setLoading(false);
    });
  }, [id, navigate]);

  if (loading) return <Loading />;

  if (!deck || !canViewDeck(deck, user)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {deck && deck.isPublic === false ? (isVi ? 'Bộ Thẻ Riêng Tư' : 'Private Deck') : t('not_found')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {deck && deck.isPublic === false
              ? (isVi
                  ? 'Bộ thẻ này được thiết lập ở chế độ Riêng tư (Private). Chỉ tác giả sở hữu hoặc thành viên được mời mới có quyền xem và học.'
                  : 'This deck is private. Only the creator and invited members have permission to view and study it.')
              : (isVi ? 'Không tìm thấy bộ thẻ hoặc bộ thẻ đã bị xóa.' : 'Deck not found or has been deleted.')}
          </p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            {t('go_home')}
          </button>
        </div>
      </div>
    );
  }

  const modes = [
    {
      mode: 'flashcard' as StudyMode,
      label: t('deck_flashcard_label'),
      sublabel: t('deck_flashcard_sublabel'),
      icon: <BookOpen size={24} />,
      gradient: 'from-indigo-500 to-violet-600',
      tag: isVi ? 'Thẻ nhớ' : 'Flashcard',
    },
    {
      mode: 'treasure' as StudyMode,
      label: t('deck_treasure_label'),
      sublabel: t('deck_treasure_sublabel'),
      icon: <Crown size={24} />,
      gradient: 'from-amber-500 to-orange-500',
      tag: isVi ? 'Thám hiểm' : 'Adventure',
    },
    {
      mode: 'match' as StudyMode,
      label: t('deck_match_label'),
      sublabel: t('deck_match_sublabel'),
      icon: <Sparkles size={24} />,
      gradient: 'from-indigo-600 to-purple-600',
      tag: isVi ? 'Trí nhớ' : 'Memory',
    },
    {
      mode: 'test' as StudyMode,
      label: t('deck_test_label'),
      sublabel: t('deck_test_sublabel'),
      icon: <ClipboardList size={24} />,
      gradient: 'from-rose-500 to-orange-500',
      tag: isVi ? 'Trắc nghiệm' : 'Quiz',
    },
    {
      mode: 'minigame' as StudyMode,
      label: t('deck_minigame_label'),
      sublabel: t('deck_minigame_sublabel'),
      icon: <Gamepad2 size={24} />,
      gradient: 'from-cyan-500 to-blue-600',
      tag: isVi ? 'Tốc độ' : 'Speed',
    },
    {
      mode: 'zen' as StudyMode,
      label: t('deck_zen_label'),
      sublabel: t('deck_zen_sublabel'),
      icon: <Leaf size={24} />,
      gradient: 'from-emerald-400 to-teal-600',
      tag: isVi ? 'Thư giãn' : 'Zen',
    },
    {
      mode: 'written' as StudyMode,
      label: t('deck_written_label'),
      sublabel: t('deck_written_sublabel'),
      icon: <PenLine size={24} />,
      gradient: 'from-violet-500 to-purple-600',
      tag: isVi ? 'Chính tả' : 'Writing',
    },
  ];

  const flashcardCount = deck.cards.filter((c) => c.type === 'flashcard').length;
  const dragDropCount = deck.cards.filter((c) => c.type === 'drag_drop').length;

  const handleSelectMode = (mode: StudyMode) => {
    if (mode === 'flashcard') navigate(getStudyRoute(deck.id));
    else if (mode === 'treasure') navigate(getTreasureRoute(deck.id));
    else if (mode === 'match') navigate(getMatchRoute(deck.id));
    else if (mode === 'test') navigate(getTestRoute(deck.id));
    else if (mode === 'minigame') navigate(getMinigameRoute(deck.id));
    else if (mode === 'zen') navigate(getZenRoute(deck.id));
    else if (mode === 'written') navigate(getWrittenRoute(deck.id));
  };

  const isPublic = deck.isPublic !== undefined ? deck.isPublic : true;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero banner */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${deck.color}`}>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <ArrowLeft size={15} />
              {t('nav_all_decks')}
            </button>

            <div className="flex items-center gap-2">
              {/* Export button */}
              <button
                onClick={() => setIsImportExportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                style={{ fontFamily: 'var(--font-display)' }}
                title={isVi ? 'Tải về dữ liệu bộ thẻ (CSV/JSON)' : 'Export deck data (CSV/JSON)'}
              >
                <Download size={14} />
                <span>{isVi ? 'Tải về (Export)' : 'Export'}</span>
              </button>

              {/* Clone deck for community users */}
              <button
                disabled={isCloning}
                onClick={handleCloneDeck}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                style={{ fontFamily: 'var(--font-display)' }}
                title={isVi ? 'Tạo bản sao để tự do chỉnh sửa theo ý bạn' : 'Clone this deck to your own library to edit'}
              >
                <Copy size={14} />
                <span>{isCloning ? (isVi ? 'Đang sao chép...' : 'Cloning...') : (isVi ? 'Sao chép bộ thẻ' : 'Clone Deck')}</span>
              </button>

              {/* Add to collection button */}
              <button
                onClick={() => setIsAddCollectionOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <FolderPlus size={14} />
                <span>{t('collection_add_to_collection')}</span>
              </button>


              {/* 3-dots Menu with permission check */}
              <ItemOptionsMenu
                onEdit={() => navigate(getEditDeckRoute(deck.id))}
                onDelete={() => setIsDeleteModalOpen(true)}
                canEdit={canEditDeck(deck, user)}
                canDelete={isDeckCreator(deck, user)}
                creatorName={deck.creator}
                isOwner={isDeckCreator(deck, user)}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1
                  className="text-white text-3xl md:text-4xl font-black mb-2 leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {deck.title}
                </h1>
                <div className="flex items-center gap-3 text-white/90 text-sm font-medium flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {t('deck_creator_label')}: <strong className="text-white">{deck.creator}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} />
                    {t('cards_count', { count: deck.itemCount })}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-bold text-white">
                    {getCategoryLabel(deck.category, t)}
                  </span>
                  <button
                    type="button"
                    disabled={!canEditDeck(deck, user) || isUpdatingPrivacy}
                    onClick={handleToggleDeckPrivacy}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-sm transition-all ${
                      canEditDeck(deck, user)
                        ? 'cursor-pointer hover:bg-white/30 hover:scale-105 active:scale-95 bg-white/20'
                        : 'bg-white/20 cursor-default'
                    }`}
                    title={
                      canEditDeck(deck, user)
                        ? (isPublic
                            ? (isVi ? 'Bấm để đổi sang Riêng tư (Private)' : 'Click to change to Private')
                            : (isVi ? 'Bấm để đổi sang Công khai (Public)' : 'Click to change to Public'))
                        : undefined
                    }
                  >
                    {isPublic ? <Globe size={11} /> : <Lock size={11} />}
                    <span>{isPublic ? t('deck_public_badge') : t('deck_private_badge')}</span>
                    {canEditDeck(deck, user) && (
                      <span className="text-[10px] opacity-80 underline ml-0.5">
                        {isUpdatingPrivacy ? '...' : (isVi ? 'Đổi' : 'Change')}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex gap-3 mt-5 flex-wrap">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black flex items-center justify-center gap-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Star size={18} className={deck.ratingCount && deck.ratingCount > 0 ? "fill-amber-300 text-amber-300" : "text-amber-200/60"} />
                  <span>{deck.ratingCount && deck.ratingCount > 0 ? (deck.rating ? deck.rating.toFixed(1) : '5.0') : (isVi ? 'Mới' : 'New')}</span>
                </div>
                <div className="text-white/80 text-xs font-semibold">
                  {deck.ratingCount && deck.ratingCount > 0 ? `${deck.ratingCount} ${isVi ? 'đánh giá' : 'reviews'}` : (isVi ? 'Chưa có đánh giá' : 'No ratings yet')}
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {flashcardCount}
                </div>
                <div className="text-white/80 text-xs font-semibold">{isVi ? 'Thẻ ghi nhớ' : 'Flashcards'}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {dragDropCount}
                </div>
                <div className="text-white/80 text-xs font-semibold">{isVi ? 'Kéo thả câu' : 'Drag & Drop'}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black flex items-center justify-center gap-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Star size={18} className={starredCount > 0 ? "fill-amber-300 text-amber-300" : "text-amber-200/60"} />
                  <span>{starredCount}</span>
                </div>
                <div className="text-white/80 text-xs font-semibold">{isVi ? 'Đã gán sao' : 'Starred'}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black flex items-center justify-center gap-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Brain size={18} className={srsStats.dueTodayCount > 0 ? "text-indigo-200" : "text-white/60"} />
                  <span>{srsStats.dueTodayCount}</span>
                </div>
                <div className="text-white/80 text-xs font-semibold">{isVi ? 'Cần ôn' : 'Due today'}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <div
                  className="text-white text-xl font-black"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {modes.length}
                </div>
                <div className="text-white/80 text-xs font-semibold">{t('deck_detail_modes_count')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Interactive Community Rating Bar */}
        <DeckRatingStars
          rating={deck.rating}
          ratingCount={deck.ratingCount}
          userRating={deck.userRatings?.[user?.id || user?.email || 'guest']}
          interactive={true}
          size="md"
          onRate={async (score) => {
            const updated = await deckApi.rateDeck(
              deck.id,
              score,
              user?.id || user?.email || 'guest'
            );
            setDeck(updated);
          }}
        />

        {/* Quick SRS Due Study Mode Banner */}
        {srsStats.dueTodayCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-gradient-to-r from-indigo-600/15 via-indigo-500/10 to-violet-500/15 dark:from-indigo-900/30 dark:to-violet-900/30 border border-indigo-300/70 dark:border-indigo-500/40 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-300/50 dark:shadow-none shrink-0">
                <Brain size={22} />
              </div>
              <div>
                <h3
                  className="text-slate-900 dark:text-white text-sm sm:text-base font-black tracking-tight flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span>{isVi ? `Đang có ${srsStats.dueTodayCount} từ vựng cần ôn hôm nay (SRS) 🧠` : `You have ${srsStats.dueTodayCount} terms due for review today 🧠`}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {isVi
                    ? 'Ôn tập đúng lúc trước khi quên theo phương pháp lặp lại ngắt quãng SM-2'
                    : 'Review right on time according to SuperMemo SM-2 spaced repetition'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              <button
                onClick={() => navigate(`${getStudyRoute(deck.id)}?due=true`)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-300/50 dark:shadow-none transition-all cursor-pointer whitespace-nowrap"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <BookOpen size={14} />
                <span>{isVi ? `Lật ${srsStats.dueTodayCount} thẻ cần ôn` : `Study ${srsStats.dueTodayCount} due`}</span>
              </button>
              <button
                onClick={() => navigate(`${getWrittenRoute(deck.id)}?due=true`)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-indigo-200 dark:border-indigo-800/80 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <PenLine size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>{isVi ? 'Luyện gõ từ cần ôn' : 'Write due'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Quizlet-style Quick Starred Study Mode Banner */}
        {starredCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-orange-500/15 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-300/70 dark:border-amber-500/40 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-300/50 dark:shadow-none shrink-0">
                <Star size={22} className="fill-white" />
              </div>
              <div>
                <h3
                  className="text-slate-900 dark:text-white text-sm sm:text-base font-black tracking-tight flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span>{isVi ? `Đang có ${starredCount} thuật ngữ được gắn sao ⭐` : `You have ${starredCount} starred terms ⭐`}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {isVi
                    ? 'Tập trung ôn luyện nhanh các từ vựng bạn đã đánh dấu sao'
                    : 'Focus practice on terms you have flagged with a star'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              <button
                onClick={() => navigate(`${getStudyRoute(deck.id)}?starred=true`)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-amber-300/50 dark:shadow-none transition-all cursor-pointer whitespace-nowrap"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <BookOpen size={14} />
                <span>{isVi ? `Lật ${starredCount} thẻ sao` : `Study ${starredCount} starred`}</span>
              </button>
              <button
                onClick={() => navigate(`${getWrittenRoute(deck.id)}?starred=true`)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800/80 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <PenLine size={14} className="text-amber-500" />
                <span>{isVi ? 'Luyện gõ từ sao' : 'Write starred'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Mode selection heading */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700/80 dark:ring-1 dark:ring-white/10 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2
              className="text-slate-900 dark:text-white text-base sm:text-lg font-black tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('deck_choose_mode')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              {isVi ? 'Chọn phương pháp học tương tác phù hợp với bạn' : 'Select an interactive mode to practice this deck'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modes.map((item, index) => (
            <motion.div
              key={item.mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => handleSelectMode(item.mode)}
              className="group bg-white/95 dark:bg-slate-900/95 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 dark:ring-1 dark:ring-white/10 shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform shrink-0`}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3
                      className="font-black text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.label}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed line-clamp-1 sm:line-clamp-2">
                    {item.sublabel}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0 ml-1"
              />
            </motion.div>
          ))}
        </div>

        {/* Vocabulary Cards List Section */}
        {(() => {
          const cardsList = deck.cards || [];
          const filteredCards = cardsList.filter((c) => {
            if (starredOnlyFilter && !isStarred(c.id)) return false;
            if (!cardSearch.trim()) return true;
            const q = cardSearch.toLowerCase().trim();
            if (c.type === 'flashcard') {
              return (
                c.front.toLowerCase().includes(q) ||
                c.back.toLowerCase().includes(q) ||
                (c.phonetic && c.phonetic.toLowerCase().includes(q))
              );
            } else {
              return (
                c.meaning.toLowerCase().includes(q) ||
                (c.grammarRule && c.grammarRule.toLowerCase().includes(q))
              );
            }
          });

          return (
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700/80 dark:ring-1 dark:ring-white/10 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-none shrink-0">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h2
                        className="text-slate-900 dark:text-white text-base sm:text-lg font-black tracking-tight leading-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {isVi ? `Danh sách từ vựng (${cardsList.length} thẻ)` : `Vocabulary Cards (${cardsList.length} cards)`}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                        {isVi ? 'Xem trước, gắn sao ⭐ để lọc ôn tập và nghe phát âm' : 'Preview, star ⭐ to filter practice, and listen to pronunciation'}
                      </p>
                    </div>
                  </div>

                  {cardsList.length > 3 && (
                    <div className="relative max-w-xs w-full">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={cardSearch}
                        onChange={(e) => setCardSearch(e.target.value)}
                        placeholder={isVi ? 'Tìm kiếm thẻ...' : 'Search cards...'}
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Filter Tabs & Bulk Actions Bar */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
                  {/* Tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                    <button
                      onClick={() => setStarredOnlyFilter(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !starredOnlyFilter
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {isVi ? 'Tất cả' : 'All'} ({cardsList.length})
                    </button>
                    <button
                      onClick={() => setStarredOnlyFilter(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        starredOnlyFilter
                          ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-amber-500'
                      }`}
                    >
                      <Star size={13} className={starredOnlyFilter || starredCount > 0 ? 'fill-amber-400 text-amber-500' : ''} />
                      <span>{isVi ? 'Có gắn sao' : 'Starred'}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        starredOnlyFilter ? 'bg-amber-950/20 text-amber-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {starredCount}
                      </span>
                    </button>
                  </div>

                  {/* Bulk Star / Unstar Actions */}
                  {cardsList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => starAll(cardsList.map((c) => c.id))}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 text-xs font-bold transition-all cursor-pointer"
                        title={isVi ? 'Gán sao tất cả từ trong bộ này' : 'Star all cards in this deck'}
                      >
                        <Star size={13} className="text-amber-500" />
                        <span>{isVi ? 'Gán sao tất cả' : 'Star all'}</span>
                      </button>

                      {starredCount > 0 && (
                        <button
                          onClick={() => unstarAll()}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 text-xs font-bold transition-all cursor-pointer"
                          title={isVi ? 'Xóa toàn bộ sao đã gán' : 'Remove all stars'}
                        >
                          {isVi ? 'Bỏ gắn sao tất cả' : 'Unstar all'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {cardsList.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
                  {isVi ? 'Bộ thẻ này chưa có thẻ từ vựng nào.' : 'This deck has no cards yet.'}
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
                  {starredOnlyFilter
                    ? (isVi ? 'Chưa có từ vựng nào được gắn sao ⭐. Bạn có thể nhấn icon ngôi sao bên cạnh mỗi từ để gắn sao.' : 'No starred cards yet ⭐. Click the star icon on any card to star it.')
                    : (isVi ? 'Không tìm thấy thẻ phù hợp với từ khóa.' : 'No cards match your search.')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCards.map((c, index) => (
                    <div
                      key={c.id || index}
                      className={`p-4 rounded-2xl bg-white dark:bg-slate-800/90 border transition-all shadow-xs flex items-center justify-between gap-4 group ${
                        isStarred(c.id)
                          ? 'border-amber-300/80 dark:border-amber-500/40 ring-1 ring-amber-400/20 dark:ring-amber-500/10'
                          : 'border-slate-200/80 dark:border-slate-700/80 dark:ring-1 dark:ring-white/10 hover:border-indigo-400 dark:hover:border-indigo-500'
                      }`}
                    >
                      {c.type === 'flashcard' ? (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="font-black text-slate-900 dark:text-white text-base leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                style={{ fontFamily: 'var(--font-display)' }}
                              >
                                {c.front}
                              </span>
                              {c.phonetic && (
                                <span className="text-xs text-indigo-500 dark:text-indigo-400 font-mono">
                                  {c.phonetic}
                                </span>
                              )}
                              {isStarred(c.id) && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                                  <Star size={10} className="fill-amber-400 text-amber-500" />
                                  <span>{isVi ? 'Đã gán sao' : 'Starred'}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                              {c.back}
                            </div>
                            {c.exampleEn && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 italic mt-1 line-clamp-1">
                                "{c.exampleEn}"
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleStar(c.id)}
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                isStarred(c.id)
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-500 hover:bg-amber-200 dark:hover:bg-amber-900/80 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700'
                              }`}
                              title={isStarred(c.id) ? (isVi ? 'Bỏ gắn sao' : 'Unstar') : (isVi ? 'Gán sao từ này' : 'Star this card')}
                            >
                              <Star size={18} className={isStarred(c.id) ? 'fill-amber-400 text-amber-500' : ''} />
                            </button>

                            <button
                              onClick={() => speakWord(c.front)}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                              title={isVi ? 'Nghe phát âm' : 'Listen pronunciation'}
                            >
                              <Volume2 size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              {isVi ? 'Kéo thả ngữ pháp' : 'Grammar Drag & Drop'}
                            </span>
                            {c.grammarRule && (
                              <span className="text-xs text-indigo-500 font-mono font-bold">
                                {c.grammarRule}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {c.meaning}
                          </div>
                          {c.grammarExplanation && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                              {c.grammarExplanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        deck={deck}
        isOpen={isAddCollectionOpen}
        onClose={() => setIsAddCollectionOpen(false)}
      />

      {/* Import / Export Modal */}
      <ImportExportModal
        deck={deck}
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />

      {/* Delete Deck Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteDeck}
        title={isVi ? 'Xóa bộ thẻ từ vựng' : 'Delete Vocabulary Deck'}
        itemName={deck.title}
        description={
          isVi
            ? `Bạn có chắc chắn muốn xóa vĩnh viễn bộ thẻ "${deck.title}"? Toàn bộ danh sách ${deck.itemCount} thẻ từ vựng sẽ bị xóa.`
            : `Are you sure you want to permanently delete the deck "${deck.title}"? All ${deck.itemCount} cards will be removed.`
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}

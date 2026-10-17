import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  BookOpen,
  Sparkles,
  Users,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Minus,
  FolderOpen,
  Lock,
  Gamepad2,
  Play,
  Languages,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDecks } from '../../hooks/useDecks';
import { mockDecks } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';
import { getDeckDetailRoute, getEditDeckRoute, getMatchRoute, getMinigameRoute, getZenRoute, getWrittenRoute, getTreasureRoute, ROUTES } from '../../constants/routers';
import type { Deck } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';
import ChickenMascot from '../../components/general/ChickenMascot';
import ItemOptionsMenu from '../../components/shared/ItemOptionsMenu';
import ConfirmDeleteModal from '../../components/shared/ConfirmDeleteModal';
import DeckRatingStars from '../../components/shared/DeckRatingStars';
import DeckSortDropdown from '../../components/shared/DeckSortDropdown';
import { isDeckCreator, canEditDeck, canViewDeck } from '../../utils/permission';
import { sortDecks, recordViewedDeck, type DeckSortOption } from '../../utils/recentDecks';

const categoryColors: Record<string, string> = {
  Beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
  Intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300',
  Advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300',
};

export function getCategoryLabel(category: string, t: any): string {
  switch (category?.toLowerCase()) {
    case 'beginner':
      return t('category_beginner');
    case 'intermediate':
      return t('category_intermediate');
    case 'advanced':
      return t('category_advanced');
    case 'all':
      return t('all');
    default:
      return category;
  }
}

interface DeckCardProps {
  deck: Deck;
  onStudy: (deck: Deck) => void;
  onDeleteRequest: (deck: Deck) => void;
  index: number;
}

function DeckCard({ deck, onStudy, onDeleteRequest, index }: DeckCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isPublic = deck.isPublic !== undefined ? deck.isPublic : true;
  const isOwner = isDeckCreator(deck, user);
  const canEdit = canEditDeck(deck, user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="group bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/80 dark:ring-1 dark:ring-white/10 overflow-hidden shadow-md dark:shadow-xl dark:shadow-black/70 hover:shadow-2xl dark:hover:shadow-indigo-500/20 hover:-translate-y-1.5 dark:hover:border-indigo-500/60 dark:hover:ring-indigo-400/40 transition-all duration-300 cursor-pointer flex flex-col relative"
      onClick={() => onStudy(deck)}
    >
      {/* Gradient banner */}
      <div className={`h-24 bg-gradient-to-br ${deck.color} relative overflow-hidden border-b border-black/5 dark:border-white/10`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="absolute bottom-3 left-4">
          <div className="w-10 h-10 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-xs">
            <BookOpen size={20} className="text-white" />
          </div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {!isPublic && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-amber-300 backdrop-blur-sm flex items-center gap-1 shadow-xs">
              <Lock size={10} />
              <span>{t('deck_private_badge')}</span>
            </span>
          )}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[deck.category] ?? 'bg-white/30 text-white'} backdrop-blur-sm shadow-xs`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {getCategoryLabel(deck.category, t)}
          </span>

          {/* 3-dots Menu with permission check */}
          <ItemOptionsMenu
            onStudy={() => onStudy(deck)}
            onEdit={() => navigate(getEditDeckRoute(deck.id))}
            onDelete={() => onDeleteRequest(deck)}
            canEdit={canEdit}
            canDelete={isOwner}
            creatorName={deck.creator}
            isOwner={isOwner}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 bg-white dark:bg-slate-900/90">
        <h3
          className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {deck.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <Users size={11} className="text-slate-400 dark:text-slate-500" />
          <span>{t('deck_creator_label')}: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{deck.creator}</strong></span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <Sparkles size={12} className="text-amber-400" />
            {t('cards_count', { count: deck.itemCount })}
          </div>
          <DeckRatingStars
            rating={deck.rating}
            ratingCount={deck.ratingCount}
            size="sm"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 pt-1 bg-white dark:bg-slate-900/90">
        <div
          className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 text-sm font-bold flex items-center justify-center gap-1.5 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-all duration-200 shadow-xs"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('deck_start_btn')}
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { decks, loading, deleteDeck } = useDecks();
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();

  const isVi = i18n.language === 'vi';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<DeckSortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [inputVal, setInputVal] = useState<string>('24');
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const gridSectionRef = useRef<HTMLDivElement>(null);

  // Keep inputVal in sync with pageSize
  useEffect(() => {
    if (pageSize < 1000) {
      setInputVal(pageSize.toString());
    }
  }, [pageSize]);

  // Reset page to 1 whenever search, category, sort, or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, sortBy, pageSize]);

  const handleConfirmDelete = async () => {
    if (!deckToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDeck(deckToDelete.id);
      setDeckToDelete(null);
    } catch (e) {
      console.error('Failed to delete deck:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Only show public decks OR private decks the logged-in user is authorized to view
  const visibleDecks = useMemo(() => {
    const list = decks && decks.length > 0 ? decks : mockDecks;
    return list.filter((d) => canViewDeck(d, user));
  }, [decks, user]);

  const filtered = useMemo(() => {
    return visibleDecks.filter((d) => {
      const matchSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.creator.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || d.category?.toLowerCase() === activeCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [visibleDecks, search, activeCategory]);

  // Quizlet-style sorting by recent items or alphabetical title
  const sortedDecks = useMemo(() => {
    return sortDecks(filtered, sortBy);
  }, [filtered, sortBy]);

  const isAll = pageSize >= 1000;
  const totalItems = sortedDecks.length;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = isAll ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = isAll ? totalItems : Math.min(startIndex + pageSize, totalItems);

  const pagedDecks = useMemo(() => {
    if (isAll) return sortedDecks;
    return sortedDecks.slice(startIndex, endIndex);
  }, [sortedDecks, startIndex, endIndex, isAll]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return;
    setCurrentPage(newPage);
    if (gridSectionRef.current) {
      gridSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (safeCurrentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (safeCurrentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(safeCurrentPage - 1);
      pages.push(safeCurrentPage);
      pages.push(safeCurrentPage + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const PRESET_STEPS = [6, 12, 24, 48, 1000];

  const handleIncreasePageSize = () => {
    if (isAll) return;
    const next = PRESET_STEPS.find((s) => s > pageSize);
    if (next !== undefined) {
      setPageSize(next);
    } else {
      setPageSize(1000);
    }
  };

  const handleDecreasePageSize = () => {
    if (isAll) {
      setPageSize(48);
      return;
    }
    const prev = [...PRESET_STEPS].reverse().find((s) => s < pageSize);
    if (prev !== undefined) {
      setPageSize(prev);
    } else {
      setPageSize(Math.max(1, pageSize - 1));
    }
  };

  const handleStudy = (deck: Deck) => {
    recordViewedDeck(deck);
    navigate(getDeckDetailRoute(deck.id));
  };

  if (loading && visibleDecks.length === 0) return <Loading />;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Banner with Chicken Scholar Mascot */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(55,48,163,0.92) 0%, rgba(79,70,229,0.92) 50%, rgba(124,58,237,0.92) 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Hero Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-8 text-center md:text-left"
            >
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
                <Sparkles size={14} className="text-amber-300" />
                <span
                  className="text-white text-xs font-bold tracking-wider uppercase"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('home_hero_badge')}
                </span>
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span className="text-amber-200 text-xs font-semibold">{isVi ? 'Ôn tập ngắt quãng thông minh' : 'Smart Spaced Repetition'}</span>
              </div>

              <h1
                className="text-white text-3xl sm:text-4xl md:text-5xl font-black mb-3 leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('home_hero_title_1')}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
                  {t('home_hero_title_2')}
                </span>
              </h1>

              <p className="text-indigo-100 text-sm sm:text-base mb-6 max-w-xl font-medium leading-relaxed">
                {t('home_hero_desc')}
              </p>

              {/* Quick Action buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap mb-8">
                <button
                  onClick={() => navigate(ROUTES.GAMES)}
                  className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Gamepad2 size={16} />
                  <span>{isVi ? 'Đấu Trường Trò Chơi' : 'Play Games'}</span>
                </button>

                <button
                  onClick={() => navigate(ROUTES.TRANSLATE_EXTRACT)}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Languages size={16} />
                  <span>{isVi ? 'Dịch & Trích Từ Vựng' : 'Translate & Extract'}</span>
                </button>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate(ROUTES.LOGIN, { state: { from: ROUTES.CREATE_DECK } });
                      return;
                    }
                    navigate(ROUTES.CREATE_DECK);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-white text-indigo-600 font-bold text-xs sm:text-sm shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus size={16} />
                  <span>{t('nav_create_deck')}</span>
                </button>


                <button
                  onClick={() => navigate(ROUTES.COLLECTIONS)}
                  className="px-5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer border border-white/20 active:scale-95"
                >
                  <FolderOpen size={16} />
                  <span>{t('collection_title')}</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="flex justify-center md:justify-start gap-6 sm:gap-8 flex-wrap">
                {[
                  { label: t('home_quick_stats_decks'), value: `${decks.length}+` },
                  { label: isVi ? 'Phương pháp' : 'Method', value: isVi ? 'Ghi nhớ sâu' : 'Spaced Repetition' },
                  { label: isVi ? '5 Đấu Trường Game' : '5 Arcade Games', value: isVi ? 'Trò chơi 🎮' : 'Arcade 🎮' },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center md:text-left">
                    <div
                      className="text-white text-xl sm:text-2xl font-black"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {value}
                    </div>
                    <div className="text-indigo-200 text-[11px] font-semibold uppercase tracking-wide">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Hero Right Mascot Feature with transparent cutout & physics */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:col-span-4 flex flex-col items-center justify-center relative"
            >
              <div className="relative group flex flex-col items-center">
                {/* Glowing Aura */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-300 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

                {/* Animated Transparent Chicken Mascot */}
                <div className="relative z-10 p-2">
                  <ChickenMascot size="hero" animate interactive />
                </div>

                {/* Floating Mascot Badges */}
                <div className="absolute -top-1 -right-2 z-20 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1 animate-bounce">
                  <span>🎓</span>
                  <span>{isVi ? 'Học Giả Gà' : 'Scholar Chicken'}</span>
                </div>

                <div className="absolute -bottom-1 -left-2 z-20 px-3 py-1 rounded-full bg-slate-900/90 text-amber-300 font-bold text-xs border border-amber-400/40 shadow-lg backdrop-blur-md flex items-center gap-1">
                  <span>🧠</span>
                  <span>{isVi ? 'Ghi nhớ dài hạn' : 'Long-term Memory'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ARCADE MINIGAMES SHOWCASE STRIP */}
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8 relative z-20">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 dark:ring-1 dark:ring-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Gamepad2 size={18} />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {isVi ? 'Đấu Trường Trò Chơi Học Từ Vựng' : 'Vocabulary Minigames Arcade'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isVi ? 'Luyện tập phản xạ & giải trí với kho từ vựng của bạn' : 'Master words through fun gamified challenges'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(ROUTES.GAMES)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isVi ? 'Xem tất cả' : 'View all'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick Minigame Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                id: 'treasure',
                title: isVi ? '🏴‍☠️ Săn Kho Báu' : '🏴‍☠️ Treasure Hunt',
                desc: isVi ? 'Đoán nghĩa & xếp chữ' : 'Guess & unscramble',
                color: 'from-amber-500 to-orange-500',
                route: getTreasureRoute(decks[0]?.id || 'all'),
              },
              {
                id: 'match',
                title: isVi ? '🃏 Lật Thẻ Đôi' : '🃏 Memory Match',
                desc: isVi ? 'Nhớ vị trí ghép EN-VI' : 'Memorize & match',
                color: 'from-indigo-600 to-violet-600',
                route: getMatchRoute(decks[0]?.id || 'all'),
              },
              {
                id: 'shooter',
                title: isVi ? '🎯 Bắn Chữ Rơi' : '🎯 Typing Shooter',
                desc: isVi ? 'Gõ nhanh phản xạ' : 'Fast typing reflex',
                color: 'from-rose-500 to-pink-600',
                route: getMinigameRoute(decks[0]?.id || 'all'),
              },
              {
                id: 'zen',
                title: isVi ? '🌿 Xây Thế Giới' : '🌿 Zen Builder',
                desc: isVi ? 'Nuôi dưỡng ốc đảo' : 'Cultivate sanctuary',
                color: 'from-emerald-500 to-teal-600',
                route: getZenRoute(decks[0]?.id || 'all'),
              },
              {
                id: 'written',
                title: isVi ? '✍️ Luyện Gõ Từ' : '✍️ Written Practice',
                desc: isVi ? 'Phản xạ gõ chính xác' : 'Type accurate words',
                color: 'from-cyan-500 to-blue-600',
                route: getWrittenRoute(decks[0]?.id || 'all'),
              },
            ].map((game) => (
              <button
                key={game.id}
                onClick={() => navigate(game.route)}
                className="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {game.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 mb-2 truncate">
                  {game.desc}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500">
                  <Play size={10} fill="currentColor" />
                  <span>{isVi ? 'Chơi ngay' : 'Play'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* Search & filters */}
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 dark:ring-1 dark:ring-white/10 p-5 -mt-6 mb-6 relative z-10">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate(ROUTES.LOGIN, { state: { from: ROUTES.CREATE_DECK } });
                  return;
                }
                navigate(ROUTES.CREATE_DECK);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none active:scale-95 shrink-0 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Plus size={15} />
              <span className="hidden sm:inline">{t('create')}</span>
            </button>

          </div>

          {/* Category level filter tabs */}
          <div className="flex gap-2 flex-wrap mt-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                    : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {getCategoryLabel(cat, t)}
              </button>
            ))}
          </div>
        </div>

        {/* Section heading & Quizlet-style Sort Controls */}
        <div ref={gridSectionRef} className="flex items-center justify-between mb-5 flex-wrap gap-3 scroll-mt-20">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 dark:ring-1 dark:ring-white/10 shadow-sm">
            <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h2
              className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>{activeCategory === 'All' ? t('nav_all_decks') : getCategoryLabel(activeCategory, t)}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950/90 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/80 shadow-xs shrink-0">
                {totalItems}
              </span>
            </h2>
          </div>

          {/* Quizlet-style Sort Dropdown */}
          <DeckSortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pb-28 sm:pb-32">
          {pagedDecks.map((deck, i) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onStudy={handleStudy}
              onDeleteRequest={(d) => setDeckToDelete(d)}
              index={i}
            />
          ))}
          {totalItems === 0 && (
            <div className="col-span-full flex flex-col items-center py-16 text-slate-400 dark:text-slate-500">
              <BookOpen size={40} className="mb-3 opacity-30" />
              <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {t('home_no_decks_found')}
              </p>
            </div>
          )}
        </div>

        {/* Fixed Floating Pagination Bar (Always accessible without scrolling down, perfectly aligned in one row) */}
        {totalItems > 0 && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[calc(100vw-1.5rem)] transition-all duration-300">
            <div className="pointer-events-auto inline-flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-indigo-950/15 dark:shadow-black/60 text-xs">
              
              {/* Page Navigation Controls: Responsive layout */}
              {!isAll && totalPages > 1 && (
                <>
                  {/* Mobile Compact View (< 640px): [ < ] 2 / 7 [ > ] */}
                  <div className="flex sm:hidden items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1}
                      className="w-8 h-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
                      title={isVi ? 'Trang trước' : 'Previous page'}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <div className="px-2 py-1 text-xs font-black text-slate-800 dark:text-slate-100 select-none whitespace-nowrap">
                      <span>{safeCurrentPage}</span>
                      <span className="text-slate-400 font-semibold mx-1">/</span>
                      <span className="text-slate-500 dark:text-slate-400">{totalPages}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      disabled={safeCurrentPage === totalPages}
                      className="w-8 h-8 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
                      title={isVi ? 'Trang sau' : 'Next page'}
                      aria-label="Next page"
                    >
                      <ChevronRight size={15} />
                    </button>

                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
                  </div>

                  {/* Desktop / Tablet View (>= 640px): << < 1 2 3 ... 7 > >> */}
                  <div className="hidden sm:flex items-center gap-1">
                    {/* First Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={safeCurrentPage === 1}
                      className="p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600 dark:text-slate-300 cursor-pointer shadow-xs active:scale-95"
                      title={isVi ? 'Trang đầu' : 'First page'}
                      aria-label="First page"
                    >
                      <ChevronsLeft size={14} />
                    </button>

                    {/* Prev Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1}
                      className="p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600 dark:text-slate-300 cursor-pointer shadow-xs active:scale-95"
                      title={isVi ? 'Trang trước' : 'Previous page'}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {/* Number Buttons */}
                    <div className="flex items-center gap-1 mx-0.5">
                      {getPageNumbers().map((pageNum, idx) => {
                        if (pageNum === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-bold select-none text-[11px]">
                              ...
                            </span>
                          );
                        }
                        const num = Number(pageNum);
                        const isActive = num === safeCurrentPage;
                        return (
                          <button
                            key={`page-${num}`}
                            type="button"
                            onClick={() => handlePageChange(num)}
                            className={`min-w-[30px] sm:min-w-[34px] h-[30px] sm:h-[34px] px-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                                : 'border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs'
                            }`}
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600 dark:text-slate-300 cursor-pointer shadow-xs active:scale-95"
                      title={isVi ? 'Trang sau' : 'Next page'}
                      aria-label="Next page"
                    >
                      <ChevronRight size={14} />
                    </button>

                    {/* Last Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600 dark:text-slate-300 cursor-pointer shadow-xs active:scale-95"
                      title={isVi ? 'Trang cuối' : 'Last page'}
                      aria-label="Last page"
                    >
                      <ChevronsRight size={14} />
                    </button>

                    {/* Vertical Divider separating page numbers and stepper */}
                    <div className="w-px h-5 sm:h-6 bg-slate-200 dark:bg-slate-700 mx-1 sm:mx-1.5 shrink-0" />
                  </div>
                </>
              )}

              {/* Single Stepper Box: [-] [ 24 / 1 ] [+] (Thẳng hàng với nút trang) */}
              <div className="inline-flex items-center gap-0.5 shrink-0">
                {/* Decrement Button (-) */}
                <button
                  type="button"
                  onClick={handleDecreasePageSize}
                  disabled={pageSize <= 1 && !isAll}
                  className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title={isVi ? 'Giảm số lượng trên 1 trang' : 'Decrease count per page'}
                  aria-label="Decrease items per page"
                >
                  <Minus size={13} />
                </button>

                {/* Center Display / Input Area with fixed uneditable / 1 */}
                <div className="flex items-center justify-center px-2 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 min-w-[64px] sm:min-w-[70px]">
                  {isAll ? (
                    <button
                      type="button"
                      onClick={() => setPageSize(48)}
                      className="font-black text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer select-none hover:underline"
                      title={isVi ? 'Bấm để chọn số lượng cụ thể' : 'Click to set specific count'}
                    >
                      {isVi ? 'Tất cả' : 'All'}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center">
                      <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setInputVal(raw);
                          const num = parseInt(raw, 10);
                          if (!isNaN(num) && num > 0) {
                            setPageSize(Math.min(num, 300));
                          }
                        }}
                        onBlur={() => {
                          if (!inputVal || parseInt(inputVal, 10) <= 0) {
                            setInputVal(pageSize.toString());
                          } else {
                            setInputVal(pageSize.toString());
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-7 text-right font-black text-xs text-indigo-600 dark:text-indigo-400 bg-transparent focus:outline-none p-0 select-text"
                        title={isVi ? 'Nhập số lượng bộ thẻ' : 'Enter deck count'}
                        maxLength={3}
                      />
                      {/* Fixed uneditable / 1 */}
                      <span className="font-black text-xs text-slate-500 dark:text-slate-400 select-none pointer-events-none pl-0.5">
                        / 1
                      </span>
                    </div>
                  )}
                </div>

                {/* Increment Button (+) */}
                <button
                  type="button"
                  onClick={handleIncreasePageSize}
                  disabled={isAll}
                  className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title={isVi ? 'Tăng số lượng trên 1 trang' : 'Increase count per page'}
                  aria-label="Increase items per page"
                >
                  <Plus size={13} />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Delete Deck Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deckToDelete}
        onClose={() => setDeckToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={isVi ? 'Xóa bộ thẻ từ vựng' : 'Delete Vocabulary Deck'}
        itemName={deckToDelete?.title}
        description={
          isVi
            ? `Bạn có chắc chắn muốn xóa bộ thẻ "${deckToDelete?.title}" (${deckToDelete?.itemCount || 0} từ)? Toàn bộ dữ liệu của bộ thẻ này sẽ bị xóa.`
            : `Are you sure you want to delete the deck "${deckToDelete?.title}"? All cards within it will be removed.`
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}

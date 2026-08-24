import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, BookOpen, Sparkles, Users, ChevronRight, Star, Plus, FolderOpen, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import { getDeckDetailRoute, ROUTES } from '../../constants/routers';
import type { Deck } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';

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
  index: number;
}

function DeckCard({ deck, onStudy, index }: DeckCardProps) {
  const { t } = useTranslation();
  const isPublic = deck.isPublic !== undefined ? deck.isPublic : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => onStudy(deck)}
    >
      {/* Gradient banner */}
      <div className={`h-24 bg-gradient-to-br ${deck.color} relative overflow-hidden`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="absolute bottom-3 left-4">
          <div className="w-10 h-10 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {!isPublic && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-amber-300 backdrop-blur-sm flex items-center gap-1">
              <Lock size={10} />
              <span>{t('deck_private_badge')}</span>
            </span>
          )}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[deck.category] ?? 'bg-white/30 text-white'} backdrop-blur-sm`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {getCategoryLabel(deck.category, t)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {deck.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-3">
          <Users size={11} />
          <span>{t('deck_creator_label')}: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{deck.creator}</strong></span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Sparkles size={12} className="text-amber-400" />
            {t('cards_count', { count: deck.itemCount })}
          </div>
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star size={11} fill="currentColor" />
            <Star size={11} fill="currentColor" />
            <Star size={11} fill="currentColor" />
            <Star size={11} fill="currentColor" />
            <Star size={11} className="text-slate-200 dark:text-slate-700" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <div
          className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center justify-center gap-1.5 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-all duration-200"
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
  const { decks, loading } = useDecks();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Only show public decks OR private decks created by the logged-in user
  const visibleDecks = decks.filter(
    (d) => d.isPublic !== false || (user?.id && d.creatorId === user.id)
  );

  const filtered = visibleDecks.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.creator.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || d.category === activeCategory;
    return matchSearch && matchCat;
  });

  const handleStudy = (deck: Deck) => {
    navigate(getDeckDetailRoute(deck.id));
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span
                className="text-white/90 text-sm font-semibold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('home_hero_badge')}
              </span>
            </div>
            <h1
              className="text-white text-3xl md:text-5xl font-black mb-3 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('home_hero_title_1')}<br />{t('home_hero_title_2')}
            </h1>
            <p className="text-indigo-100 text-base md:text-lg mb-8 max-w-xl font-medium leading-relaxed">
              {t('home_hero_desc')}
            </p>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-3 flex-wrap mb-8">
              <button
                onClick={() => navigate(ROUTES.CREATE_DECK)}
                className="px-5 py-3 rounded-2xl bg-white text-indigo-600 font-bold text-xs sm:text-sm shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>{t('nav_create_deck')}</span>
              </button>

              <button
                onClick={() => navigate(ROUTES.COLLECTIONS)}
                className="px-5 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer border border-white/20"
              >
                <FolderOpen size={16} />
                <span>{t('collection_title')}</span>
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-6 flex-wrap">
              {[
                { label: t('home_quick_stats_decks'), value: `${decks.length}+` },
                { label: t('home_quick_stats_words'), value: '250+' },
                { label: t('home_quick_stats_modes'), value: '5 Chế độ' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    className="text-white text-2xl font-black"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {value}
                  </div>
                  <div className="text-indigo-200 text-xs font-semibold uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search & filters */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-4 -mt-6 mb-6 relative z-10">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
            <button
              onClick={() => navigate(ROUTES.CREATE_DECK)}
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
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {getCategoryLabel(cat, t)}
              </button>
            ))}
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-black text-slate-900 dark:text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {activeCategory === 'All' ? t('nav_all_decks') : getCategoryLabel(activeCategory, t)}
            <span className="ml-2 text-base text-slate-400 dark:text-slate-500 font-semibold">({filtered.length})</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {filtered.map((deck, i) => (
            <DeckCard key={deck.id} deck={deck} onStudy={handleStudy} index={i} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center py-16 text-slate-400 dark:text-slate-500">
              <BookOpen size={40} className="mb-3 opacity-30" />
              <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {t('home_no_decks_found')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

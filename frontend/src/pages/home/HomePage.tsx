import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Sparkles, Users, ChevronRight, Star, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDecks } from '../../hooks/useDecks';
import { getDeckDetailRoute, ROUTES } from '../../constants/routers';
import type { Deck } from '../../types/DeckType';
import Loading from '../../components/shared/Loading';

const categoryColors: Record<string, string> = {
  Beginner: 'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-rose-100 text-rose-700',
};

interface DeckCardProps {
  deck: Deck;
  onStudy: (deck: Deck) => void;
  index: number;
}

function DeckCard({ deck, onStudy, index }: DeckCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
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
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[deck.category] ?? 'bg-white/30 text-white'} backdrop-blur-sm`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {deck.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="font-bold text-slate-900 text-base leading-tight mb-1 group-hover:text-indigo-700 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {deck.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Users size={11} />
          <span>{deck.creator}</span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Sparkles size={12} className="text-amber-400" />
            {deck.itemCount} cards
          </div>
          <div className="flex items-center gap-0.5 text-amber-400">
            <Star size={11} fill="currentColor" />
            <Star size={11} fill="currentColor" />
            <Star size={11} fill="currentColor" />
            <Star size={11} fill="currentColor" />
            <Star size={11} className="text-slate-200" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <div
          className="w-full py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold flex items-center justify-center gap-1.5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Study Now
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { decks, loading } = useDecks();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filtered = decks.filter((d) => {
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
                className="text-white/80 text-sm font-semibold uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                LinguaLeap Architecture
              </span>
            </div>
            <h1
              className="text-white text-3xl md:text-5xl font-black mb-3 leading-tight"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              Learn English.<br />Actually stick with it.
            </h1>
            <p className="text-indigo-200 text-base md:text-lg mb-8 max-w-lg font-medium">
              Flashcards + drag-and-drop grammar. Code structure based on DATN architecture.
            </p>

            {/* Stats */}
            <div className="flex gap-6 flex-wrap">
              {[
                { label: 'Decks', value: `${decks.length}+` },
                { label: 'Learners', value: '12K' },
                { label: 'Languages', value: 'EN–VI' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    className="text-white text-2xl font-black"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {value}
                  </div>
                  <div className="text-indigo-300 text-xs font-semibold uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search & filters */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 -mt-6 mb-6 relative z-10">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search decks or creators..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
            <button
              onClick={() => navigate(ROUTES.CREATE_DECK)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 active:scale-95 shrink-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Create</span>
            </button>
          </div>
          <div className="flex gap-2 flex-wrap mt-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-black text-slate-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {activeCategory === 'All' ? 'All Decks' : activeCategory}
            <span className="ml-2 text-base text-slate-400 font-semibold">({filtered.length})</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {filtered.map((deck, i) => (
            <DeckCard key={deck.id} deck={deck} onStudy={handleStudy} index={i} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center py-16 text-slate-400">
              <BookOpen size={40} className="mb-3 opacity-30" />
              <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>No decks found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

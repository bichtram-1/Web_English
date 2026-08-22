import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Plus, BookOpen, Layers } from 'lucide-react';
import { ROUTES } from '../../constants/routers';

export default function DefaultHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Sparkles size={18} />
          </div>
          <div>
            <span
              className="text-slate-900 text-lg font-black tracking-tight flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              LinguaLeap
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold">
                DATN FE
              </span>
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Layers size={16} />
            Bộ thẻ học (Decks)
          </Link>
          <Link
            to={ROUTES.CREATE_DECK}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <BookOpen size={16} />
            Tạo bộ thẻ mới
          </Link>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.CREATE_DECK)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm shadow-indigo-200 active:scale-95 transition-all"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Plus size={16} />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>
    </header>
  );
}

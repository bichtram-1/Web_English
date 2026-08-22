import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Plus, BookOpen, Layers, BarChart3, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { ROUTES } from '../../constants/routers';
import { useAuth } from '../../hooks/useAuth';

export default function DefaultHeader() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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
          <Link
            to={ROUTES.STATS}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <BarChart3 size={16} />
            Thống kê (Analytics)
          </Link>
        </nav>

        {/* Right CTA & Auth */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.CREATE_DECK)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm shadow-indigo-200 active:scale-95 transition-all"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Plus size={16} />
            <span>Tạo mới</span>
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 bg-slate-50 py-1 px-2.5 rounded-xl border border-slate-200/60">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-700 hidden lg:inline">{user.name}</span>
              </div>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to={ROUTES.LOGIN}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
              >
                <LogIn size={14} />
                <span>Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

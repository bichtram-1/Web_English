import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Layers, Sparkles, ChevronLeft, ChevronRight, BarChart3, PlusCircle, FolderOpen, Gamepad2, Languages } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { getDeckDetailRoute, ROUTES } from '../../constants/routers';

interface DefaultSiderProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function DefaultSider({ collapsed: externalCollapsed, onToggle }: DefaultSiderProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { decks } = useDecks();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggle = onToggle || (() => setInternalCollapsed((prev) => !prev));

  return (
    <aside
      className={`relative bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800 hidden md:flex flex-col transition-all duration-300 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 z-10 cursor-pointer"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <div className="px-3 mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {!collapsed && t('nav_main_categories')}
          </div>
          <div className="space-y-1">
            <NavLink
              to={ROUTES.HOME}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Layers size={18} className="shrink-0" />
              {!collapsed && <span>{t('nav_all_decks')}</span>}
            </NavLink>

            <NavLink
              to={ROUTES.GAMES}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Gamepad2 size={18} className="shrink-0" />
              {!collapsed && <span>{isVi ? 'Đấu Trường Trò Chơi' : 'Arcade Games'}</span>}
            </NavLink>

            <NavLink
              to={ROUTES.COLLECTIONS}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <FolderOpen size={18} className="shrink-0" />
              {!collapsed && <span>{t('nav_collections')}</span>}
            </NavLink>

            <NavLink
              to={ROUTES.TRANSLATE_EXTRACT}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Languages size={18} className="shrink-0" />
              {!collapsed && <span>{isVi ? 'Dịch & Trích Từ Vựng' : 'Translate & Extract'}</span>}
            </NavLink>

            <NavLink
              to={ROUTES.STATS}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <BarChart3 size={18} className="shrink-0" />
              {!collapsed && <span>{t('nav_analytics')}</span>}
            </NavLink>

            <NavLink
              to={ROUTES.CREATE_DECK}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <PlusCircle size={18} className="shrink-0" />
              {!collapsed && <span>{t('nav_create_deck')}</span>}
            </NavLink>
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
            {!collapsed && <span>{t('nav_featured_decks')}</span>}
            {!collapsed && <Sparkles size={12} className="text-amber-400" />}
          </div>
          <div className="space-y-1">
            {decks.map((deck) => (
              <NavLink
                key={deck.id}
                to={getDeckDetailRoute(deck.id)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <BookOpen size={15} className="shrink-0" />
                {!collapsed && <span className="truncate">{deck.title}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

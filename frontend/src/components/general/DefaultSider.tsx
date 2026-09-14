import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Layers, Sparkles, ChevronLeft, ChevronRight, BarChart3, PlusCircle, FolderOpen, Gamepad2, Languages, Image } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { getDeckDetailRoute, ROUTES } from '../../constants/routers';
import { canViewDeck } from '../../utils/permission';

interface DefaultSiderProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function DefaultSider({ collapsed: externalCollapsed, onToggle }: DefaultSiderProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { decks } = useDecks();
  const { user } = useAuth();
  const { setIsModalOpen: setWallpaperModalOpen } = useWallpaper();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggle = onToggle || (() => setInternalCollapsed((prev) => !prev));

  const visibleDecks = decks.filter((deck) => canViewDeck(deck, user));

  return (
    <aside
      className={`relative z-30 border-r border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hidden md:flex flex-col transition-all duration-300 shrink-0 self-stretch min-h-full ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sticky Inner Container: pinned at viewport top-16 while main scrolls */}
      <div
        className={`sticky top-16 h-[calc(100vh-4rem)] flex flex-col transition-all duration-300 ${
          collapsed ? 'w-16 px-2 py-3 space-y-3' : 'w-64 p-4 space-y-4'
        }`}
      >
        {/* Toggle button: elevated with z-50 and positioned safely in the header row clearance */}
        <button
          onClick={toggle}
          title={collapsed ? (isVi ? 'Mở rộng menu' : 'Expand menu') : (isVi ? 'Thu gọn menu' : 'Collapse menu')}
          aria-label={collapsed ? (isVi ? 'Mở rộng menu' : 'Expand menu') : (isVi ? 'Thu gọn menu' : 'Collapse menu')}
          className="absolute -right-3.5 top-3.5 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-500 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 active:scale-95 transition-all z-50 cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Main categories section */}
        <div className="shrink-0">
          <div className={`h-6 mb-2 flex items-center justify-between shrink-0 ${collapsed ? 'px-0 justify-center' : 'px-3 pr-5'}`}>
            {!collapsed ? (
              <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t('nav_main_categories')}
              </span>
            ) : (
              <div className="w-5 h-0.5 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto" />
            )}
          </div>
          <div className="space-y-1">
            <NavLink
              to={ROUTES.HOME}
              end
              title={collapsed ? t('nav_all_decks') : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-bold transition-all ${
                  collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'
                } ${
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
              title={collapsed ? (isVi ? 'Đấu Trường Trò Chơi' : 'Arcade Games') : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-bold transition-all ${
                  collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'
                } ${
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
              title={collapsed ? t('nav_collections') : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-bold transition-all ${
                  collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'
                } ${
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
              title={collapsed ? (isVi ? 'Dịch & Trích Từ Vựng' : 'Translate & Extract') : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-bold transition-all ${
                  collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'
                } ${
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
              title={collapsed ? t('nav_analytics') : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-bold transition-all ${
                  collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'
                } ${
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
              title={collapsed ? t('nav_create_deck') : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-bold transition-all ${
                  collapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'
                } ${
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

        {/* Featured Decks Section: stretches vertically to fill remaining space */}
        <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className={`mb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between shrink-0 ${collapsed ? 'px-0 justify-center' : 'px-3'}`}>
            {!collapsed && <span>{t('nav_featured_decks')}</span>}
            <Sparkles size={12} className="text-amber-400 shrink-0" />
          </div>
          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            {visibleDecks.map((deck) => (
              <NavLink
                key={deck.id}
                to={getDeckDetailRoute(deck.id)}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-xs font-semibold transition-all ${
                    collapsed ? 'justify-center py-2 px-0' : 'gap-3 px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
                style={{ fontFamily: 'var(--font-display)' }}
                title={deck.title}
              >
                <BookOpen size={15} className="shrink-0" />
                {!collapsed && <span className="truncate">{deck.title}</span>}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Bottom Wallpaper Customizer Button in Sidebar */}
        <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setWallpaperModalOpen(true)}
            className={`w-full flex items-center rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all cursor-pointer group ${
              collapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-3 py-2.5'
            }`}
            title={isVi ? 'Tùy chỉnh hình nền (như Google)' : 'Customize Wallpaper'}
          >
            <Image size={16} className="text-indigo-500 group-hover:rotate-12 transition-transform shrink-0" />
            {!collapsed && <span>{isVi ? 'Tùy chỉnh nền' : 'Wallpaper'}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

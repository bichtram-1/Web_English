import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, PlusCircle, BarChart3, BookOpen, Sparkles, LogIn, LogOut, User as UserIcon, FolderOpen } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { useAuth } from '../../hooks/useAuth';
import { getDeckDetailRoute, ROUTES } from '../../constants/routers';
import ThemeToggle from './ThemeToggle';
import LanguageSelect from './LanguageSelect';
import UserProfileModal from './UserProfileModal';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { t } = useTranslation();
  const { decks } = useDecks();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleNav = (route: string) => {
    navigate(route);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden"
            />

            {/* Drawer sheet */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 dark:shadow-none">
                    <Sparkles size={16} />
                  </div>
                  <span className="font-black text-slate-900 dark:text-white text-base" style={{ fontFamily: 'var(--font-display)' }}>
                    {t('app_name')}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* User profile / Login */}
                {isAuthenticated && user ? (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                    <button
                      onClick={() => setProfileModalOpen(true)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer active:scale-95 transition-transform"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { logout(); onClose(); }}
                      title={t('logout')}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer shrink-0"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNav(ROUTES.LOGIN)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <LogIn size={15} />
                    <span>{t('login')} / {t('register')}</span>
                  </button>
                )}

                {/* Main Nav Links */}
                <div>
                  <div className="px-2 mb-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('nav_main_categories')}
                  </div>
                  <div className="space-y-1">
                    <NavLink
                      to={ROUTES.HOME}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                      }
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <Layers size={16} />
                      <span>{t('nav_all_decks')}</span>
                    </NavLink>

                    <NavLink
                      to={ROUTES.COLLECTIONS}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                      }
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <FolderOpen size={16} />
                      <span>{t('nav_collections')}</span>
                    </NavLink>

                    <NavLink
                      to={ROUTES.CREATE_DECK}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                      }
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <PlusCircle size={16} />
                      <span>{t('nav_create_deck')}</span>
                    </NavLink>

                    <NavLink
                      to={ROUTES.STATS}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                      }
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <BarChart3 size={16} />
                      <span>{t('nav_analytics')}</span>
                    </NavLink>
                  </div>
                </div>

                {/* Popular Decks Shortcut */}
                <div>
                  <div className="px-2 mb-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('nav_popular_decks')}
                  </div>
                  <div className="space-y-1">
                    {decks.slice(0, 4).map((deck) => (
                      <button
                        key={deck.id}
                        onClick={() => handleNav(getDeckDetailRoute(deck.id))}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors cursor-pointer"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        <BookOpen size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate">{deck.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings & Tools */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('theme_toggle_title')}</span>
                    <ThemeToggle showLabel />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('language_select_title')}</span>
                    <LanguageSelect />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}

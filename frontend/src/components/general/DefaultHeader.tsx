import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Plus, BookOpen, Layers, BarChart3, LogIn, LogOut, Menu, FolderOpen, Gamepad2, Languages } from 'lucide-react';
import { ROUTES } from '../../constants/routers';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import LanguageSelect from './LanguageSelect';
import MobileDrawer from './MobileDrawer';
import UserProfileModal from './UserProfileModal';

export default function DefaultHeader() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [initialLogoutConfirm, setInitialLogoutConfirm] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Brand Logo with Chicken Mascot Icon */}
            <Link to={ROUTES.HOME} className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-white shadow-md shadow-amber-200 dark:shadow-amber-950/50 group-hover:scale-105 transition-transform overflow-hidden p-0.5">
                <img
                  src="/iconChicken.png"
                  alt="Chicken Mascot"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/favicon.svg';
                  }}
                />
              </div>
              <div>
                <span
                  className="text-slate-900 dark:text-white text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('app_name')}
                  <span className="hidden sm:inline text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 font-bold border border-amber-200/50 dark:border-amber-800/50">
                    {t('app_tag')}
                  </span>
                </span>
              </div>
            </Link>
          </div>

          {/* Center Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink
              to={ROUTES.HOME}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Layers size={16} />
              <span>{t('nav_decks')}</span>
            </NavLink>
            <NavLink
              to={ROUTES.COLLECTIONS}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <FolderOpen size={16} />
              <span>{t('nav_collections')}</span>
            </NavLink>
            <NavLink
              to={ROUTES.GAMES}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Gamepad2 size={16} />
              <span>{isVi ? 'Trò Chơi' : 'Arcade Games'}</span>
            </NavLink>
            <NavLink
              to={ROUTES.TRANSLATE_EXTRACT}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Languages size={16} />
              <span>{isVi ? 'Dịch & Trích Từ' : 'Translate & Extract'}</span>
            </NavLink>
            <NavLink
              to={ROUTES.STATS}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <BarChart3 size={16} />
              <span>{t('nav_analytics')}</span>
            </NavLink>
          </nav>

          {/* Right CTA, Language, Theme & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Switcher */}
            <LanguageSelect />

            {/* Theme Toggle (Dark/Light) */}
            <ThemeToggle />

            {/* Quick Create Button (Hidden on small mobile) */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate(ROUTES.LOGIN, { state: { from: ROUTES.CREATE_DECK } });
                  return;
                }
                navigate(ROUTES.CREATE_DECK);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-200 dark:shadow-none active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Plus size={15} />
              <span>{t('create')}</span>
            </button>


            {/* User Auth */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setInitialLogoutConfirm(false);
                    setProfileModalOpen(true);
                  }}
                  title={isVi ? 'Xem thông tin tài khoản' : 'View profile'}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 py-1 px-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block max-w-[90px] truncate leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block max-w-[90px] truncate leading-none">
                      {user.email}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setInitialLogoutConfirm(true);
                    setProfileModalOpen(true);
                  }}
                  title={t('auth_logout_btn')}
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                  aria-label={t('auth_logout_btn')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to={ROUTES.LOGIN}
                  title={t('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 transition-all cursor-pointer group"
                >
                  <LogIn size={15} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  <span className="hidden xs:inline">{t('login')}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Off-canvas mobile drawer */}
      <MobileDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialLogoutConfirm={initialLogoutConfirm}
      />
    </>
  );
}

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layers, PlusCircle, BarChart3, FolderOpen, Gamepad2 } from 'lucide-react';
import { ROUTES } from '../../constants/routers';

export default function MobileBottomNav() {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const navItems = [
    {
      to: ROUTES.HOME,
      label: t('nav_decks'),
      icon: <Layers size={18} />,
    },
    {
      to: ROUTES.GAMES,
      label: isVi ? 'Trò chơi' : 'Games',
      icon: <Gamepad2 size={18} className="text-amber-500" />,
    },
    {
      to: ROUTES.COLLECTIONS,
      label: t('nav_collections'),
      icon: <FolderOpen size={18} />,
    },
    {
      to: ROUTES.CREATE_DECK,
      label: t('create'),
      icon: <PlusCircle size={20} className="text-indigo-600 dark:text-indigo-400" />,
      isAction: true,
    },
    {
      to: ROUTES.STATS,
      label: t('nav_analytics'),
      icon: <BarChart3 size={18} />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 md:hidden px-2 py-1.5 shadow-lg shadow-slate-900/5 transition-colors duration-200">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.HOME || item.to === ROUTES.COLLECTIONS}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <div className="relative flex items-center justify-center h-5 mb-0.5">
              {item.icon}
            </div>
            <span className="text-[10px] tracking-tight leading-none truncate max-w-[65px]">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

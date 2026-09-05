import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DefaultHeader from '../general/DefaultHeader';
import DefaultSider from '../general/DefaultSider';
import MobileBottomNav from '../general/MobileBottomNav';
import Loading from '../shared/Loading';
import WallpaperModal from '../general/WallpaperModal';
import MascotCompanion from '../general/MascotCompanion';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DefaultLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { config, setIsModalOpen: setWallpaperModalOpen } = useWallpaper();
  const { i18n } = useTranslation();
  const location = useLocation();
  const isVi = i18n.language === 'vi';

  // Check if current page has a fixed bottom bar (such as create deck, edit deck) to avoid overlapping
  const hasFixedBottomBar =
    location.pathname.startsWith('/create-deck') ||
    location.pathname.includes('/edit');

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-x-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
        config.enabled && config.url ? 'bg-transparent' : 'bg-slate-50 dark:bg-slate-950'
      }`}
    >
      {/* Dynamic Background Wallpaper Container (GPU accelerated) */}
      {config.enabled && config.url && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-all duration-500 ease-out"
          style={{
            backgroundImage: `url(${config.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: `blur(${config.blur}px) brightness(${config.brightness})`,
            transform: 'translate3d(0, 0, 0) scale(1.08)',
            willChange: 'filter, opacity, transform',
            backfaceVisibility: 'hidden',
          }}
        />
      )}

      {/* Dynamic Dark / Tint Overlay */}
      {config.enabled && config.url && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-colors duration-300"
          style={{
            backgroundColor: `rgba(11, 15, 25, ${config.overlayOpacity})`,
            transform: 'translate3d(0, 0, 0)',
            willChange: 'background-color',
          }}
        />
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <DefaultHeader />
        <div className="flex flex-1 pt-16">
          <DefaultSider collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <main className="flex-1 min-w-0 pb-16 md:pb-0">
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
        <MobileBottomNav />

        {/* Floating Quick Background Customizer Button (Google-style bottom corner, hidden on editor pages to avoid overlapping action bar) */}
        {!hasFixedBottomBar && (
          <button
            onClick={() => setWallpaperModalOpen(true)}
            title={isVi ? 'Tùy chỉnh hình nền (như Google)' : 'Customize Wallpaper (Google style)'}
            className="fixed bottom-4 left-4 z-40 hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer active:scale-95 group"
          >
            <Image size={14} className="text-indigo-500 group-hover:rotate-12 transition-transform" />
            <span>{isVi ? 'Tùy chỉnh nền' : 'Wallpaper'}</span>
          </button>
        )}

        {/* Interactive Chicken Scholar Mascot Companion */}
        <MascotCompanion />

        {/* Wallpaper Customizer Modal */}
        <WallpaperModal />
      </div>
    </div>
  );
}


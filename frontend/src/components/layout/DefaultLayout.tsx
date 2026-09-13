import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DefaultHeader from '../general/DefaultHeader';
import DefaultSider from '../general/DefaultSider';
import MobileBottomNav from '../general/MobileBottomNav';
import Loading from '../shared/Loading';
import WallpaperModal from '../general/WallpaperModal';
import MascotCompanion from '../general/MascotCompanion';
import { useWallpaper } from '../../contexts/WallpaperContext';
export default function DefaultLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { config } = useWallpaper();

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-x-clip text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
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


        {/* Interactive Chicken Scholar Mascot Companion */}
        <MascotCompanion />

        {/* Wallpaper Customizer Modal */}
        <WallpaperModal />
      </div>
    </div>
  );
}


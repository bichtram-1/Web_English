import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DefaultHeader from '../general/DefaultHeader';
import DefaultSider from '../general/DefaultSider';
import MobileBottomNav from '../general/MobileBottomNav';
import Loading from '../shared/Loading';

export default function DefaultLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <DefaultHeader />
      <div className="flex flex-1 overflow-hidden">
        <DefaultSider collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-64px)] pb-16 md:pb-0">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

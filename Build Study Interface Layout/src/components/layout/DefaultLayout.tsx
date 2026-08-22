import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DefaultHeader from '../general/DefaultHeader';
import DefaultSider from '../general/DefaultSider';
import Loading from '../shared/Loading';

export default function DefaultLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DefaultHeader />
      <div className="flex flex-1 overflow-hidden">
        <DefaultSider collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-64px)]">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

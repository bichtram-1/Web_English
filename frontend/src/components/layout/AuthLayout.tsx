import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Loading from '../shared/Loading';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-transparent text-slate-900 dark:text-slate-100">
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

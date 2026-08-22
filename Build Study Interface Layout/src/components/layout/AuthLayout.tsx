import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Loading from '../shared/Loading';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center">
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

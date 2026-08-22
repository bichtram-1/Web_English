import { Link } from 'react-router-dom';
import { BookOpen, Home } from 'lucide-react';
import { ROUTES } from '../../constants/routers';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
        <BookOpen size={32} />
      </div>
      <h1
        className="text-4xl font-black text-slate-900 mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        404 - Trang không tồn tại
      </h1>
      <p className="text-slate-500 mb-6 max-w-md">
        Trang bạn đang tìm kiếm không tìm thấy hoặc đã được chuyển sang đường dẫn khác.
      </p>
      <Link
        to={ROUTES.HOME}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-200"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <Home size={16} />
        Về trang chủ
      </Link>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User as UserIcon, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routers';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Vui lòng điền đầy đủ họ tên, email và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register({ name, email, password });
      navigate(ROUTES.HOME);
    } catch (err: any) {
      setError(err?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2
              className="text-2xl font-black text-slate-900 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Tạo tài khoản mới
            </h2>
            <p className="text-xs text-slate-400 font-medium">Bắt đầu lộ trình học tiếng Anh hiệu quả ngay hôm nay</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10"
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Họ và tên
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <UserPlus size={16} />
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
            Đã có tài khoản?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-bold text-indigo-600 hover:text-indigo-700 underline"
            >
              Đăng nhập
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routers';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate(ROUTES.HOME);
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <ArrowLeft size={16} /> {t('back')}
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Sparkles size={20} />
          </div>
          <div>
            <h2
              className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('login')} LinguaLeap
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t('login_prompt')}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-3xl border border-slate-100 dark:border-slate-800 sm:px-10"
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('email')}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email_placeholder')}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('password')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('password_placeholder')}
                  required
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials hint */}
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/50 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300">
              <span className="font-bold">Demo:</span> student@example.com / password123
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <LogIn size={16} />
              {loading ? t('loading') : t('login')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('dont_have_account')}{' '}
              <Link to={ROUTES.REGISTER} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                {t('register')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

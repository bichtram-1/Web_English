import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, LogIn, ArrowLeft, Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routers';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNotRegistered, setIsNotRegistered] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu');
      setIsNotRegistered(false);
      return;
    }

    setLoading(true);
    setError('');
    setIsNotRegistered(false);
    try {
      await login({ email, password });
      navigate(ROUTES.HOME);
    } catch (err: any) {
      const status = err?.status;
      const rawMsg = err?.message || '';

      if (status === 404 || rawMsg.includes('chưa tồn tại') || rawMsg.includes('not found') || rawMsg.includes('chưa được đăng ký')) {
        setIsNotRegistered(true);
        setError('Tài khoản với email này chưa tồn tại trong hệ thống.');
      } else if (status === 401 || rawMsg.includes('không chính xác') || rawMsg.includes('password')) {
        setIsNotRegistered(false);
        setError('Mật khẩu không chính xác. Vui lòng kiểm tra lại hoặc sử dụng tính năng Quên mật khẩu.');
      } else {
        setIsNotRegistered(false);
        setError(rawMsg && !rawMsg.includes('status code') ? rawMsg : 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      }
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
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={17} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-700 dark:text-rose-300 leading-relaxed">{error}</p>
                  {isNotRegistered && (
                    <div className="mt-3 pt-2.5 border-t border-rose-200/80 dark:border-rose-900/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-rose-600/90 dark:text-rose-400/90">Bạn chưa có tài khoản?</span>
                      <Link
                        to={`${ROUTES.REGISTER}?email=${encodeURIComponent(email)}`}
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl shadow-xs border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95"
                      >
                        <UserPlus size={13} />
                        <span>Đăng ký ngay</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('password')}
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {t('forgot_password')}
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              title={t('login')}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer group"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <LogIn size={16} className="group-hover:text-blue-200 transition-colors" />
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

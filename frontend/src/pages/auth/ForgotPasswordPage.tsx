import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Send, 
  RotateCcw, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { authApi } from '../../api/authApi';
import { ROUTES } from '../../constants/routers';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Multi-step: 1 = Email, 2 = OTP & New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Resend OTP countdown
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authApi.forgotPassword({ email });
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || !email) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.forgotPassword({ email });
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      setCountdown(60);
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ mã OTP và mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('password_mismatch'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setStep(3);
    } catch (err: any) {
      setError(err?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <ArrowLeft size={16} /> {t('back_to_login')}
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <KeyRound size={20} />
          </div>
          <div>
            <h2
              className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('forgot_password_title')}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {step === 1 ? t('forgot_password_subtitle') : t('reset_password_btn')}
            </p>
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

          {/* Dev/Demo Mode OTP Quick Notification */}
          {devOtpHint && step === 2 && (
            <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Mã OTP giả lập (Dev): <strong>{devOtpHint}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setOtp(devOtpHint)}
                className="text-[11px] font-bold underline hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
              >
                Điền nhanh
              </button>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form className="space-y-4" onSubmit={handleSendOtp}>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Send size={15} />
                {loading ? t('loading') : t('send_otp')}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span>{t('otp_sent_to')} <strong>{email}</strong></span>
              </div>

              {/* OTP Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('otp_code')}
                  </label>
                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleResendOtp}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-600 disabled:no-underline cursor-pointer"
                  >
                    {countdown > 0 ? `${t('resend_otp')} (${countdown}s)` : t('resend_otp')}
                  </button>
                </div>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('otp_placeholder')}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-bold tracking-widest"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('new_password')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('password_placeholder')}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('confirm_new_password')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('password_placeholder')}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <RotateCcw size={15} />
                {loading ? t('loading') : t('reset_password_btn')}
              </button>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('reset_password_success')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t('reset_password_success_desc')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('back_to_login')}
              </button>
            </div>
          )}

          {step !== 3 && (
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('already_have_account')}{' '}
                <Link to={ROUTES.LOGIN} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  {t('login')}
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

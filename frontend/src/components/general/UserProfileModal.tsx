import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Mail, Shield, Calendar, LogOut, FolderOpen, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routers';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const roleLabelMap: Record<string, string> = {
    student: t('user_role_student'),
    teacher: t('user_role_teacher'),
    admin: t('user_role_admin'),
  };

  const roleBadgeColor: Record<string, string> = {
    student: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    teacher: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    admin: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5 overflow-hidden"
          >
            {/* Header with Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('user_profile_title')}
                </h3>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-purple-500/10 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-200 dark:shadow-none shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  {user.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  <Mail size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      roleBadgeColor[user.role] || roleBadgeColor.student
                    }`}
                  >
                    <Shield size={11} />
                    <span>{roleLabelMap[user.role] || t('user_role_student')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onClose();
                  navigate(ROUTES.COLLECTIONS);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FolderOpen size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
                      {t('collection_my_collections')}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      Xem và quản lý các danh sách bộ thẻ của bạn
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate(ROUTES.STATS);
                }}
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
                      {t('nav_analytics')}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      Xem thống kê từ vựng và cấp độ học tập
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Bottom Logout Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <LogOut size={15} />
                <span>{t('logout')}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

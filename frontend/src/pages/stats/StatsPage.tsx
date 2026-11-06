import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, Award, Clock, BookOpen, CheckCircle, ArrowLeft, BarChart3, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStudyStats from '../../hooks/useStudyStats';
import StreakQuickCard from '../../components/streak/StreakQuickCard';
import { ROUTES } from '../../constants/routers';
import Loading from '../../components/shared/Loading';

export default function StatsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { stats, history, leaderboard, loading } = useStudyStats();

  if (loading) return <Loading />;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto bg-transparent">
      {/* Top navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <ArrowLeft size={16} /> <span>{t('back')}</span>
        </button>
      </div>

      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none mb-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="text-amber-300" size={24} />
              <span className="text-sm font-bold text-indigo-100 uppercase tracking-wider">{t('stats_title')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {t('stats_title')}
            </h1>
            <p className="text-indigo-100 text-sm font-medium">
              {t('stats_subtitle')}
            </p>
          </div>

          {/* Quick Streak Card */}
          <StreakQuickCard className="w-full sm:w-auto min-w-0 sm:min-w-[320px]" />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: t('stats_total_cards'),
            value: stats?.totalCardsStudied || 0,
            icon: <BookOpen className="text-indigo-600 dark:text-indigo-400" size={22} />,
            bg: 'bg-indigo-50 dark:bg-indigo-950/60',
            borderColor: 'border-indigo-100 dark:border-slate-800',
          },
          {
            label: t('stats_total_xp'),
            value: `${stats?.totalXp || 0} XP`,
            icon: <Trophy className="text-amber-500" size={22} />,
            bg: 'bg-amber-50 dark:bg-amber-950/60',
            borderColor: 'border-amber-100 dark:border-slate-800',
          },
          {
            label: t('stats_total_time'),
            value: formatTime(stats?.totalStudyTimeSeconds || 0),
            icon: <Clock className="text-emerald-600 dark:text-emerald-400" size={22} />,
            bg: 'bg-emerald-50 dark:bg-emerald-950/60',
            borderColor: 'border-emerald-100 dark:border-slate-800',
          },
          {
            label: t('stats_accuracy'),
            value: `${stats?.averageAccuracy || 90}%`,
            icon: <CheckCircle className="text-cyan-600 dark:text-cyan-400" size={22} />,
            bg: 'bg-cyan-50 dark:bg-cyan-950/60',
            borderColor: 'border-cyan-100 dark:border-slate-800',
          },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border ${item.borderColor} shadow-sm flex items-center gap-4`}
          >
            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
              {item.icon}
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {item.value}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Study History */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
              {t('stats_recent_history')}
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{t('stats_sessions')}: {history.length}</span>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm">{t('stats_no_sessions')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-4 border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                        {s.mode}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('stats_deck')}: {s.deckId}</span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {new Date(s.completedAt).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} · {formatTime(s.timeSpentSeconds)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{t('stats_correct_rate', { accuracy: s.accuracy })}</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">+{s.xpEarned} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Users size={20} className="text-amber-500" />
              {t('stats_leaderboard')}
            </h2>
          </div>

          <div className="space-y-3">
            {leaderboard.map((user, idx) => (
              <div
                key={user.userId}
                className={`p-3 rounded-2xl flex items-center justify-between border ${
                  idx === 0
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0
                        ? 'bg-amber-400 text-white'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-700'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">{user.cardsStudied} {t('cards')} · {t('stats_streak_count', { days: user.streakDays })}</div>
                  </div>
                </div>

                <div className="text-right font-black text-sm text-indigo-600 dark:text-indigo-400">
                  {user.xp} XP
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

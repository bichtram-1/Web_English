import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useStreak from '../../hooks/useStreak';
import StreakFlameIcon from './StreakFlameIcon';

interface StreakQuickCardProps {
  className?: string;
}

export default function StreakQuickCard({
  className = '',
}: StreakQuickCardProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { streakDays, hasStudiedToday } = useStreak();
  const formattedStreak = (streakDays || 0).toLocaleString(isVi ? 'vi-VN' : 'en-US');

  return (
    <div
      className={`relative overflow-hidden rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-300 ${
        hasStudiedToday
          ? 'bg-gradient-to-r from-amber-500/25 via-orange-500/25 to-red-500/20 backdrop-blur-md border border-amber-300/40 shadow-lg shadow-orange-500/10'
          : 'bg-white/10 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/50'
      } ${className}`}
    >
      {/* Glow pulse when active */}
      {hasStudiedToday && (
        <motion.div
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 blur-2xl pointer-events-none"
        />
      )}

      <div className="flex items-center gap-4 min-w-0">
        {/* Flame container with dynamic lighting */}
        <div
          className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
            hasStudiedToday
              ? 'bg-gradient-to-tr from-amber-500/30 via-orange-500/40 to-red-500/30 border border-amber-300/50 shadow-inner'
              : 'bg-white/10 dark:bg-slate-800/60 border border-white/15 dark:border-slate-700 text-slate-400'
          }`}
        >
          <StreakFlameIcon isLit={hasStudiedToday} size="lg" showParticles={hasStudiedToday} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none whitespace-nowrap tabular-nums"
              style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}
            >
              {formattedStreak} {t('days_unit')}
            </span>

            {/* Dynamic Status Pill */}
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 border shrink-0 ${
                hasStudiedToday
                  ? 'bg-emerald-400/25 text-emerald-100 border-emerald-300/40 shadow-2xs'
                  : 'bg-amber-400/20 text-amber-200 border-amber-300/30'
              }`}
            >
              {hasStudiedToday ? (
                <span>{t('streak_card_studied_today')}</span>
              ) : (
                <>
                  <Clock size={10} className="text-amber-300" />
                  <span>{t('streak_card_not_studied_today')}</span>
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-indigo-100/90 font-medium mt-1 leading-snug">
            {hasStudiedToday
              ? t('streak_quick_desc_lit')
              : t('streak_quick_desc_unlit')}
          </p>
        </div>
      </div>
    </div>
  );
}

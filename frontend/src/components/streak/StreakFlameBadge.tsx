import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, ArrowRight } from 'lucide-react';
import useStreak from '../../hooks/useStreak';
import StreakFlameIcon from './StreakFlameIcon';
import { ROUTES } from '../../constants/routers';

interface StreakFlameBadgeProps {
  compact?: boolean;
  className?: string;
}

export default function StreakFlameBadge({ compact = false, className = '' }: StreakFlameBadgeProps) {
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { streakDays, hasStudiedToday, historyLast7Days } = useStreak();
  const formattedStreak = (streakDays || 0).toLocaleString(isVi ? 'vi-VN' : 'en-US');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleViewStats = () => {
    setIsOpen(false);
    navigate(ROUTES.STATS);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Badge Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Daily Streak Status"
        title={
          hasStudiedToday
            ? t('streak_tooltip_lit', { days: formattedStreak })
            : t('streak_tooltip_unlit', { days: formattedStreak })
        }
        className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95 whitespace-nowrap shrink-0 ${
          hasStudiedToday
            ? 'bg-gradient-to-r from-amber-50 to-orange-50/90 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-300 dark:border-amber-700/60 shadow-xs shadow-orange-100 dark:shadow-none hover:border-amber-400'
            : 'bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}
      >
        {/* Flame Icon with dynamic effect */}
        <div className="shrink-0 flex items-center justify-center">
          <StreakFlameIcon isLit={hasStudiedToday} size="sm" showParticles={hasStudiedToday} />
        </div>

        {/* Streak number */}
        <span
          className={`text-xs font-black tracking-tight leading-none whitespace-nowrap tabular-nums ${
            hasStudiedToday
              ? 'text-amber-600 dark:text-amber-400 font-black'
              : 'text-slate-500 dark:text-slate-400 font-bold'
          }`}
          style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}
        >
          {formattedStreak}
        </span>

        {/* Mini Status Dot */}
        <span
          className={`w-2 h-2 rounded-full shrink-0 transition-all ${
            hasStudiedToday
              ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950 animate-pulse'
              : 'bg-amber-400/80 ring-2 ring-amber-200/60 dark:ring-amber-950/60'
          }`}
          title={hasStudiedToday ? t('streak_studied_today') : t('streak_not_studied_today')}
        />
      </button>

      {/* Interactive Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-88 max-w-sm p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header with Flame Banner */}
            <div
              className={`p-4 rounded-2xl flex items-center gap-3.5 border transition-all ${
                hasStudiedToday
                  ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-300/60 dark:border-amber-700/60'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
              }`}
            >
              <StreakFlameIcon isLit={hasStudiedToday} size="lg" showParticles={hasStudiedToday} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-black text-slate-900 dark:text-white leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t('streak_title', { days: formattedStreak })}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      hasStudiedToday
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300/60'
                    }`}
                  >
                    {hasStudiedToday ? t('streak_status_lit') : t('streak_status_unlit')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-snug">
                  {hasStudiedToday
                    ? t('streak_desc_lit')
                    : t('streak_desc_unlit')}
                </p>
              </div>
            </div>

            {/* 7-Day Mini Tracker Calendar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>{t('streak_this_week')}</span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  {hasStudiedToday ? t('streak_completed_today') : t('streak_need_study_today')}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {historyLast7Days.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {item.dayLabel}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        item.studied
                          ? 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-xs shadow-orange-300 dark:shadow-none'
                          : item.isToday
                          ? 'border-2 border-dashed border-amber-400 dark:border-amber-500 text-amber-500 bg-amber-50/50 dark:bg-amber-950/30 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                      }`}
                      title={`${item.dayLabel} (${item.date}): ${item.studied ? t('streak_studied_today') : t('streak_not_studied_today')}`}
                    >
                      {item.studied ? (
                        <Check size={14} className="stroke-[3]" />
                      ) : item.isToday ? (
                        <Clock size={13} className="text-amber-500" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer: Quick link to detailed progress & stats */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
              <button
                type="button"
                onClick={handleViewStats}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t('streak_view_stats')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

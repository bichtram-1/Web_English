import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  X, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FolderOpen, 
  Flame, 
  Brain, 
  Zap, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import notificationApi, { getStoredNotifications } from '../../api/notificationApi';
import { getCollectionDetailRoute, getDeckDetailRoute, ROUTES } from '../../constants/routers';
import { getRecentViewedDecks } from '../../utils/recentDecks';
import type { InAppNotification } from '../../types/notification.types';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    try {
      return getStoredNotifications().slice(0, 20);
    } catch {
      return [];
    }
  });
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    try {
      return getStoredNotifications().filter((n) => !n.read).length;
    } catch {
      return 0;
    }
  });
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleStreakOrReviewAction = (actionUrl?: string, type?: 'streak_reminder' | 'review_reminder') => {
    setIsOpen(false);
    if (actionUrl) {
      if (actionUrl === '/study/srs-due') {
        navigate(ROUTES.GLOBAL_SRS_STUDY);
        return;
      }
      // Normalize legacy /study/:id to valid /deck/:id to prevent 404
      if (actionUrl.startsWith('/study/')) {
        const deckId = actionUrl.replace('/study/', '');
        navigate(getDeckDetailRoute(deckId));
        return;
      }
      if (actionUrl !== '/decks' && actionUrl !== '/study' && actionUrl !== '/') {
        navigate(actionUrl);
        return;
      }
    }
    if (type === 'review_reminder') {
      navigate(ROUTES.GLOBAL_SRS_STUDY);
      return;
    }
    const recent = getRecentViewedDecks();
    if (recent.length > 0 && recent[0].id) {
      navigate(getDeckDetailRoute(recent[0].id));
    } else {
      navigate(ROUTES.HOME);
    }
  };

  // Priority 1: Lightweight Unread Count polling (every 25s, only transfers ~30 bytes)
  const fetchUnreadCount = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.warn('Could not fetch unread count:', e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 25000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, user?.email]);

  // Load initial batch of 20 notifications when opening dropdown
  const loadInitialNotifications = async () => {
    if (!isAuthenticated || !user) return;
    if (notifications.length === 0) {
      setIsLoadingList(true);
    }
    try {
      const res = await notificationApi.getNotifications({ limit: 20, offset: 0 });
      setNotifications(res.notifications || []);
      setHasMore(Boolean(res.hasMore));
      if (typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      console.warn('Could not fetch notifications:', e);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Helper to resolve localized title & message for streak reminders
  const getStreakNotifContent = (notif: InAppNotification) => {
    const isStart = notif.collectionTitle?.includes('Khởi động') || notif.message?.includes('Khởi động');
    const title = isStart
      ? t('notif_streak_start_title')
      : notif.collectionTitle && isVi
      ? notif.collectionTitle
      : t('notif_streak_title');

    let message = notif.message;
    if (!isVi) {
      message = isStart ? t('notif_streak_msg_broken') : t('notif_streak_msg_keep', { days: '' });
    } else if (!message) {
      message = isStart ? t('notif_streak_msg_broken') : t('notif_streak_msg_keep', { days: '' });
    }

    return { title, message };
  };

  // Helper to resolve localized title & message for review reminders
  const getReviewNotifContent = (notif: InAppNotification) => {
    const title = notif.collectionTitle && isVi && !notif.collectionTitle.includes('Cần ôn từ')
      ? notif.collectionTitle
      : t('notif_review_title');
    const message = (!isVi || !notif.message) ? t('notif_review_msg') : notif.message;
    return { title, message };
  };

  // Helper to resolve localized title & message for daily vocab & system
  const getVocabNotifContent = (notif: InAppNotification) => {
    const title = notif.collectionTitle && isVi && !notif.collectionTitle.includes('Từ vựng thông minh')
      ? notif.collectionTitle
      : t('notif_vocab_title');
    const message = (!isVi || !notif.message) ? t('notif_vocab_msg') : notif.message;
    return { title, message };
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={t('notif_guest_banner_title')}
          className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
            isOpen
              ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
              : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
          }`}
          aria-label="Toggle notifications"
        >
          <Bell size={17} />
          {/* Teaser pulse dot */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-sm shadow-rose-500/50"></span>
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-88 max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 p-5 flex flex-col text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <Brain size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {t('notif_guest_title')}
                  </h3>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                    {t('notif_guest_subtitle')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t('notif_guest_desc')}
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(ROUTES.LOGIN);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Sparkles size={14} />
                  <span>{t('notif_guest_login_btn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(ROUTES.GLOBAL_SRS_STUDY);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Flame size={13} className="text-amber-500" />
                  <span>{t('notif_guest_try_btn')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const handleOpenDropdown = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      loadInitialNotifications();
      if (unreadCount > 0) {
        notificationApi.markAllAsRead().catch(() => {});
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const res = await notificationApi.getNotifications({
        limit: 20,
        offset: notifications.length,
      });
      setNotifications((prev) => [...prev, ...(res.notifications || [])]);
      setHasMore(Boolean(res.hasMore));
    } catch (err) {
      console.warn('Load more notifications failed:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAccept = async (notif: InAppNotification) => {
    setActionLoadingId(notif.id);
    try {
      const result = await notificationApi.acceptInvite(notif.id);
      if (result?.notification) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, status: 'accepted' as const, read: true } : n))
        );
      }
      setIsOpen(false);
      if (notif.collectionId) {
        navigate(getCollectionDetailRoute(notif.collectionId));
      }
    } catch (e) {
      console.error('Accept invite error:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (notif: InAppNotification) => {
    setActionLoadingId(notif.id);
    try {
      const result = await notificationApi.declineInvite(notif.id);
      if (result) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, status: 'declined' as const, read: true } : n))
        );
      }
    } catch (e) {
      console.error('Decline invite error:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diffMin < 1) return t('notif_time_just_now');
      if (diffMin < 60) return t('notif_time_mins_ago', { minutes: diffMin });
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return t('notif_time_hours_ago', { hours: diffHour });
      return date.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleOpenDropdown}
        title={t('notif_title')}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
            : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        aria-label="Toggle notifications"
      >
        <Bell size={17} />

        {/* Pulse badge with 99+ modern pill style */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md shadow-rose-500/40 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm sm:max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bell size={14} />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('notif_title')}
                </h3>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {notifications.length}
                  </span>
                )}
              </div>

              {notifications.some((n) => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {t('notif_mark_all_read')}
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
              {isLoadingList && notifications.length === 0 ? (
                <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-semibold text-slate-400">{t('notif_loading')}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <Sparkles size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('notif_empty')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                    {t('notif_empty_desc')}
                  </p>
                </div>
              ) : (
                <>
                  {notifications.map((notif) => {
                    const isPending = notif.status === 'pending';
                    const isAccepted = notif.status === 'accepted';
                    const isDeclined = notif.status === 'declined';
                    const isActing = actionLoadingId === notif.id;

                    // 1. STREAK REMINDER (Quizlet style 🔥)
                    if (notif.type === 'streak_reminder') {
                      const streakContent = getStreakNotifContent(notif);
                      return (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-2xl transition-all mb-1 ${
                            !notif.read ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              <Flame size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                                  {streakContent.title}
                                </p>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                  <Clock size={10} />
                                  {formatTime(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                                {streakContent.message}
                              </p>
                              <div className="mt-2.5 flex items-center gap-2">
                                <button
                                  onClick={() => handleStreakOrReviewAction(notif.actionUrl, 'streak_reminder')}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                >
                                  <Flame size={13} />
                                  <span>{t('notif_streak_btn')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 2. REVIEW REMINDER (SRS - Spaced Repetition 🧠)
                    if (notif.type === 'review_reminder') {
                      const reviewContent = getReviewNotifContent(notif);
                      return (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-2xl transition-all mb-1 ${
                            !notif.read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              <Brain size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                  {reviewContent.title}
                                </p>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                  <Clock size={10} />
                                  {formatTime(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                                {reviewContent.message}
                              </p>
                              <div className="mt-2.5 flex items-center gap-2">
                                <button
                                  onClick={() => handleStreakOrReviewAction(notif.actionUrl, 'review_reminder')}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                >
                                  <Zap size={13} />
                                  <span>{t('notif_review_btn')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 3. INVITE RESPONSE (When invited user responds to inviter)
                    if (notif.type === 'invite_response') {
                      return (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-2xl transition-all mb-1 ${
                            !notif.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                              notif.status === 'declined'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {notif.status === 'declined' ? <X size={15} /> : <UserCheck size={15} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                                <strong className="text-indigo-600 dark:text-indigo-400">{notif.senderName}</strong>{' '}
                                {notif.status === 'declined' ? t('notif_declined_invite') : t('notif_accepted_invite')}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock size={10} />
                                  {formatTime(notif.createdAt)}
                                </span>
                                {notif.collectionId && (
                                  <button
                                    onClick={() => {
                                      setIsOpen(false);
                                      navigate(getCollectionDetailRoute(notif.collectionId!));
                                    }}
                                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                                  >
                                    <FolderOpen size={12} />
                                    <span>{t('notif_view_collection')}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 4. DAILY VOCAB & SYSTEM LEARNING NOTIFICATIONS (Synchronized Quizlet/LinguaLeap Card UI)
                    if (notif.type === 'system' || notif.type === 'daily_vocab') {
                      const vocabContent = getVocabNotifContent(notif);
                      return (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-2xl transition-all mb-1 ${
                            !notif.read ? 'bg-violet-50/50 dark:bg-violet-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              <Sparkles size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-black text-violet-600 dark:text-violet-400">
                                  {vocabContent.title}
                                </p>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                  <Clock size={10} />
                                  {formatTime(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                                {vocabContent.message}
                              </p>
                              {notif.actionUrl && (
                                <div className="mt-2.5 flex items-center gap-2">
                                  <button
                                    onClick={() => handleStreakOrReviewAction(notif.actionUrl)}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                  >
                                    <Sparkles size={13} />
                                    <span>{t('notif_vocab_btn')}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 5. DEFAULT: COLLECTION INVITATION (With perfectly aligned Accept / Decline buttons)
                    return (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-2xl transition-all mb-1 ${
                          !notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <UserPlus size={15} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                              <strong className="text-indigo-600 dark:text-indigo-400">{notif.senderName}</strong>{' '}
                              {t('notif_col_invite_text')}{' '}
                              <span className="font-bold text-slate-900 dark:text-white">"{notif.collectionTitle || t('collections')}"</span>
                            </p>

                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                  notif.role === 'editor'
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                                }`}
                              >
                                {notif.role === 'editor'
                                  ? t('notif_role_editor')
                                  : t('notif_role_viewer')}
                              </span>

                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {formatTime(notif.createdAt)}
                              </span>
                            </div>

                            {/* Action Buttons for Pending: PERFECTLY ALIGNED SIDE-BY-SIDE (NO WRAP) */}
                            {isPending && (
                              <div className="flex items-center gap-2 mt-2.5 flex-nowrap w-full">
                                <button
                                  disabled={isActing}
                                  onClick={() => handleAccept(notif)}
                                  className="flex-1 min-w-[90px] px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                                >
                                  <Check size={14} />
                                  <span>{t('notif_accept_btn')}</span>
                                </button>

                                <button
                                  disabled={isActing}
                                  onClick={() => handleDecline(notif)}
                                  className="flex-1 min-w-[90px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                                >
                                  <X size={14} />
                                  <span>{t('notif_decline_btn')}</span>
                                </button>
                              </div>
                            )}

                            {/* Status feedback */}
                            {isAccepted && (
                              <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={13} />
                                <span>{t('notif_accepted_status')}</span>
                              </div>
                            )}

                            {isDeclined && (
                              <div className="mt-2 text-[11px] font-bold text-slate-400">
                                {t('notif_declined_status')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Priority 1: Load More Button (Infinite older notifications) */}
                  {hasMore && (
                    <div className="pt-2 pb-1 px-1">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isLoadingMore ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            {t('notif_loading')}
                          </span>
                        ) : (
                          <span>{t('notif_load_more')}</span>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
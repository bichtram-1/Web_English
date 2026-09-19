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
import notificationApi from '../../api/notificationApi';
import { getCollectionDetailRoute, getStudyRoute, ROUTES } from '../../constants/routers';
import { getRecentViewedDecks } from '../../utils/recentDecks';
import type { InAppNotification } from '../../types/notification.types';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleStreakOrReviewAction = (actionUrl?: string) => {
    setIsOpen(false);
    if (actionUrl && actionUrl !== '/decks' && actionUrl !== '/study' && actionUrl !== '/') {
      navigate(actionUrl);
      return;
    }
    const recent = getRecentViewedDecks();
    if (recent.length > 0 && recent[0].id) {
      navigate(getStudyRoute(recent[0].id));
    } else {
      navigate(ROUTES.HOME);
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      console.warn('Could not fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Periodically check every 25 seconds
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, user?.email]);

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

  if (!isAuthenticated || !user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpenDropdown = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      notificationApi.markAllAsRead().catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
      if (diffMin < 1) return isVi ? 'Vừa xong' : 'Just now';
      if (diffMin < 60) return `${diffMin} ${isVi ? 'phút trước' : 'm ago'}`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} ${isVi ? 'giờ trước' : 'h ago'}`;
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
        title={isVi ? 'Thông báo' : 'Notifications'}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
            : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        aria-label="Toggle notifications"
      >
        <Bell size={17} />

        {/* Pulse badge when there are unread invites */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md shadow-rose-500/40 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
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
            className="absolute right-0 mt-2 w-84 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bell size={14} />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {isVi ? 'Thông báo' : 'Notifications'}
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
                  {isVi ? 'Đã đọc tất cả' : 'Mark all read'}
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2">
              {notifications.length === 0 ? (
                <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    <Sparkles size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isVi ? 'Chưa có thông báo nào' : 'No notifications yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                    {isVi
                      ? 'Thông báo lời mời học nhóm, chuỗi streak và nhắc ôn từ vựng sẽ hiển thị tại đây.'
                      : 'Invitations, streak alerts, and review reminders will appear here.'}
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isPending = notif.status === 'pending';
                  const isAccepted = notif.status === 'accepted';
                  const isDeclined = notif.status === 'declined';
                  const isActing = actionLoadingId === notif.id;

                  // 1. STREAK REMINDER (Quizlet style 🔥)
                  if (notif.type === 'streak_reminder') {
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
                                {notif.collectionTitle || (isVi ? 'Nhắc nhở chuỗi Streak 🔥' : 'Streak Reminder 🔥')}
                              </p>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                <Clock size={10} />
                                {formatTime(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                              {notif.message || (isVi ? 'Đừng để đứt chuỗi! Hãy hoàn thành bài học hôm nay nhé.' : 'Keep your streak alive! Complete a session today.')}
                            </p>
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                onClick={() => handleStreakOrReviewAction(notif.actionUrl)}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <Flame size={13} />
                                <span>{isVi ? 'Học giữ chuỗi ngay' : 'Keep Streak'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2. REVIEW REMINDER (SRS - Spaced Repetition 🧠)
                  if (notif.type === 'review_reminder') {
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
                                {notif.collectionTitle || (isVi ? 'Cần ôn từ sắp quên 🧠' : 'Review Cards 🧠')}
                              </p>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                <Clock size={10} />
                                {formatTime(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                              {notif.message || (isVi ? 'Các từ vựng bạn đã học đang vào vùng quên. Hãy ôn tập ngay!' : 'Your vocabulary cards are due for spaced review!')}
                            </p>
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                onClick={() => handleStreakOrReviewAction(notif.actionUrl)}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <Zap size={13} />
                                <span>{isVi ? 'Ôn tập từ vựng' : 'Review Now'}</span>
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
                              {notif.message || (
                                <>
                                  <strong className="text-indigo-600 dark:text-indigo-400">{notif.senderName}</strong>{' '}
                                  {notif.status === 'declined' ? (isVi ? 'đã từ chối lời mời' : 'declined your invite') : (isVi ? 'đã chấp nhận lời mời' : 'accepted your invite')}
                                </>
                              )}
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
                                  <span>{isVi ? 'Xem danh sách' : 'View collection'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 4. SYSTEM OR ROLE UPDATE NOTIFICATION
                  if (notif.type === 'system') {
                    return (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-2xl transition-all mb-1 ${
                          !notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                              {notif.message || notif.collectionTitle}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {formatTime(notif.createdAt)}
                              </span>
                              {notif.actionUrl && (
                                <button
                                  onClick={() => {
                                    setIsOpen(false);
                                    navigate(notif.actionUrl!);
                                  }}
                                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                                >
                                  <FolderOpen size={12} />
                                  <span>{isVi ? 'Mở xem' : 'Open'}</span>
                                </button>
                              )}
                            </div>
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
                            {isVi ? 'đã mời bạn cùng tham gia danh sách bộ thẻ' : 'invited you to collaborate on'}{' '}
                            <span className="font-bold text-slate-900 dark:text-white">"{notif.collectionTitle || 'Danh sách'}"</span>
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
                                ? isVi
                                  ? 'Quyền: Chỉnh sửa thẻ'
                                  : 'Editor'
                                : isVi
                                ? 'Quyền: Cùng học'
                                : 'Viewer'}
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
                                <span>{isVi ? 'Chấp nhận' : 'Accept'}</span>
                              </button>

                              <button
                                disabled={isActing}
                                onClick={() => handleDecline(notif)}
                                className="flex-1 min-w-[90px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                              >
                                <X size={14} />
                                <span>{isVi ? 'Từ chối' : 'Decline'}</span>
                              </button>
                            </div>
                          )}

                          {/* Status feedback */}
                          {isAccepted && (
                            <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={13} />
                              <span>{isVi ? 'Đã chấp nhận lời mời' : 'Joined successfully'}</span>
                            </div>
                          )}

                          {isDeclined && (
                            <div className="mt-2 text-[11px] font-bold text-slate-400">
                              {isVi ? 'Đã từ chối lời mời' : 'Invitation declined'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

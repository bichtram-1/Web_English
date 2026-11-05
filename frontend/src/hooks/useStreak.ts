import { useState, useEffect, useCallback } from 'react';
import {
  getStreakInfo,
  recordStudySessionToday,
  syncWithBackendStats,
  EMPTY_STREAK,
  StreakInfo,
  STREAK_EVENT_NAME,
} from '../utils/streakService';
import studyApi from '../api/studyApi';
import useAuth from './useAuth';

export function useStreak() {
  const { user, isAuthenticated } = useAuth();

  const [streak, setStreak] = useState<StreakInfo>(() => {
    if (!isAuthenticated || !user) return { ...EMPTY_STREAK };
    return getStreakInfo(user.id);
  });

  // Re-sync when user status or account changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setStreak({ ...EMPTY_STREAK });
      return;
    }

    // Load local storage for this specific user
    setStreak(getStreakInfo(user.id));

    // Initial sync with backend stats for this user
    studyApi
      .getUserStats()
      .then((backendStats) => {
        if (backendStats) {
          const synced = syncWithBackendStats(backendStats, user.id);
          setStreak(synced);
        }
      })
      .catch(() => {
        // Fallback to local
      });
  }, [isAuthenticated, user?.id]);

  // Listen to streak updates across any component
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StreakInfo>;
      if (customEvent.detail) {
        setStreak(customEvent.detail);
      } else {
        setStreak(user ? getStreakInfo(user.id) : { ...EMPTY_STREAK });
      }
    };

    window.addEventListener(STREAK_EVENT_NAME, handleUpdate);
    return () => {
      window.removeEventListener(STREAK_EVENT_NAME, handleUpdate);
    };
  }, [user?.id]);

  const recordStudy = useCallback(
    (cardsCount: number = 1) => {
      if (!user) return EMPTY_STREAK;
      const updated = recordStudySessionToday(cardsCount, user.id);
      setStreak(updated);
      return updated;
    },
    [user?.id]
  );

  return {
    ...streak,
    streakInfo: streak,
    recordStudy,
    refetch: () => setStreak(user ? getStreakInfo(user.id) : { ...EMPTY_STREAK }),
  };
}

export default useStreak;

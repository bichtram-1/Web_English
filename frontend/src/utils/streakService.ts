/**
 * Streak Service - Manages learner daily study streak and 'hasStudiedToday' status.
 * Persists in localStorage and syncs with backend study sessions.
 */

export interface StreakInfo {
  streakDays: number;
  lastStudyDate: string | null;
  hasStudiedToday: boolean;
  sessionsToday: number;
  totalCardsStudied: number;
  historyLast7Days: { date: string; dayLabel: string; studied: boolean; isToday: boolean }[];
}

export const STREAK_EVENT_NAME = 'lingua_streak_updated';

export const EMPTY_STREAK: StreakInfo = {
  streakDays: 0,
  lastStudyDate: null,
  hasStudiedToday: false,
  sessionsToday: 0,
  totalCardsStudied: 0,
  historyLast7Days: getLast7DaysOverview(null, false),
};

export function getActiveUserId(): string | null {
  try {
    const raw = localStorage.getItem('lingualeap_user');
    if (raw) {
      const u = JSON.parse(raw);
      return u?.id || null;
    }
  } catch {}
  return null;
}

function getStorageKey(userId?: string | null): string {
  const uid = userId || getActiveUserId();
  return uid ? `lingua_streak_user_${uid}` : 'lingua_streak_guest';
}

export function isSameCalendarDay(d1: Date | string, d2: Date | string = new Date()): boolean {
  try {
    const a = new Date(d1);
    const b = new Date(d2);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  } catch {
    return false;
  }
}

export function isYesterday(d: Date | string): boolean {
  try {
    const target = new Date(d);
    if (isNaN(target.getTime())) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameCalendarDay(target, yesterday);
  } catch {
    return false;
  }
}

function getStartOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Calculates calendar day difference (0 = same day, 1 = yesterday, >1 = 2+ days ago)
 */
export function getCalendarDayDiff(d1: Date | string, d2: Date | string = new Date()): number {
  try {
    const a = new Date(d1);
    const b = new Date(d2);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 999;
    const startA = getStartOfDay(a);
    const startB = getStartOfDay(b);
    return Math.round((startB - startA) / (1000 * 3600 * 24));
  } catch {
    return 999;
  }
}

/**
 * Generates the last 7 calendar days array with day names (T2..CN / Mon..Sun)
 */
export function getLast7DaysOverview(lastStudyDate: string | null, hasStudiedToday: boolean) {
  const result = [];
  const dayNamesVi = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const isToday = i === 0;

    let studied = false;
    if (isToday) {
      studied = hasStudiedToday;
    } else if (lastStudyDate) {
      const diff = getCalendarDayDiff(d, today);
      // For days in the past within streak window, mark as studied
      // (Simplified heuristic based on last active streak)
      studied = diff > 0 && diff <= 3;
    }

    result.push({
      date: d.toISOString().split('T')[0],
      dayLabel: dayNamesVi[d.getDay()],
      studied,
      isToday,
    });
  }

  return result;
}

/**
 * Retrieve current streak info from localStorage
 */
export function getStreakInfo(userId?: string | null): StreakInfo {
  const uid = userId !== undefined ? userId : getActiveUserId();
  if (!uid) {
    return { ...EMPTY_STREAK, historyLast7Days: getLast7DaysOverview(null, false) };
  }

  const storageKey = getStorageKey(uid);
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const lastDate = parsed.lastStudyDate ? new Date(parsed.lastStudyDate) : null;
      let hasStudiedToday = false;
      let streakDays = Number(parsed.streakDays) || 0;

      if (lastDate && !isNaN(lastDate.getTime())) {
        const diff = getCalendarDayDiff(lastDate, new Date());
        if (diff === 0) {
          hasStudiedToday = true;
        } else if (diff === 1) {
          // Last studied yesterday: streak is maintained, but not yet studied today
          hasStudiedToday = false;
        } else {
          // More than 1 day missed: streak broke
          hasStudiedToday = false;
          streakDays = 0;
        }
      } else {
        hasStudiedToday = false;
        streakDays = 0;
      }

      const sessionsToday = hasStudiedToday ? (Number(parsed.sessionsToday) || 1) : 0;
      const totalCards = Number(parsed.totalCardsStudied) || 0;

      return {
        streakDays,
        lastStudyDate: parsed.lastStudyDate || null,
        hasStudiedToday,
        sessionsToday,
        totalCardsStudied: totalCards,
        historyLast7Days: getLast7DaysOverview(parsed.lastStudyDate, hasStudiedToday),
      };
    }
  } catch (err) {
    console.warn('[StreakService] Failed to parse local streak:', err);
  }

  return { ...EMPTY_STREAK, historyLast7Days: getLast7DaysOverview(null, false) };
}

/**
 * Save streak info to localStorage and dispatch update event
 */
export function saveStreakInfo(info: StreakInfo, userId?: string | null): void {
  const uid = userId !== undefined ? userId : getActiveUserId();
  if (uid) {
    try {
      localStorage.setItem(getStorageKey(uid), JSON.stringify(info));
    } catch {
      // Ignore
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STREAK_EVENT_NAME, { detail: info }));
  }
}

/**
 * Clear streak data when user logs out so no remnant streak is displayed
 */
export function clearStreakOnLogout(): void {
  try {
    const uid = getActiveUserId();
    if (uid) {
      localStorage.removeItem(`lingua_streak_user_${uid}`);
    }
    localStorage.removeItem('lingua_streak_guest');
    localStorage.removeItem('lingua_streak_info_v1');
  } catch {
    // Ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STREAK_EVENT_NAME, { detail: { ...EMPTY_STREAK, historyLast7Days: getLast7DaysOverview(null, false) } }));
  }
}

/**
 * Record a study session completed today.
 * Lights up the flame and increments streak if not yet studied today.
 */
export function recordStudySessionToday(cardsStudied: number = 1, userId?: string | null): StreakInfo {
  const uid = userId !== undefined ? userId : getActiveUserId();
  const current = getStreakInfo(uid);
  const now = new Date().toISOString();

  let newStreakDays = current.streakDays;
  if (!current.hasStudiedToday) {
    // First session of the day: Light up flame!
    newStreakDays = Math.max(1, current.streakDays + 1);
  }

  const updated: StreakInfo = {
    streakDays: newStreakDays,
    lastStudyDate: now,
    hasStudiedToday: true,
    sessionsToday: (current.sessionsToday || 0) + 1,
    totalCardsStudied: (current.totalCardsStudied || 0) + Math.max(1, cardsStudied),
    historyLast7Days: getLast7DaysOverview(now, true),
  };

  saveStreakInfo(updated, uid);
  return updated;
}

/**
 * Sync streak data with backend API UserStats
 */
export function syncWithBackendStats(
  backendStats: {
    streakDays?: number;
    lastStudyDate?: string | null;
    totalCardsStudied?: number;
  },
  userId?: string | null
): StreakInfo {
  const uid = userId !== undefined ? userId : getActiveUserId();
  if (!uid) {
    return { ...EMPTY_STREAK, historyLast7Days: getLast7DaysOverview(null, false) };
  }

  if (!backendStats) return getStreakInfo(uid);

  const current = getStreakInfo(uid);
  let lastDateStr = backendStats.lastStudyDate || current.lastStudyDate;
  let hasStudiedToday = false;

  if (lastDateStr) {
    hasStudiedToday = isSameCalendarDay(lastDateStr, new Date());
  }

  // Preserve local session if locally studied today during this session
  if (current.hasStudiedToday) {
    hasStudiedToday = true;
    lastDateStr = current.lastStudyDate || new Date().toISOString();
  }

  const backendStreak = Number(backendStats.streakDays) || 0;
  let streakDays = backendStreak;
  if (current.hasStudiedToday && backendStreak === 0) {
    streakDays = 1;
  }

  const updated: StreakInfo = {
    streakDays,
    lastStudyDate: lastDateStr,
    hasStudiedToday,
    sessionsToday: hasStudiedToday ? Math.max(1, current.sessionsToday) : 0,
    totalCardsStudied: Math.max(backendStats.totalCardsStudied || 0, current.totalCardsStudied),
    historyLast7Days: getLast7DaysOverview(lastDateStr, hasStudiedToday),
  };

  saveStreakInfo(updated, uid);
  return updated;
}

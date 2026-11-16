/**
 * Streak Service - Manages learner daily study streak and 'hasStudiedToday' status.
 * Persists in localStorage and syncs with backend study sessions.
 */

export interface DayStreakItem {
  date: string;
  dayLabel: string;
  studied: boolean;
  isToday: boolean;
  isMissed?: boolean;
}

export interface StreakInfo {
  streakDays: number;
  previousStreakDays?: number;
  lastStudyDate: string | null;
  hasStudiedToday: boolean;
  sessionsToday: number;
  totalCardsStudied: number;
  historyLast7Days: DayStreakItem[];
  studiedDates?: string[];
}

export const STREAK_EVENT_NAME = 'lingua_streak_updated';

export const EMPTY_STREAK: StreakInfo = {
  streakDays: 0,
  previousStreakDays: 0,
  lastStudyDate: null,
  hasStudiedToday: false,
  sessionsToday: 0,
  totalCardsStudied: 0,
  historyLast7Days: getLast7DaysOverview(null, false, 0, []),
  studiedDates: [],
};

export function getActiveUserId(): string | null {
  try {
    const raw =
      localStorage.getItem('lingualeap_user_data') ||
      localStorage.getItem('lingualeap_user');
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
 * Formats a Date or date string to local calendar 'YYYY-MM-DD'
 */
export function toLocalDateStr(d: Date | string): string {
  try {
    const a = new Date(d);
    if (isNaN(a.getTime())) return '';
    const y = a.getFullYear();
    const m = String(a.getMonth() + 1).padStart(2, '0');
    const day = String(a.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
}

/**
 * Generates the last 7 calendar days array with accurate status:
 * - studied: Day user completed study (amber/check)
 * - isToday: Current day (dashed/clock if waiting)
 * - isMissed: Past day not studied that broke or disrupted the streak (rose/X)
 */
export function getLast7DaysOverview(
  lastStudyDate: string | null,
  hasStudiedToday: boolean,
  streakDays: number = 0,
  studiedDates: string[] = []
): DayStreakItem[] {
  const result: DayStreakItem[] = [];
  const dayNamesVi = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();
  const studiedDatesSet = new Set(
    (studiedDates || []).map((d) => toLocalDateStr(d)).filter(Boolean)
  );

  if (lastStudyDate && (!isSameCalendarDay(lastStudyDate, today) || hasStudiedToday)) {
    const lStr = toLocalDateStr(lastStudyDate);
    if (lStr) studiedDatesSet.add(lStr);
  }

  const lastStudyDiff = lastStudyDate ? getCalendarDayDiff(lastStudyDate, today) : 999;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = toLocalDateStr(d);
    const diff = getCalendarDayDiff(d, today);
    const isToday = diff === 0;

    let studied = false;
    let isMissed = false;

    if (isToday) {
      studied = hasStudiedToday;
    } else {
      // Past day (diff >= 1)
      if (studiedDatesSet.has(dateStr)) {
        studied = true;
      } else if (streakDays > 0) {
        // Fallback: If day is before or equal to lastStudyDate and within the active streak window
        if (lastStudyDiff >= 1 && diff >= lastStudyDiff && diff < lastStudyDiff + streakDays) {
          studied = true;
        }
      }

      // If this past day was not studied
      if (!studied) {
        // Any day between last recorded study day and today was missed!
        if (lastStudyDate && lastStudyDiff > 1 && lastStudyDiff <= 7 && diff < lastStudyDiff) {
          isMissed = true;
        }
      }
    }

    result.push({
      date: dateStr,
      dayLabel: dayNamesVi[d.getDay()],
      studied,
      isToday,
      isMissed,
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
    return { ...EMPTY_STREAK, historyLast7Days: getLast7DaysOverview(null, false, 0, []) };
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
          hasStudiedToday = (Number(parsed.sessionsToday) || 0) > 0;
        } else if (diff === 1 || diff === 2) {
          // diff === 1: Studied yesterday, waiting to study today
          // diff === 2: Missed yesterday (1-day grace period): streak is preserved today if user studies!
          hasStudiedToday = false;
        } else {
          // Missed 2 or more consecutive days: streak broke
          hasStudiedToday = false;
          streakDays = 0;
        }
      } else {
        hasStudiedToday = false;
        streakDays = 0;
      }

      const previousStreakDays = Number(parsed.previousStreakDays) || 0;
      if (streakDays === 0 && previousStreakDays > 0 && lastDate) {
        const diff = getCalendarDayDiff(lastDate, new Date());
        if (diff <= 2) {
          streakDays = previousStreakDays;
        }
      }

      const sessionsToday = hasStudiedToday ? (Number(parsed.sessionsToday) || 1) : 0;
      const totalCards = Number(parsed.totalCardsStudied) || 0;
      const studiedDates = Array.isArray(parsed.studiedDates) ? parsed.studiedDates : [];
      if (lastDate && !isNaN(lastDate.getTime())) {
        const lastDateStr = toLocalDateStr(lastDate);
        const diff = getCalendarDayDiff(lastDate, new Date());
        if (lastDateStr && !studiedDates.includes(lastDateStr) && (diff !== 0 || hasStudiedToday)) {
          studiedDates.push(lastDateStr);
        }
      }

      return {
        streakDays,
        previousStreakDays: Math.max(streakDays, previousStreakDays),
        lastStudyDate: parsed.lastStudyDate || null,
        hasStudiedToday,
        sessionsToday,
        totalCardsStudied: totalCards,
        historyLast7Days: getLast7DaysOverview(parsed.lastStudyDate, hasStudiedToday, streakDays, studiedDates),
        studiedDates,
      };
    }
  } catch (err) {
    console.warn('[StreakService] Failed to parse local streak:', err);
  }

  return { ...EMPTY_STREAK, historyLast7Days: getLast7DaysOverview(null, false, 0, []) };
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
    window.dispatchEvent(new CustomEvent(STREAK_EVENT_NAME, { detail: { ...EMPTY_STREAK, historyLast7Days: getLast7DaysOverview(null, false, 0, []) } }));
  }
}

/**
 * Record a study session completed today.
 * Lights up the flame and increments streak if not yet studied today.
 */
export function recordStudySessionToday(cardsStudied: number = 1, userId?: string | null): StreakInfo {
  const uid = userId !== undefined ? userId : getActiveUserId();
  const current = getStreakInfo(uid);
  const now = new Date();
  const todayIso = now.toISOString();
  const todayStr = toLocalDateStr(now);

  let newStreakDays = current.streakDays;
  if (!current.hasStudiedToday) {
    // First session of the day: Light up flame!
    newStreakDays = Math.max(1, current.streakDays + 1);
  }

  const existingDates = new Set(current.studiedDates || []);
  existingDates.add(todayStr);
  const studiedDates = Array.from(existingDates);

  const updated: StreakInfo = {
    streakDays: newStreakDays,
    previousStreakDays: Math.max(newStreakDays, Number(current.previousStreakDays) || 0),
    lastStudyDate: todayIso,
    hasStudiedToday: true,
    sessionsToday: (current.sessionsToday || 0) + 1,
    totalCardsStudied: (current.totalCardsStudied || 0) + Math.max(1, cardsStudied),
    historyLast7Days: getLast7DaysOverview(todayIso, true, newStreakDays, studiedDates),
    studiedDates,
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
  userId?: string | null,
  historySessions?: { completedAt: string }[]
): StreakInfo {
  const uid = userId !== undefined ? userId : getActiveUserId();
  if (!uid) {
    return { ...EMPTY_STREAK, historyLast7Days: getLast7DaysOverview(null, false, 0, []) };
  }

  if (!backendStats) return getStreakInfo(uid);

  const current = getStreakInfo(uid);

  // Authoritative truth for today: database sessions and backendStats.lastStudyDate
  const hasHistorySessionToday =
    Array.isArray(historySessions) &&
    historySessions.length > 0 &&
    historySessions.some((s) => s.completedAt && isSameCalendarDay(s.completedAt, new Date()));

  const isBackendLastToday =
    Boolean(backendStats.lastStudyDate && isSameCalendarDay(backendStats.lastStudyDate, new Date()));

  const hasStudiedToday = hasHistorySessionToday || isBackendLastToday;

  let lastDateStr: string | null = null;
  if (hasStudiedToday) {
    lastDateStr =
      backendStats.lastStudyDate ||
      (historySessions && historySessions.find((s) => isSameCalendarDay(s.completedAt, new Date()))?.completedAt) ||
      new Date().toISOString();
  } else {
    // User has NOT studied today: lastStudyDate MUST be their last actual session date
    if (backendStats.lastStudyDate && !isSameCalendarDay(backendStats.lastStudyDate, new Date())) {
      lastDateStr = backendStats.lastStudyDate;
    } else if (historySessions && historySessions.length > 0) {
      lastDateStr = historySessions[0].completedAt;
    } else if (current.lastStudyDate && !isSameCalendarDay(current.lastStudyDate, new Date())) {
      lastDateStr = current.lastStudyDate;
    } else {
      lastDateStr = null;
    }
  }

  const backendStreak = Number(backendStats.streakDays) || 0;
  let streakDays = backendStreak;
  if (lastDateStr) {
    const diff = getCalendarDayDiff(lastDateStr, new Date());
    // 1-day grace period: if diff <= 2, streak is preserved!
    if (diff <= 2) {
      streakDays = Math.max(backendStreak, current.streakDays || 0);
    } else {
      streakDays = 0;
    }
  }

  const studiedDatesSet = new Set<string>();
  if (historySessions && Array.isArray(historySessions)) {
    historySessions.forEach((s) => {
      if (s.completedAt) {
        const lStr = toLocalDateStr(s.completedAt);
        if (lStr) studiedDatesSet.add(lStr);
      }
    });
  }
  if (lastDateStr) {
    // Only add lastDateStr if it's in the past or user actually studied today
    if (!isSameCalendarDay(lastDateStr, new Date()) || hasStudiedToday) {
      const lStr = toLocalDateStr(lastDateStr);
      if (lStr) studiedDatesSet.add(lStr);
    }
  }
  const studiedDates = Array.from(studiedDatesSet);

  const updated: StreakInfo = {
    streakDays,
    previousStreakDays: Math.max(streakDays, Number(current.previousStreakDays) || 0),
    lastStudyDate: lastDateStr,
    hasStudiedToday,
    sessionsToday: hasStudiedToday
      ? (historySessions ? Math.max(1, historySessions.filter((s) => isSameCalendarDay(s.completedAt, new Date())).length) : 1)
      : 0,
    totalCardsStudied: Math.max(backendStats.totalCardsStudied || 0, current.totalCardsStudied),
    historyLast7Days: getLast7DaysOverview(lastDateStr, hasStudiedToday, streakDays, studiedDates),
    studiedDates,
  };

  saveStreakInfo(updated, uid);
  return updated;
}

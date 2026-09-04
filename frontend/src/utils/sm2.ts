/**
 * SuperMemo SM-2 Spaced Repetition System (SRS) Algorithm Implementation
 * Calculates the optimal review interval and ease factor to review vocabulary
 * right before memory decay occurs according to Ebbinghaus forgetting curve.
 */

export interface SM2Record {
  cardId: number;
  deckId: string;
  repetition: number; // consecutive correct reviews
  interval: number; // in days
  easeFactor: number; // default 2.5, min 1.3
  nextReviewDate: string; // ISO timestamp
  lastStudiedDate: string; // ISO timestamp
  qualityHistory: number[];
}

export type SM2Rating = 1 | 2 | 3 | 5; // 1: Again (Fail), 2: Hard, 3: Good, 5: Easy

export interface SM2RatingOption {
  rating: SM2Rating;
  key: string;
  labelVi: string;
  labelEn: string;
  intervalLabelVi: string;
  intervalLabelEn: string;
  colorClass: string;
  badgeClass: string;
}

const SM2_STORAGE_KEY = 'lingualeap_sm2_records';

/**
 * Get all SM-2 records from LocalStorage
 */
export function getAllSM2Records(): Record<string, SM2Record> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SM2_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to parse SM-2 storage:', e);
    return {};
  }
}

/**
 * Get SM-2 record for a specific card
 */
export function getCardSM2Record(cardId: number, deckId: string): SM2Record {
  const records = getAllSM2Records();
  const key = `${deckId}_${cardId}`;
  if (records[key]) {
    return records[key];
  }
  return {
    cardId,
    deckId,
    repetition: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString(),
    lastStudiedDate: '',
    qualityHistory: [],
  };
}

/**
 * Calculate next SM-2 parameters based on user response quality
 *
 * Quality (q):
 * - 1: Again (Complete blackout / Fail)
 * - 2: Hard (Correct response with serious difficulty)
 * - 3: Good (Correct response after brief hesitation)
 * - 5: Easy (Perfect recall with ease)
 */
export function calculateSM2(current: SM2Record, rating: SM2Rating): SM2Record {
  const safeCurrent: SM2Record = {
    cardId: current?.cardId || 0,
    deckId: current?.deckId || '',
    repetition: current?.repetition || 0,
    interval: current?.interval || 0,
    easeFactor: current?.easeFactor || 2.5,
    nextReviewDate: current?.nextReviewDate || new Date().toISOString(),
    lastStudiedDate: current?.lastStudiedDate || '',
    qualityHistory: Array.isArray(current?.qualityHistory) ? current.qualityHistory : [],
  };

  let repetition = safeCurrent.repetition;
  let interval = safeCurrent.interval;
  let easeFactor = safeCurrent.easeFactor;

  if (rating < 3) {
    // Failed - reset repetition sequence
    repetition = 0;
    interval = 1;
  } else {
    // Succeeded - increment repetition sequence
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = rating === 5 ? 6 : 4;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  }

  // Calculate new Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEF = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  easeFactor = Math.max(1.3, Number(newEF.toFixed(2)));

  const now = new Date();
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    cardId: safeCurrent.cardId,
    deckId: safeCurrent.deckId,
    repetition,
    interval,
    easeFactor,
    nextReviewDate: nextDate.toISOString(),
    lastStudiedDate: now.toISOString(),
    qualityHistory: [...safeCurrent.qualityHistory, rating],
  };
}

/**
 * Save updated SM-2 record to LocalStorage
 */
export function saveSM2Record(record: SM2Record): void {
  if (typeof window === 'undefined') return;
  try {
    const records = getAllSM2Records();
    const key = `${record.deckId}_${record.cardId}`;
    records[key] = record;
    localStorage.setItem(SM2_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save SM-2 record:', e);
  }
}

/**
 * Calculate expected interval preview for a given rating
 */
export function getIntervalPreview(record: SM2Record, rating: SM2Rating): { vi: string; en: string } {
  const simulated = calculateSM2(record, rating);
  const days = simulated.interval;

  if (rating < 3) {
    return { vi: '< 10 phút', en: '< 10 mins' };
  }
  if (days === 1) {
    return { vi: '1 ngày', en: '1 day' };
  }
  if (days < 30) {
    return { vi: `${days} ngày`, en: `${days} days` };
  }
  const months = Math.round(days / 30);
  return { vi: `${months} tháng`, en: `${months} mos` };
}

/**
 * Get SM-2 rating options with live interval preview for the UI buttons
 */
export function getSM2RatingOptions(record: SM2Record): SM2RatingOption[] {
  const againPrev = getIntervalPreview(record, 1);
  const hardPrev = getIntervalPreview(record, 2);
  const goodPrev = getIntervalPreview(record, 3);
  const easyPrev = getIntervalPreview(record, 5);

  return [
    {
      rating: 1,
      key: 'again',
      labelVi: 'Học Lại (Again)',
      labelEn: 'Again',
      intervalLabelVi: againPrev.vi,
      intervalLabelEn: againPrev.en,
      colorClass: 'from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/20',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      rating: 2,
      key: 'hard',
      labelVi: 'Khó (Hard)',
      labelEn: 'Hard',
      intervalLabelVi: hardPrev.vi,
      intervalLabelEn: hardPrev.en,
      colorClass: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/20',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      rating: 3,
      key: 'good',
      labelVi: 'Tốt (Good)',
      labelEn: 'Good',
      intervalLabelVi: goodPrev.vi,
      intervalLabelEn: goodPrev.en,
      colorClass: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      rating: 5,
      key: 'easy',
      labelVi: 'Dễ (Easy)',
      labelEn: 'Easy',
      intervalLabelVi: easyPrev.vi,
      intervalLabelEn: easyPrev.en,
      colorClass: 'from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-sky-500/20',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    },
  ];
}

/**
 * Deck SRS Statistics summary
 */
export interface DeckSRSStats {
  totalCards: number;
  dueTodayCount: number;
  newCardsCount: number;
  learningCount: number;
  masteredCount: number; // interval >= 21 days
}

export function getDeckSRSStats(deckId: string, cardIds: number[]): DeckSRSStats {
  const records = getAllSM2Records();
  const now = new Date();

  let dueTodayCount = 0;
  let newCardsCount = 0;
  let learningCount = 0;
  let masteredCount = 0;

  cardIds.forEach((cardId) => {
    const key = `${deckId}_${cardId}`;
    const record = records[key];

    if (!record || !record.lastStudiedDate) {
      newCardsCount++;
      dueTodayCount++;
    } else {
      const nextDate = new Date(record.nextReviewDate);
      if (nextDate <= now) {
        dueTodayCount++;
      }

      if (record.interval >= 21) {
        masteredCount++;
      } else {
        learningCount++;
      }
    }
  });

  return {
    totalCards: cardIds.length,
    dueTodayCount,
    newCardsCount,
    learningCount,
    masteredCount,
  };
}

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

  const now = new Date();
  let nextDate = new Date(now);

  if (rating === 1) {
    // 1: Again (Complete blackout / Fail) - Need re-learning within 10 minutes
    repetition = 0;
    interval = 0; // Due today / same session
    easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
    nextDate = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins from now
  } else if (rating === 2) {
    // 2: Hard (Struggled to recall) - Review tomorrow with small interval
    repetition = Math.max(0, repetition > 0 ? repetition - 1 : 0);
    interval = repetition <= 1 ? 1 : Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, Number((easeFactor - 0.15).toFixed(2)));
    nextDate.setDate(nextDate.getDate() + interval);
  } else if (rating === 3) {
    // 3: Good (Recalled with standard effort)
    repetition += 1;
    if (repetition === 1) {
      interval = 2; // 2 days for first successful recall
    } else if (repetition === 2) {
      interval = 4; // 4 days for second recall
    } else {
      interval = Math.round(interval * easeFactor);
    }
    easeFactor = Math.max(1.3, Number((easeFactor - 0.05).toFixed(2)));
    nextDate.setDate(nextDate.getDate() + interval);
  } else {
    // 5: Easy (Instant, effortless recall)
    repetition += 1;
    if (repetition === 1) {
      interval = 4; // 4 days for effortless first recall
    } else if (repetition === 2) {
      interval = 7; // 7 days for effortless second recall
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    easeFactor = Math.max(1.3, Number((easeFactor + 0.15).toFixed(2)));
    nextDate.setDate(nextDate.getDate() + interval);
  }

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
  if (rating === 1) {
    return { vi: '< 10 phút', en: '< 10 mins' };
  }
  const simulated = calculateSM2(record, rating);
  const days = simulated.interval;

  if (days <= 1) {
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

/**
 * Check if a card in a deck is due for SRS review today (or is new)
 */
export function isCardDue(deckId: string, cardId: number): boolean {
  if (typeof window === 'undefined') return true;
  const records = getAllSM2Records();
  const key = `${deckId}_${cardId}`;
  const record = records[key];
  if (!record || !record.lastStudiedDate) return true;
  return new Date(record.nextReviewDate) <= new Date();
}

/**
 * Filter list of items to only those due for review today
 */
export function getDeckDueCards<T extends { id: number }>(deckId: string, cards: T[]): T[] {
  if (typeof window === 'undefined') return cards;
  const records = getAllSM2Records();
  const now = new Date();
  return cards.filter((c) => {
    const key = `${deckId}_${c.id}`;
    const rec = records[key];
    if (!rec || !rec.lastStudiedDate) return true;
    return new Date(rec.nextReviewDate) <= now;
  });
}

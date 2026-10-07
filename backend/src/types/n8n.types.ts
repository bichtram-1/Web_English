export interface DailyVocabCardItem {
  front: string;
  back: string;
  phonetic?: string;
  exampleEn?: string;
  exampleVi?: string;
  imageUrl?: string;
}

export interface DailyVocabDTO {
  topic?: string;
  deckTitle?: string;
  description?: string;
  category?: 'Beginner' | 'Intermediate' | 'Advanced' | 'IELTS' | 'TOEIC';
  color?: string;
  cards: DailyVocabCardItem[];
  broadcastNotification?: boolean;
  notificationMessage?: string;
  createSeparateDeck?: boolean;
}

export interface BroadcastReminderDTO {
  title?: string;
  message?: string;
  actionUrl?: string;
  targetUserId?: string;
  type?: 'system' | 'streak_reminder' | 'review_reminder' | 'daily_vocab';
}

export interface SrsDueUserSummary {
  userId: string;
  name: string;
  email: string;
  streakDays: number;
  lastStudyDate: Date;
  needsReview: boolean;
  recentDeckId?: string;
  recentDeckTitle?: string;
  recentDeckItemCount?: number;
}

export interface N8nWebhookPayload {
  event: string;
  timestamp?: string;
  source?: string;
  data?: any;
}

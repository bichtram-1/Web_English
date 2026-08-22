import { StudyMode } from './deck.types';

export interface StudySessionRecord {
  id: string;
  userId: string;
  deckId: string;
  mode: StudyMode;
  cardsStudied: number;
  correctCount: number;
  accuracy: number;
  timeSpentSeconds: number;
  xpEarned: number;
  completedAt: string;
}

export interface SubmitStudySessionDTO {
  deckId: string;
  mode: StudyMode;
  cardsStudied: number;
  correctCount: number;
  timeSpentSeconds: number;
}

export interface UserStats {
  userId: string;
  totalCardsStudied: number;
  totalStudyTimeSeconds: number;
  totalXp: number;
  streakDays: number;
  lastStudyDate: string;
  sessionsCompleted: number;
  averageAccuracy: number;
}

export interface LeaderboardUser {
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  streakDays: number;
  cardsStudied: number;
}

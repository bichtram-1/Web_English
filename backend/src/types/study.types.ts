export type StudyMode = 'flashcard' | 'test' | 'minigame' | 'zen' | 'written';

export interface StudySessionRecord {
  id: string;
  userId: string;
  deckId: string;
  mode: StudyMode;
  cardsStudied: number;
  correctCount: number;
  accuracy: number; // 0 - 100
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

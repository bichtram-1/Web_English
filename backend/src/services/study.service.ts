import { db } from '../models/db';
import { StudySessionRecord, SubmitStudySessionDTO, UserStats } from '../types/study.types';
import { AppError } from '../utils/appError';

export class StudyService {
  static async recordSession(userId: string, dto: SubmitStudySessionDTO): Promise<StudySessionRecord> {
    const { deckId, mode, cardsStudied, correctCount, timeSpentSeconds } = dto;

    if (!deckId) {
      throw new AppError('Mã bộ thẻ (deckId) là bắt buộc', 400);
    }

    const accuracy = cardsStudied > 0 ? Math.round((correctCount / cardsStudied) * 100) : 100;
    const xpEarned = Math.max(10, correctCount * 10 + Math.floor(timeSpentSeconds / 10));

    const session: StudySessionRecord = {
      id: `session-${Date.now()}`,
      userId,
      deckId,
      mode,
      cardsStudied,
      correctCount,
      accuracy,
      timeSpentSeconds,
      xpEarned,
      completedAt: new Date().toISOString(),
    };

    db.addSession(session);

    // Update aggregated stats for user
    const currentStats = db.getUserStats(userId) || {
      userId,
      totalCardsStudied: 0,
      totalStudyTimeSeconds: 0,
      totalXp: 0,
      streakDays: 1,
      lastStudyDate: new Date().toISOString(),
      sessionsCompleted: 0,
      averageAccuracy: 100,
    };

    const newSessionsCompleted = currentStats.sessionsCompleted + 1;
    const newTotalCards = currentStats.totalCardsStudied + cardsStudied;
    const newTotalTime = currentStats.totalStudyTimeSeconds + timeSpentSeconds;
    const newTotalXp = currentStats.totalXp + xpEarned;
    const newAvgAccuracy = Math.round(
      (currentStats.averageAccuracy * currentStats.sessionsCompleted + accuracy) / newSessionsCompleted
    );

    // Check streak
    const lastDate = new Date(currentStats.lastStudyDate);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    let streakDays = currentStats.streakDays;
    if (diffDays === 1) {
      streakDays += 1;
    } else if (diffDays > 1) {
      streakDays = 1;
    }

    const updatedStats: UserStats = {
      userId,
      totalCardsStudied: newTotalCards,
      totalStudyTimeSeconds: newTotalTime,
      totalXp: newTotalXp,
      streakDays,
      lastStudyDate: new Date().toISOString(),
      sessionsCompleted: newSessionsCompleted,
      averageAccuracy: newAvgAccuracy,
    };

    db.updateUserStats(updatedStats);

    return session;
  }

  static async getHistory(userId: string): Promise<StudySessionRecord[]> {
    return db.sessions.filter((s) => s.userId === userId);
  }

  static async getStats(userId: string): Promise<UserStats> {
    const stats = db.getUserStats(userId);
    if (!stats) {
      return {
        userId,
        totalCardsStudied: 0,
        totalStudyTimeSeconds: 0,
        totalXp: 0,
        streakDays: 0,
        lastStudyDate: new Date().toISOString(),
        sessionsCompleted: 0,
        averageAccuracy: 0,
      };
    }
    return stats;
  }
}

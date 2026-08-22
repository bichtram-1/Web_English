import prisma from '../config/prisma';
import { StudySessionRecord, SubmitStudySessionDTO, UserStats } from '../types/study.types';
import { AppError } from '../utils/appError';

export class StudyService {
  static async recordSession(userId: string, dto: SubmitStudySessionDTO): Promise<StudySessionRecord> {
    const { deckId, mode, cardsStudied, correctCount, timeSpentSeconds } = dto;

    if (!deckId) {
      throw new AppError('Mã bộ thẻ (deckId) là bắt buộc', 400);
    }

    // Ensure user exists, if guest create or attach to default demo user
    let effectiveUserId = userId;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      const demoUser = await prisma.user.findFirst();
      if (demoUser) {
        effectiveUserId = demoUser.id;
      }
    }

    const accuracy = cardsStudied > 0 ? (correctCount / cardsStudied) * 100 : 100.0;
    const xpEarned = Math.max(10, correctCount * 10 + Math.floor(timeSpentSeconds / 10));

    const session = await prisma.studySession.create({
      data: {
        userId: effectiveUserId,
        deckId,
        mode,
        cardsStudied,
        correctCount,
        accuracy,
        timeSpentSeconds,
        xpEarned,
      },
    });

    // Update or create UserStats
    const currentStats = await prisma.userStats.findUnique({
      where: { userId: effectiveUserId },
    });

    if (currentStats) {
      const newSessionsCompleted = currentStats.sessionsCompleted + 1;
      const newTotalCards = currentStats.totalCardsStudied + cardsStudied;
      const newTotalTime = currentStats.totalStudyTimeSeconds + timeSpentSeconds;
      const newTotalXp = currentStats.totalXp + xpEarned;
      const newAvgAccuracy =
        (currentStats.averageAccuracy * currentStats.sessionsCompleted + accuracy) / newSessionsCompleted;

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

      await prisma.userStats.update({
        where: { userId: effectiveUserId },
        data: {
          totalCardsStudied: newTotalCards,
          totalStudyTimeSeconds: newTotalTime,
          totalXp: newTotalXp,
          streakDays,
          lastStudyDate: new Date(),
          sessionsCompleted: newSessionsCompleted,
          averageAccuracy: newAvgAccuracy,
        },
      });
    } else {
      await prisma.userStats.create({
        data: {
          userId: effectiveUserId,
          totalCardsStudied: cardsStudied,
          totalStudyTimeSeconds: timeSpentSeconds,
          totalXp: xpEarned,
          streakDays: 1,
          lastStudyDate: new Date(),
          sessionsCompleted: 1,
          averageAccuracy: accuracy,
        },
      });
    }

    return {
      id: session.id,
      userId: session.userId,
      deckId: session.deckId,
      mode: session.mode as any,
      cardsStudied: session.cardsStudied,
      correctCount: session.correctCount,
      accuracy: Math.round(session.accuracy),
      timeSpentSeconds: session.timeSpentSeconds,
      xpEarned: session.xpEarned,
      completedAt: session.completedAt.toISOString(),
    };
  }

  static async getHistory(userId: string): Promise<StudySessionRecord[]> {
    let effectiveUserId = userId;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      const demoUser = await prisma.user.findFirst();
      if (demoUser) effectiveUserId = demoUser.id;
    }

    const sessions = await prisma.studySession.findMany({
      where: { userId: effectiveUserId },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      deckId: s.deckId,
      mode: s.mode as any,
      cardsStudied: s.cardsStudied,
      correctCount: s.correctCount,
      accuracy: Math.round(s.accuracy),
      timeSpentSeconds: s.timeSpentSeconds,
      xpEarned: s.xpEarned,
      completedAt: s.completedAt.toISOString(),
    }));
  }

  static async getStats(userId: string): Promise<UserStats> {
    let effectiveUserId = userId;
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      const demoUser = await prisma.user.findFirst();
      if (demoUser) effectiveUserId = demoUser.id;
    }

    const stats = await prisma.userStats.findUnique({
      where: { userId: effectiveUserId },
    });

    if (!stats) {
      return {
        userId: effectiveUserId,
        totalCardsStudied: 0,
        totalStudyTimeSeconds: 0,
        totalXp: 0,
        streakDays: 1,
        lastStudyDate: new Date().toISOString(),
        sessionsCompleted: 0,
        averageAccuracy: 100,
      };
    }

    return {
      userId: stats.userId,
      totalCardsStudied: stats.totalCardsStudied,
      totalStudyTimeSeconds: stats.totalStudyTimeSeconds,
      totalXp: stats.totalXp,
      streakDays: stats.streakDays,
      lastStudyDate: stats.lastStudyDate.toISOString(),
      sessionsCompleted: stats.sessionsCompleted,
      averageAccuracy: Math.round(stats.averageAccuracy),
    };
  }
}

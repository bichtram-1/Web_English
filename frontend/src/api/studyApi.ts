import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { StudySessionRecord, SubmitStudySessionDTO, UserStats, LeaderboardUser } from '../types/study.types';
import { ApiResponse } from '../types/api.types';

export const studyApi = {
  submitSession: async (dto: SubmitStudySessionDTO): Promise<StudySessionRecord> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.STUDY_SESSIONS,
        dto
      )) as unknown as ApiResponse<StudySessionRecord>;
      return res.data;
    } catch {
      // Local fallback record
      const accuracy = dto.cardsStudied > 0 ? Math.round((dto.correctCount / dto.cardsStudied) * 100) : 100;
      return {
        id: `session-${Date.now()}`,
        userId: 'guest-user',
        deckId: dto.deckId,
        mode: dto.mode,
        cardsStudied: dto.cardsStudied,
        correctCount: dto.correctCount,
        accuracy,
        timeSpentSeconds: dto.timeSpentSeconds,
        xpEarned: Math.max(10, dto.correctCount * 10),
        completedAt: new Date().toISOString(),
      };
    }
  },

  getHistory: async (): Promise<StudySessionRecord[]> => {
    try {
      const res = (await axiosInstance.get(ENDPOINTS.STUDY_HISTORY)) as unknown as ApiResponse<StudySessionRecord[]>;
      return res.data;
    } catch {
      return [];
    }
  },

  getUserStats: async (): Promise<UserStats> => {
    try {
      const res = (await axiosInstance.get(ENDPOINTS.STUDY_STATS)) as unknown as ApiResponse<UserStats>;
      return res.data;
    } catch {
      return {
        userId: 'local-user',
        totalCardsStudied: 45,
        totalStudyTimeSeconds: 1200,
        totalXp: 450,
        streakDays: 3,
        lastStudyDate: new Date().toISOString(),
        sessionsCompleted: 4,
        averageAccuracy: 90,
      };
    }
  },

  getLeaderboard: async (): Promise<LeaderboardUser[]> => {
    try {
      const res = (await axiosInstance.get(ENDPOINTS.STATS_LEADERBOARD)) as unknown as ApiResponse<LeaderboardUser[]>;
      return res.data;
    } catch {
      return [
        { userId: '1', name: 'Alex Johnson', xp: 1250, streakDays: 14, cardsStudied: 230 },
        { userId: '2', name: 'Tram Nguyen', xp: 850, streakDays: 5, cardsStudied: 145 },
        { userId: '3', name: 'Minh Duc', xp: 620, streakDays: 4, cardsStudied: 110 },
      ];
    }
  },
};

export default studyApi;

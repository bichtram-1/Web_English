import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { StudySessionRecord, SubmitStudySessionDTO, UserStats, LeaderboardUser } from '../types/study.types';
import { ApiResponse } from '../types/api.types';
import { recordStudySessionToday, getStreakInfo } from '../utils/streakService';

export const studyApi = {
  submitSession: async (dto: SubmitStudySessionDTO): Promise<StudySessionRecord> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.STUDY_SESSIONS,
        dto
      )) as unknown as ApiResponse<StudySessionRecord>;
      // Instantly update streak and light up flame!
      try {
        recordStudySessionToday(dto.cardsStudied);
      } catch (e) {
        console.warn('Failed to record local streak:', e);
      }
      return res.data;
    } catch {
      // Local fallback record
      try {
        recordStudySessionToday(dto.cardsStudied);
      } catch (e) {
        console.warn('Failed to record local streak:', e);
      }
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
      const res = (await axiosInstance.get(ENDPOINTS.STUDY_HISTORY)) as any;
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    } catch {
      return [];
    }
  },

  getUserStats: async (): Promise<UserStats> => {
    try {
      const res = (await axiosInstance.get(ENDPOINTS.STUDY_STATS)) as any;
      const data = (res && typeof res === 'object' && 'streakDays' in res) ? res : res?.data;
      if (data && typeof data === 'object') {
        return data as UserStats;
      }
      throw new Error('Invalid stats format');
    } catch {
      const local = getStreakInfo();
      return {
        userId: '',
        totalCardsStudied: local.totalCardsStudied || 0,
        totalStudyTimeSeconds: 0,
        totalXp: 0,
        streakDays: local.streakDays || 0,
        lastStudyDate: local.lastStudyDate || null,
        sessionsCompleted: 0,
        averageAccuracy: 0,
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

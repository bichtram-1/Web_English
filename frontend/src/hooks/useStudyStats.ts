import { useState, useEffect, useCallback } from 'react';
import studyApi from '../api/studyApi';
import { UserStats, StudySessionRecord, LeaderboardUser } from '../types/study.types';

export function useStudyStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<StudySessionRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, historyData, leaderboardData] = await Promise.all([
        studyApi.getUserStats(),
        studyApi.getHistory(),
        studyApi.getLeaderboard(),
      ]);
      setStats(statsData);
      setHistory(historyData);
      setLeaderboard(leaderboardData);
    } catch (e) {
      console.error('Failed to load study statistics:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, history, leaderboard, loading, refetch: fetchStats };
}

export default useStudyStats;

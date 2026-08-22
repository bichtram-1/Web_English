import { db } from '../models/db';

export class StatsService {
  static async getPlatformSummary() {
    const totalDecks = db.decks.length;
    const totalUsers = db.users.length;
    const totalSessions = db.sessions.length;
    const totalCardsStudied = db.sessions.reduce((acc, curr) => acc + curr.cardsStudied, 0);

    return {
      totalDecks,
      totalUsers,
      totalSessions,
      totalCardsStudied,
      popularCategories: ['Beginner', 'Intermediate', 'Advanced'],
    };
  }

  static async getLeaderboard(limit = 10) {
    const users = db.users;
    const result = users.map((u) => {
      const stats = db.getUserStats(u.id);
      return {
        userId: u.id,
        name: u.name,
        avatar: u.avatar,
        xp: stats?.totalXp || 0,
        streakDays: stats?.streakDays || 0,
        cardsStudied: stats?.totalCardsStudied || 0,
      };
    });

    return result.sort((a, b) => b.xp - a.xp).slice(0, limit);
  }
}

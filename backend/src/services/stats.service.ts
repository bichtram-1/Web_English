import prisma from '../config/prisma';

export class StatsService {
  static async getPlatformSummary() {
    const [totalDecks, totalUsers, totalSessions, sessionAgg] = await Promise.all([
      prisma.deck.count(),
      prisma.user.count(),
      prisma.studySession.count(),
      prisma.studySession.aggregate({
        _sum: { cardsStudied: true },
      }),
    ]);

    return {
      totalDecks,
      totalUsers,
      totalSessions,
      totalCardsStudied: sessionAgg._sum.cardsStudied || 0,
      popularCategories: ['Beginner', 'Intermediate', 'Advanced', 'TOEIC', 'IELTS'],
    };
  }

  static async getLeaderboard(limit = 10) {
    const usersWithStats = await prisma.user.findMany({
      include: {
        stats: true,
      },
      take: limit,
    });

    const result = usersWithStats.map((u) => ({
      userId: u.id,
      name: u.name,
      avatar: u.avatar || undefined,
      xp: u.stats?.totalXp || 0,
      streakDays: u.stats?.streakDays || 0,
      cardsStudied: u.stats?.totalCardsStudied || 0,
    }));

    return result.sort((a, b) => b.xp - a.xp);
  }
}

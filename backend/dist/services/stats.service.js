"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class StatsService {
    static async getPlatformSummary() {
        const [totalDecks, totalUsers, totalSessions, sessionAgg] = await Promise.all([
            prisma_1.default.deck.count(),
            prisma_1.default.user.count(),
            prisma_1.default.studySession.count(),
            prisma_1.default.studySession.aggregate({
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
        const usersWithStats = await prisma_1.default.user.findMany({
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
exports.StatsService = StatsService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const db_1 = require("../models/db");
class StatsService {
    static async getPlatformSummary() {
        const totalDecks = db_1.db.decks.length;
        const totalUsers = db_1.db.users.length;
        const totalSessions = db_1.db.sessions.length;
        const totalCardsStudied = db_1.db.sessions.reduce((acc, curr) => acc + curr.cardsStudied, 0);
        return {
            totalDecks,
            totalUsers,
            totalSessions,
            totalCardsStudied,
            popularCategories: ['Beginner', 'Intermediate', 'Advanced'],
        };
    }
    static async getLeaderboard(limit = 10) {
        const users = db_1.db.users;
        const result = users.map((u) => {
            const stats = db_1.db.getUserStats(u.id);
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
exports.StatsService = StatsService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyService = void 0;
const db_1 = require("../models/db");
const appError_1 = require("../utils/appError");
class StudyService {
    static async recordSession(userId, dto) {
        const { deckId, mode, cardsStudied, correctCount, timeSpentSeconds } = dto;
        if (!deckId) {
            throw new appError_1.AppError('Mã bộ thẻ (deckId) là bắt buộc', 400);
        }
        const accuracy = cardsStudied > 0 ? Math.round((correctCount / cardsStudied) * 100) : 100;
        const xpEarned = Math.max(10, correctCount * 10 + Math.floor(timeSpentSeconds / 10));
        const session = {
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
        db_1.db.addSession(session);
        // Update aggregated stats for user
        const currentStats = db_1.db.getUserStats(userId) || {
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
        const newAvgAccuracy = Math.round((currentStats.averageAccuracy * currentStats.sessionsCompleted + accuracy) / newSessionsCompleted);
        // Check streak
        const lastDate = new Date(currentStats.lastStudyDate);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        let streakDays = currentStats.streakDays;
        if (diffDays === 1) {
            streakDays += 1;
        }
        else if (diffDays > 1) {
            streakDays = 1;
        }
        const updatedStats = {
            userId,
            totalCardsStudied: newTotalCards,
            totalStudyTimeSeconds: newTotalTime,
            totalXp: newTotalXp,
            streakDays,
            lastStudyDate: new Date().toISOString(),
            sessionsCompleted: newSessionsCompleted,
            averageAccuracy: newAvgAccuracy,
        };
        db_1.db.updateUserStats(updatedStats);
        return session;
    }
    static async getHistory(userId) {
        return db_1.db.sessions.filter((s) => s.userId === userId);
    }
    static async getStats(userId) {
        const stats = db_1.db.getUserStats(userId);
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
exports.StudyService = StudyService;

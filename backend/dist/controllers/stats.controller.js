"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const stats_service_1 = require("../services/stats.service");
const apiResponse_1 = require("../utils/apiResponse");
class StatsController {
    static async getSummary(_req, res, next) {
        try {
            const summary = await stats_service_1.StatsService.getPlatformSummary();
            return apiResponse_1.ApiResponseHandler.success(res, summary, 'Lấy tổng quan hệ thống thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async getLeaderboard(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
            const leaderboard = await stats_service_1.StatsService.getLeaderboard(limit);
            return apiResponse_1.ApiResponseHandler.success(res, leaderboard, 'Lấy bảng xếp hạng thành công');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.StatsController = StatsController;

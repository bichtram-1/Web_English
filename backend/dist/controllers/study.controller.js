"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyController = void 0;
const study_service_1 = require("../services/study.service");
const apiResponse_1 = require("../utils/apiResponse");
class StudyController {
    static async submitSession(req, res, next) {
        try {
            const userId = req.user?.userId || 'guest-user';
            const session = await study_service_1.StudyService.recordSession(userId, req.body);
            return apiResponse_1.ApiResponseHandler.created(res, session, 'Ghi nhận kết quả học tập thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async getHistory(req, res, next) {
        try {
            const userId = req.user?.userId || 'user-demo-1';
            const history = await study_service_1.StudyService.getHistory(userId);
            return apiResponse_1.ApiResponseHandler.success(res, history, 'Lấy lịch sử học tập thành công');
        }
        catch (err) {
            next(err);
        }
    }
    static async getUserStats(req, res, next) {
        try {
            const userId = req.user?.userId || 'user-demo-1';
            const stats = await study_service_1.StudyService.getStats(userId);
            return apiResponse_1.ApiResponseHandler.success(res, stats, 'Lấy thống kê cá nhân thành công');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.StudyController = StudyController;

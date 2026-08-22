"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const appError_1 = require("../utils/appError");
const apiResponse_1 = require("../utils/apiResponse");
const env_1 = require("../config/env");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof appError_1.AppError) {
        return apiResponse_1.ApiResponseHandler.error(res, err.message, err.statusCode, err.details);
    }
    console.error('Unhandled Server Error:', err);
    const message = env_1.config.nodeEnv === 'production' ? 'Đã có lỗi xảy ra trên hệ thống' : err.message;
    return apiResponse_1.ApiResponseHandler.error(res, message, 500);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    return apiResponse_1.ApiResponseHandler.error(res, `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`, 404);
};
exports.notFoundHandler = notFoundHandler;

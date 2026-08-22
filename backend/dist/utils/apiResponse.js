"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseHandler = void 0;
class ApiResponseHandler {
    static success(res, data, message = 'Success', statusCode = 200, meta) {
        const response = {
            success: true,
            statusCode,
            message,
            data,
            meta,
        };
        return res.status(statusCode).json(response);
    }
    static created(res, data, message = 'Created successfully') {
        return this.success(res, data, message, 201);
    }
    static error(res, message = 'Internal Server Error', statusCode = 500, details) {
        const response = {
            success: false,
            statusCode,
            message,
            error: {
                code: `ERR_${statusCode}`,
                details,
            },
        };
        return res.status(statusCode).json(response);
    }
}
exports.ApiResponseHandler = ApiResponseHandler;

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponseHandler } from '../utils/apiResponse';
import { config } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return ApiResponseHandler.error(res, err.message, err.statusCode, err.details);
  }

  console.error('Unhandled Server Error:', err);

  const message = config.nodeEnv === 'production' ? 'Đã có lỗi xảy ra trên hệ thống' : err.message;
  return ApiResponseHandler.error(res, message, 500);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return ApiResponseHandler.error(res, `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`, 404);
};

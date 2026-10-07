import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { ApiResponseHandler } from '../utils/apiResponse';

export const requireN8nAuth = (req: Request, res: Response, next: NextFunction): void => {
  const tokenHeader = req.headers['x-n8n-token'] as string | undefined;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  const clientToken = tokenHeader || bearerToken;

  if (!clientToken || clientToken.trim() !== config.n8nApiKey.trim()) {
    ApiResponseHandler.error(
      res,
      'Truy cập không hợp lệ: Yêu cầu Header "x-n8n-token" hoặc "Authorization: Bearer <token>" chính xác để gọi API n8n automation.',
      401
    );
    return;
  }

  next();
};

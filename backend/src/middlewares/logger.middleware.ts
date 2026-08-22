import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${color}${res.statusCode}\x1b[0m - ${duration}ms`
    );
  });
  next();
};

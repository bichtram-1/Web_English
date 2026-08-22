import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export const createApp = (): Application => {
  const app = express();

  // Global Middlewares
  app.use(
    cors({
      origin: '*', // Allow all origins for dev / capstone presentation
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);

  // Mount API Router under /api/v1 and /v1 for full backward compatibility
  app.use('/api/v1', routes);
  app.use('/v1', routes);

  // Root welcome
  app.get('/', (_req, res) => {
    res.json({
      message: 'LinguaLeap English Learning RESTful API Server (DATN Structure)',
      docs: '/api/v1/health',
      version: '1.0.0',
    });
  });

  // 404 & Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

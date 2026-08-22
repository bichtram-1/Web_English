import { Router } from 'express';
import authRoutes from './auth.routes';
import deckRoutes from './deck.routes';
import cardRoutes from './card.routes';
import studyRoutes from './study.routes';
import statsRoutes from './stats.routes';

const rootRouter = Router();

// Health Check
rootRouter.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'LinguaLeap Backend API (DATN)',
  });
});

// API Routes
rootRouter.use('/auth', authRoutes);
rootRouter.use('/decks', deckRoutes);
rootRouter.use('/cards', cardRoutes);
rootRouter.use('/study', studyRoutes);
rootRouter.use('/stats', statsRoutes);

export default rootRouter;

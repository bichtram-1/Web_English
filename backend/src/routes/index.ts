import { Router } from 'express';
import authRoutes from './auth.routes';
import deckRoutes from './deck.routes';
import cardRoutes from './card.routes';
import studyRoutes from './study.routes';
import statsRoutes from './stats.routes';
import collectionRoutes from './collection.routes';
import notificationRoutes from './notification.routes';
import aiRoutes from './ai.routes';
import n8nRoutes from './n8n.routes';
import mcpRouter from '../mcp/sse';

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
rootRouter.use('/collections', collectionRoutes);
rootRouter.use('/notifications', notificationRoutes);
rootRouter.use('/ai', aiRoutes);
rootRouter.use('/automation/n8n', n8nRoutes);
rootRouter.use('/mcp', mcpRouter);

export default rootRouter;

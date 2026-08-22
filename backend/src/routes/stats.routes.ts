import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';

const router = Router();

router.get('/summary', StatsController.getSummary);
router.get('/leaderboard', StatsController.getLeaderboard);

export default router;

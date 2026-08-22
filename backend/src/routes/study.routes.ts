import { Router } from 'express';
import { StudyController } from '../controllers/study.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/sessions', optionalAuth, StudyController.submitSession);
router.get('/history', optionalAuth, StudyController.getHistory);
router.get('/stats', optionalAuth, StudyController.getUserStats);

export default router;

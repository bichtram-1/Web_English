import { Router } from 'express';
import { N8nController } from '../controllers/n8n.controller';
import { requireN8nAuth } from '../middlewares/n8n.middleware';

const router = Router();

// Public / Health status endpoint (optional auth or open for n8n ping)
router.get('/status', N8nController.getStatus);

// Protected endpoints requiring x-n8n-token or Bearer token
router.use(requireN8nAuth);

// 1. Daily Vocabulary Generation & Deck Auto-Publishing
router.post('/daily-vocab', N8nController.createDailyVocab);

// 2. Broadcast study / streak / review reminders
router.post('/broadcast-reminder', N8nController.broadcastReminder);

// 3. Query students due for spaced repetition review
router.get('/srs-due', N8nController.getSrsDueUsers);

// 4. General webhook receiver
router.post('/webhook', N8nController.handleWebhook);

export default router;

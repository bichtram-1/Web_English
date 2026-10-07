import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';

const router = Router();

// POST /api/v1/ai/analyze-text -> Analyze full text, translate, extract vocab and grammar
router.post('/analyze-text', AiController.analyzeText);

// POST /api/v1/ai/explain-word -> Deep-dive explanation for a specific word/idiom
router.post('/explain-word', AiController.explainWord);

// POST /api/v1/ai/tutor-chat -> Interactive AI Tutor Chat & CEFR Level Assessment
router.post('/tutor-chat', AiController.tutorChat);

// GET /api/v1/ai/status -> Check if Gemini AI key is configured
router.get('/status', AiController.getStatus);

export default router;

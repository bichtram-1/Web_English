import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { ApiResponseHandler } from '../utils/apiResponse';

export class AiController {
  static async analyzeText(req: Request, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return ApiResponseHandler.error(res, 'Vui lòng cung cấp đoạn văn bản tiếng Anh cần phân tích', 400);
      }

      const result = await aiService.analyzeText({ text });
      return ApiResponseHandler.success(res, result, 'Phân tích văn bản thành công');
    } catch (err) {
      next(err);
    }
  }

  static async explainWord(req: Request, res: Response, next: NextFunction) {
    try {
      const { word, contextSentence, currentMeaning, pos, lang, language } = req.body;
      if (!word || typeof word !== 'string' || !word.trim()) {
        return ApiResponseHandler.error(res, 'Vui lòng cung cấp từ vựng cần giải thích', 400);
      }

      const selectedLang = (lang === 'en' || language === 'en') ? 'en' : 'vi';
      const result = await aiService.explainWord({
        word,
        contextSentence,
        currentMeaning,
        pos,
        lang: selectedLang,
      });
      return ApiResponseHandler.success(res, result, 'Giải thích từ vựng thành công');
    } catch (err) {
      next(err);
    }
  }

  static async getStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const isConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
      return ApiResponseHandler.success(res, {
        isConfigured,
        provider: 'Google Gemini',
        model: 'gemini-2.5-flash / gemini-2.0-flash',
      }, 'Lấy trạng thái cấu hình AI thành công');
    } catch (err) {
      next(err);
    }
  }

  static async tutorChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { messages, mode, assessmentStep, userLevel, lang, language } = req.body;
      const selectedLang = (lang === 'en' || language === 'en') ? 'en' : 'vi';
      const result = await aiService.tutorChat({
        messages: Array.isArray(messages) ? messages : [],
        mode,
        assessmentStep: typeof assessmentStep === 'number' ? assessmentStep : 0,
        userLevel,
        lang: selectedLang,
      });

      return ApiResponseHandler.success(res, result, 'Phản hồi từ AI Tutor thành công');
    } catch (err) {
      next(err);
    }
  }
}

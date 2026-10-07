import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { ExtractedVocabItem } from '../utils/textExtractor';

export interface AiAnalyzeResponse {
  translation: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  levelReason: string;
  suggestedTitle: string;
  items: ExtractedVocabItem[];
  isAiPowered: boolean;
}

export interface AiExplainResponse {
  word: string;
  phonetic?: string;
  pos: string;
  meaning: string;
  synonyms?: string[];
  antonyms?: string[];
  collocations?: string[];
  exampleSentences?: Array<{ en: string; vi: string }>;
  grammarNotes?: string;
  isAiPowered: boolean;
}

export interface AiStatusResponse {
  isConfigured: boolean;
  provider: string;
  model: string;
}

export const aiApi = {
  analyzeText: async (text: string): Promise<AiAnalyzeResponse> => {
    try {
      const res = (await axiosInstance.post(ENDPOINTS.AI_ANALYZE_TEXT, { text })) as any;
      const data = res?.data || res;
      if (data && data.items) {
        return {
          ...data,
          items: data.items.map((item: any) => ({
            ...item,
            selected: true,
          })),
        };
      }
      throw new Error('Định dạng dữ liệu AI không hợp lệ');
    } catch (err: any) {
      console.warn('aiApi.analyzeText error, falling back:', err?.message || err);
      throw err;
    }
  },

  explainWord: async (
    word: string,
    contextSentence?: string,
    currentMeaning?: string,
    pos?: string,
    lang?: 'en' | 'vi'
  ): Promise<AiExplainResponse> => {
    try {
      const res = (await axiosInstance.post(ENDPOINTS.AI_EXPLAIN_WORD, {
        word,
        contextSentence,
        currentMeaning,
        pos,
        lang,
      })) as any;
      return res?.data || res;
    } catch (err: any) {
      console.warn('aiApi.explainWord error:', err?.message || err);
      throw err;
    }
  },

  getStatus: async (): Promise<AiStatusResponse> => {
    try {
      const res = (await axiosInstance.get(ENDPOINTS.AI_STATUS)) as any;
      return res?.data || res;
    } catch (err: any) {
      console.warn('aiApi.getStatus error:', err?.message || err);
      return {
        isConfigured: false,
        provider: 'Google Gemini',
        model: 'gemini-2.5-flash',
      };
    }
  },

  tutorChat: async (params: {
    messages: Array<{ role: 'user' | 'model'; content: string }>;
    mode?: 'chat' | 'assessment';
    assessmentStep?: number;
    userLevel?: string;
    lang?: 'en' | 'vi';
  }): Promise<TutorChatResponse> => {
    try {
      const res = (await axiosInstance.post(ENDPOINTS.AI_TUTOR_CHAT, params)) as any;
      return res?.data || res;
    } catch (err: any) {
      console.warn('aiApi.tutorChat error:', err?.message || err);
      throw err;
    }
  },
};

export interface CefrAssessmentResult {
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  levelTitle: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedCategory: 'Beginner' | 'Intermediate' | 'Advanced' | 'IELTS' | 'TOEIC';
  suggestedDeckTopics: string[];
  recommendedDecks?: Array<{
    id: string;
    title: string;
    category: string;
    itemCount: number;
  }>;
}

export interface TutorChatResponse {
  reply: string;
  isAssessmentComplete?: boolean;
  assessmentResult?: CefrAssessmentResult;
  correctedSentence?: string;
  grammarTip?: string;
}

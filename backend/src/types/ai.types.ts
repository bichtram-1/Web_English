export type VocabCategoryType = 'vocab' | 'phrase' | 'grammar';
export type VocabPOS = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'idiom' | 'sentence' | 'grammar' | 'other';

export interface AnalyzeTextDTO {
  text: string;
}

export interface ExplainWordDTO {
  word: string;
  contextSentence?: string;
  currentMeaning?: string;
  pos?: string;
  lang?: 'en' | 'vi';
}

export interface AiExtractedItem {
  id?: string;
  word: string;
  pos: VocabPOS;
  categoryType: VocabCategoryType;
  meaning: string;
  contextSentence: string;
  phonetic?: string;
  grammarRule?: string;
  grammarExplanation?: string;
}

export interface AiAnalyzeResult {
  translation: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  levelReason: string;
  suggestedTitle: string;
  items: AiExtractedItem[];
  isAiPowered: boolean;
}

export interface AiExplainResult {
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

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface TutorChatDTO {
  messages: ChatMessage[];
  mode?: 'chat' | 'assessment';
  assessmentStep?: number; // 0, 1, 2, 3
  userLevel?: string;
  lang?: 'en' | 'vi';
}

export interface RecommendedDeckSummary {
  id: string;
  title: string;
  category: string;
  itemCount: number;
}

export interface CefrAssessmentResult {
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  levelTitle: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedCategory: 'Beginner' | 'Intermediate' | 'Advanced' | 'IELTS' | 'TOEIC';
  suggestedDeckTopics: string[];
  recommendedDecks?: RecommendedDeckSummary[];
}

export interface TutorChatResult {
  reply: string;
  isAssessmentComplete?: boolean;
  assessmentResult?: CefrAssessmentResult;
  correctedSentence?: string;
  grammarTip?: string;
}

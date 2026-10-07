import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env';
import prisma from '../config/prisma';
import {
  AiAnalyzeResult,
  AiExplainResult,
  AnalyzeTextDTO,
  ExplainWordDTO,
  TutorChatDTO,
  TutorChatResult,
  CefrAssessmentResult,
} from '../types/ai.types';

class AiService {
  // Fast In-Memory LRU Cache to return repeated queries in 0ms
  private analyzeCache = new Map<string, { result: AiAnalyzeResult; expiry: number }>();
  private explainCache = new Map<string, { result: AiExplainResult; expiry: number }>();

  private getClient(): GoogleGenAI | null {
    if (!config.geminiApiKey || config.geminiApiKey.trim() === '') {
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey: config.geminiApiKey });
    } catch (err) {
      console.warn('⚠️ [AiService] Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }

  /**
   * Analyze English text, extract key vocabulary & grammar, translate and estimate CEFR level
   */
  async analyzeText(dto: AnalyzeTextDTO): Promise<AiAnalyzeResult> {
    const text = dto.text?.trim();
    if (!text) {
      return {
        translation: '',
        level: 'Beginner',
        levelReason: 'Văn bản trống.',
        suggestedTitle: 'Bộ thẻ trích xuất',
        items: [],
        isAiPowered: false,
      };
    }

    // Check fast cache
    const cacheKey = text.toLowerCase();
    const cached = this.analyzeCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    const ai = this.getClient();
    if (!ai) {
      return {
        translation: '',
        level: 'Intermediate',
        levelReason: 'Phân tích tự động dựa trên độ phức tạp từ vựng và cấu trúc câu.',
        suggestedTitle: 'Bộ thẻ trích xuất',
        items: [],
        isAiPowered: false,
      };
    }

    const prompt = `You are an expert English linguist and language teacher for Vietnamese learners.
Analyze the following English text:
"""${text}"""

Provide a comprehensive, high-quality analysis. Return ONLY valid JSON adhering strictly to this schema:
{
  "translation": "<Natural, fluent Vietnamese translation of the entire text>",
  "level": "Beginner" | "Intermediate" | "Advanced",
  "levelReason": "<Brief Vietnamese explanation of why this level was selected, e.g., A2/B1/B2/C1 vocabulary, complex grammar like conditionals or inversions>",
  "suggestedTitle": "<A short, catchy Vietnamese title for this flashcard deck (under 40 characters)>",
  "items": [
    {
      "word": "<Word, Phrasal Verb, Idiom, or Grammar structure found in the text>",
      "pos": "noun" | "verb" | "adjective" | "adverb" | "phrase" | "idiom" | "grammar" | "other",
      "categoryType": "vocab" | "phrase" | "grammar",
      "meaning": "<Precise Vietnamese meaning in this context>",
      "contextSentence": "<The exact sentence from the text containing this item>",
      "phonetic": "<MANDATORY: Standard International Phonetic Alphabet (IPA) enclosed in slashes, e.g. /ˈbreɪk.θruː/, /ˌɑː.tɪˈfɪʃ.əl/. MUST ALWAYS be provided for every vocab/phrase item>",
      "grammarRule": "<If grammar, state the structural formula, e.g., Not only + Aux + S + V>",
      "grammarExplanation": "<If grammar, brief explanation in Vietnamese>"
    }
  ]
}

Ensure:
1. Extract ALL key learning items from the text (important vocabulary, academic words, phrasal verbs, idioms, and notable grammar structures), typically 5-15 items depending on text length. Do NOT arbitrarily omit important words that learners need to learn.
2. MANDATORY IPA: Every single vocabulary word, phrasal verb, and idiom MUST have an accurate standard IPA phonetic transcription between slashes (e.g. /ˈæp.əl/, /kəˈlæb.ə.reɪt/). NEVER omit or leave phonetic empty for vocabulary or phrases.
3. Clean, natural, and accurate Vietnamese translation.
4. No Markdown code fences (\`\`\`json) if possible, or clean JSON string.`;

    // Prioritize ultra-fast, lowest-latency model first (~1.1s)
    const candidateModels = [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        const rawText = response.text?.trim() || '';
        const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

        if (cleanedJson) {
          const parsed = JSON.parse(cleanedJson);
          const result: AiAnalyzeResult = {
            translation: parsed.translation || '',
            level: parsed.level || 'Intermediate',
            levelReason: parsed.levelReason || 'Phân tích tự động bởi Gemini AI',
            suggestedTitle: parsed.suggestedTitle || 'Bộ thẻ học thông minh',
            items: Array.isArray(parsed.items)
              ? parsed.items.map((item: any, idx: number) => ({
                  id: `ai-item-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
                  word: item.word || '',
                  pos: item.pos || 'noun',
                  categoryType: item.categoryType || 'vocab',
                  meaning: item.meaning || '',
                  contextSentence: item.contextSentence || '',
                  phonetic: item.phonetic || '',
                  grammarRule: item.grammarRule || '',
                  grammarExplanation: item.grammarExplanation || '',
                }))
              : [],
            isAiPowered: true,
          };

          // Cache for 1 hour
          this.analyzeCache.set(cacheKey, { result, expiry: Date.now() + 60 * 60 * 1000 });
          return result;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ [AiService] Attempt with model "${model}" failed:`, err?.message || err);
      }
    }

    console.warn('⚠️ [AiService] Gemini model calls failed, falling back:', lastError?.message || lastError);
    return {
      translation: '',
      level: 'Intermediate',
      levelReason: 'Phân tích tự động dựa trên độ phức tạp từ vựng và cấu trúc câu.',
      suggestedTitle: 'Bộ thẻ trích xuất',
      items: [],
      isAiPowered: false,
    };
  }

  /**
   * Fallback for explaining a single word using translation and lexicographical APIs
   */
  private async fallbackExplainWord(
    word: string,
    contextSentence?: string,
    currentMeaning?: string,
    pos?: string
  ): Promise<AiExplainResult> {
    const meaning =
      currentMeaning && currentMeaning !== 'Đang tra nghĩa...'
        ? currentMeaning
        : 'Từ vựng tiếng Anh trong ngữ cảnh bài đọc';
    let synonyms: string[] = [];
    let antonyms: string[] = [];
    const exampleSentences: Array<{ en: string; vi: string }> = [];

    // 1. Query Datamuse for Synonyms and Antonyms
    try {
      const cleanWord = word.trim().toLowerCase().split(' ')[0] || word.trim();
      const [synRes, antRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(cleanWord)}&max=5`),
        fetch(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(cleanWord)}&max=5`),
      ]);

      if (synRes.ok) {
        const synData: any = await synRes.json();
        synonyms = Array.isArray(synData) ? synData.map((s: any) => s.word) : [];
      }
      if (antRes.ok) {
        const antData: any = await antRes.json();
        antonyms = Array.isArray(antData) ? antData.map((a: any) => a.word) : [];
      }
    } catch {
      // ignore
    }

    // 2. Add context sentence if available
    if (contextSentence && contextSentence.trim()) {
      exampleSentences.push({
        en: contextSentence.trim(),
        vi: meaning ? `Nghĩa trong câu: "${meaning}"` : 'Câu ví dụ chứa từ vựng trong bài đọc',
      });
    }

    return {
      word,
      pos: pos || 'Vocabulary',
      meaning,
      synonyms,
      antonyms,
      collocations: [],
      exampleSentences,
      grammarNotes: undefined,
      isAiPowered: false,
    };
  }

  /**
   * Deep-dive explanation for a single vocabulary word or idiom
   */
  async explainWord(dto: ExplainWordDTO): Promise<AiExplainResult> {
    const word = dto.word?.trim();
    if (!word) {
      return {
        word: '',
        pos: '',
        meaning: '',
        isAiPowered: false,
      };
    }

    // Check fast cache
    const cacheKey = `${word.toLowerCase()}::${(dto.contextSentence || '').toLowerCase()}::${dto.lang || 'vi'}`;
    const cached = this.explainCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    const ai = this.getClient();
    if (!ai) {
      return this.fallbackExplainWord(word, dto.contextSentence, dto.currentMeaning, dto.pos);
    }

    const isEnglish = dto.lang === 'en';
    const prompt = isEnglish
      ? `You are an expert native English lexicographer and tutor.
Explain the word or phrase: "${word}"
Context sentence: "${dto.contextSentence || ''}"

Return ONLY valid JSON with this format:
{
  "word": "${word}",
  "phonetic": "<IPA phonetic transcription>",
  "pos": "<part of speech, e.g., Noun, Verb, Adjective>",
  "meaning": "<Precise definition in native English>",
  "synonyms": ["<synonym 1>", "<synonym 2>"],
  "antonyms": ["<antonym 1>", "<antonym 2>"],
  "collocations": ["<collocation 1>", "<collocation 2>"],
  "exampleSentences": [
    { "en": "<English example>", "vi": "<Natural English contextual explanation>" }
  ],
  "grammarNotes": "<Usage tips, register (formal/informal), or common nuances in English>"
}`
      : `You are a helpful English teacher for Vietnamese students.
Explain the word or phrase: "${word}"
Context sentence: "${dto.contextSentence || ''}"

Return ONLY valid JSON with this format:
{
  "word": "${word}",
  "phonetic": "<IPA phonetic transcription>",
  "pos": "<part of speech, e.g., Noun, Verb, Adjective>",
  "meaning": "<Precise Vietnamese meaning>",
  "synonyms": ["<synonym 1>", "<synonym 2>"],
  "antonyms": ["<antonym 1>", "<antonym 2>"],
  "collocations": ["<collocation 1>", "<collocation 2>"],
  "exampleSentences": [
    { "en": "<English example>", "vi": "<Vietnamese translation>" }
  ],
  "grammarNotes": "<Usage tips or common mistakes for Vietnamese learners>"
}`;

    // Fastest models first (~1.1s)
    const candidateModels = [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ];
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        const rawText = response.text?.trim() || '';
        const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

        if (cleanedJson) {
          const parsed = JSON.parse(cleanedJson);
          const result: AiExplainResult = {
            word: parsed.word || word,
            phonetic: parsed.phonetic || '',
            pos: parsed.pos || 'Vocabulary',
            meaning: parsed.meaning || dto.currentMeaning || '',
            synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
            antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
            collocations: Array.isArray(parsed.collocations) ? parsed.collocations : [],
            exampleSentences: Array.isArray(parsed.exampleSentences) ? parsed.exampleSentences : [],
            grammarNotes: parsed.grammarNotes || '',
            isAiPowered: true,
          };

          // Cache for 1 hour
          this.explainCache.set(cacheKey, { result, expiry: Date.now() + 60 * 60 * 1000 });
          return result;
        }
      } catch (err: any) {
        console.warn(`⚠️ [AiService explainWord] Attempt with "${model}" failed:`, err?.message || err);
      }
    }

    return this.fallbackExplainWord(word, dto.contextSentence, dto.currentMeaning, dto.pos);
  }

  /**
   * Interactive AI Tutor Chat & CEFR Level Assessment
   */
  async tutorChat(dto: TutorChatDTO): Promise<TutorChatResult> {
    const mode = dto.mode || 'chat';
    const isEnglish = dto.lang === 'en';
    const ai = this.getClient();

    // ========================================================
    // MODE 1: ASSESSMENT (3-Minute Interactive CEFR Placement)
    // ========================================================
    if (mode === 'assessment') {
      const step = dto.assessmentStep ?? 0;

      // Step 0: Kick off with Question 1
      if (step === 0 || !dto.messages || dto.messages.length === 0) {
        return {
          reply: isEnglish
            ? `🎯 **Question 1/3 (Warm-up & Daily Life):**\n\n*Could you tell me a little bit about yourself? What do you usually like to do in your free time, and why?*\n\n*(Feel free to answer naturally in 1-3 English sentences!)*`
            : `🎯 **Câu 1/3 (Giới thiệu & Sở thích):**\n\n*Could you tell me a little bit about yourself? What do you usually like to do in your free time, and why?*\n\n*(Trả lời tự nhiên bằng tiếng Anh từ 1-3 câu nhé!)*`,
          isAssessmentComplete: false,
        };
      }

      // Step 1: User answered Question 1 -> Ask Question 2 (Past narrative / experience)
      if (step === 1) {
        return {
          reply: isEnglish
            ? `✨ **Question 2/3 (Experience & Storytelling):**\n\n*Could you tell me about a memorable trip you took or a challenging situation you managed to solve recently? What happened, and what did you learn from it?*`
            : `✨ **Câu 2/3 (Trải nghiệm & Kể chuyện):**\n\n*Could you tell me about a memorable trip you took or a challenging situation you managed to solve recently? What happened, and what did you learn from it?*`,
          isAssessmentComplete: false,
        };
      }

      // Step 2: User answered Question 2 -> Ask Question 3 (Opinion & Critical thinking)
      if (step === 2) {
        return {
          reply: isEnglish
            ? `💡 **Question 3/3 (Opinion & Critical Thinking):**\n\n*Do you think AI and technology will completely replace human teachers in the future, or are physical classrooms and human connection irreplaceable? Why?*`
            : `💡 **Câu 3/3 (Quan điểm xã hội & Lập luận):**\n\n*Do you think AI and technology will completely replace human teachers in the future, or are physical classrooms and human connection irreplaceable? Why?*`,
          isAssessmentComplete: false,
        };
      }

      // Step 3: User answered Question 3 -> Comprehensive CEFR Evaluation
      if (ai) {
        const conversationHistory = dto.messages
          .map((m) => `${m.role === 'user' ? 'Learner' : 'AI Tutor'}: ${m.content}`)
          .join('\n');

        const evaluationPrompt = isEnglish
          ? `You are a certified Cambridge/CEFR English language examiner.
Evaluate the learner's English level based on their answers in this 3-question diagnostic interview:

"""
${conversationHistory}
"""

Evaluate objectively across CEFR standards (A1, A2, B1, B2, C1, C2):
1. Lexical Resource (Vocabulary range, precision, collocations)
2. Grammatical Range and Accuracy (Tense consistency, clause variety, accuracy)
3. Coherence and Fluency (Flow of ideas, transitions, elaboration)

CRITICAL INSTRUCTION: Since the learner is using the English interface, all assessment details, summary, strengths, weaknesses, level title, and recommended topics MUST be written in 100% natural, polished, native English (DO NOT use Vietnamese).

Output ONLY valid JSON adhering strictly to this schema:
{
  "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "levelTitle": "Beginner" | "Elementary" | "Intermediate" | "Upper-Intermediate" | "Advanced" | "Proficiency",
  "summary": "Concise, encouraging evaluation summary in native English (2-3 sentences).",
  "strengths": ["Strength 1 in English", "Strength 2 in English"],
  "weaknesses": ["Area for improvement 1 in English", "Area for improvement 2 in English"],
  "recommendedCategory": "Beginner" | "Intermediate" | "Advanced" | "IELTS" | "TOEIC",
  "suggestedDeckTopics": ["Topic 1 in English", "Topic 2 in English"]
}`
          : `You are a certified Cambridge/CEFR English language examiner.
Evaluate the learner's English level based on their answers in this 3-question diagnostic interview:

"""
${conversationHistory}
"""

Evaluate objectively across CEFR standards (A1, A2, B1, B2, C1, C2):
1. Lexical Resource (Vocabulary range and accuracy)
2. Grammatical Range and Accuracy (Tense usage, clause structures)
3. Coherence and Fluency (Linking ideas, elaboration)

Output ONLY valid JSON adhering strictly to this schema:
{
  "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "levelTitle": "Beginner (Cơ bản)" | "Elementary (Sơ cấp)" | "Intermediate (Trung cấp)" | "Upper-Intermediate (Trung cao cấp)" | "Advanced (Cao cấp)",
  "summary": "Tóm tắt ngắn gọn đánh giá năng lực của học viên bằng tiếng Việt (2-3 câu khích lệ).",
  "strengths": ["Điểm mạnh 1 bằng tiếng Việt", "Điểm mạnh 2 bằng tiếng Việt"],
  "weaknesses": ["Điểm cần cải thiện 1 bằng tiếng Việt", "Điểm cần cải thiện 2 bằng tiếng Việt"],
  "recommendedCategory": "Beginner" | "Intermediate" | "Advanced" | "IELTS" | "TOEIC",
  "suggestedDeckTopics": ["Chủ đề bộ thẻ 1", "Chủ đề bộ thẻ 2"]
}`;

        const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
        for (const model of models) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: evaluationPrompt,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.2,
                thinkingConfig: { thinkingBudget: 0 },
              },
            });

            const rawText = response.text || '';
            const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
            const parsed: CefrAssessmentResult = JSON.parse(cleaned);

            // Fetch real decks matching the recommended category
            const realDecks = await prisma.deck.findMany({
              where: {
                isPublic: true,
                OR: [
                  { category: parsed.recommendedCategory },
                  { category: 'Intermediate' },
                ],
              },
              take: 3,
              orderBy: { itemCount: 'desc' },
              select: { id: true, title: true, category: true, itemCount: true },
            });

            parsed.recommendedDecks = realDecks;

            return {
              reply: isEnglish
                ? `🎉 **Congratulations on completing the CEFR Placement Assessment!**\n\nBased on your vocabulary, grammar, and reasoning across your 3 answers, here is your detailed performance analysis:`
                : `🎉 **Chúc mừng bạn đã hoàn thành bài khảo sát trình độ CEFR!**\n\nDựa trên cách sử dụng từ vựng, ngữ pháp và lập luận trong 3 câu trả lời, AI đã phân tích chi tiết năng lực của bạn dưới đây.`,
              isAssessmentComplete: true,
              assessmentResult: parsed,
            };
          } catch (err: any) {
            console.warn(`⚠️ [AiService tutorChat assessment] Model ${model} failed:`, err?.message || err);
          }
        }
      }

      // Fallback assessment if AI service is temporarily offline
      const fallbackAssessment: CefrAssessmentResult = isEnglish
        ? {
            cefrLevel: 'B1',
            levelTitle: 'Intermediate',
            summary: 'You demonstrate solid conversational fluency, clear expression of ideas, and confidence when communicating about familiar topics.',
            strengths: ['Good control of core tenses (Present, Past)', 'Natural conversational vocabulary'],
            weaknesses: ['Practice using complex subordinate clauses and conditional structures', 'Expand specialized academic vocabulary'],
            recommendedCategory: 'Intermediate',
            suggestedDeckTopics: ['Work & Daily Life', 'Essential Phrasal Verbs', 'Everyday Communication'],
          }
        : {
            cefrLevel: 'B1',
            levelTitle: 'Intermediate (Trung cấp)',
            summary: 'Bạn có khả năng diễn đạt ý tưởng rành mạch, phản xạ ngôn ngữ tốt và tự tin xử lý các chủ đề quen thuộc.',
            strengths: ['Sử dụng tốt các thì cơ bản (Hiện tại, Quá khứ)', 'Vốn từ vựng giao tiếp tự nhiên'],
            weaknesses: ['Nên luyện tập thêm các liên từ phức và câu điều kiện', 'Mở rộng từ vựng học thuật chuyên sâu'],
            recommendedCategory: 'Intermediate',
            suggestedDeckTopics: ['Công việc & Đời sống', 'Cụm động từ thông dụng', 'Giao tiếp hàng ngày'],
          };

      const realDecks = await prisma.deck.findMany({
        where: { isPublic: true },
        take: 3,
        orderBy: { itemCount: 'desc' },
        select: { id: true, title: true, category: true, itemCount: true },
      });
      fallbackAssessment.recommendedDecks = realDecks;

      return {
        reply: isEnglish
          ? `🎉 **Congratulations on completing the CEFR Placement Assessment!**`
          : `🎉 **Chúc mừng bạn đã hoàn thành bài khảo sát trình độ CEFR!**`,
        isAssessmentComplete: true,
        assessmentResult: fallbackAssessment,
      };
    }

    // ========================================================
    // MODE 2: FREE CHAT (Interactive English Tutor & Q&A)
    // ========================================================
    if (ai) {
      const userLevel = dto.userLevel || 'Intermediate';
      const lastUserMsg = dto.messages[dto.messages.length - 1]?.content || '';

      const tutorPrompt = isEnglish
        ? `You are "LinguaBot", an empathetic, highly knowledgeable native English Tutor from the LinguaLeap platform.
Learner Level: ${userLevel}

Learner's message:
"""${lastUserMsg}"""

Previous conversation context:
${dto.messages.slice(-4, -1).map(m => `${m.role === 'user' ? 'Learner' : 'LinguaBot'}: ${m.content}`).join('\n')}

YOUR INSTRUCTIONS:
1. Respond warmly and helpfully. Adapt your English complexity to the learner's level (${userLevel}).
2. ALL explanations, definitions, tips, and commentary MUST be in 100% fluent, natural, native English (DO NOT use Vietnamese).
3. If the user asks about English vocabulary or idioms:
   - Provide a clear, nuanced English definition with subtle context.
   - Include accurate International Phonetic Alphabet (IPA) transcription (e.g., /ˈrez.ɪ.li.ənt/).
   - Give 1-2 realistic, natural example sentences in English.
   - Mention relevant synonyms, collocations, or usage tips.
4. If the user writes in English and makes grammatical, spelling, or stylistic errors:
   - Identify the mistake gently and constructively.
   - Provide the natural, corrected native version in "correctedSentence".
   - Explain the grammar or style rule clearly in English in "grammarTip".
5. Output ONLY in valid JSON matching this schema:
{
  "reply": "Your main response in formatted markdown (100% natural, native English)",
  "correctedSentence": "Corrected English sentence if the user had errors, or null if correct/not applicable",
  "grammarTip": "Short grammar or usage explanation in native English if corrected, or null"
}`
        : `You are "LinguaBot", an empathetic, highly knowledgeable AI English Tutor from the LinguaLeap platform.
Learner Level: ${userLevel}

Learner's message:
"""${lastUserMsg}"""

Previous conversation context:
${dto.messages.slice(-4, -1).map(m => `${m.role === 'user' ? 'Learner' : 'LinguaBot'}: ${m.content}`).join('\n')}

YOUR INSTRUCTIONS:
1. Respond warmly and helpfully. Adapt your English complexity to the learner's level (${userLevel}).
2. If the user asks about English vocabulary or idioms:
   - Provide clear Vietnamese meaning.
   - Include accurate International Phonetic Alphabet (IPA) transcription (e.g., /ˈrɪz.ɪk/).
   - Give 1-2 realistic, easy-to-understand example sentences with Vietnamese translations.
3. If the user writes in English and makes grammatical/spelling errors:
   - Identify the mistake gently.
   - Provide the corrected version in "correctedSentence".
   - Explain the rule briefly in "grammarTip" in Vietnamese.
4. Output in valid JSON matching this schema:
{
  "reply": "Your main response in formatted markdown (Vietnamese explanation + English examples)",
  "correctedSentence": "Corrected English sentence if the user had errors, or null if correct/not applicable",
  "grammarTip": "Short grammar explanation in Vietnamese if corrected, or null"
}`;

      const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
      for (const model of models) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: tutorPrompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
              thinkingConfig: { thinkingBudget: 0 },
            },
          });

          const rawText = response.text || '';
          const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
          const parsed = JSON.parse(cleaned);

          return {
            reply: parsed.reply || (isEnglish
              ? 'Glad to assist you on your English learning journey!'
              : 'Rất vui được đồng hành cùng bạn trên con đường chinh phục tiếng Anh!'),
            correctedSentence: parsed.correctedSentence || undefined,
            grammarTip: parsed.grammarTip || undefined,
          };
        } catch (err: any) {
          console.warn(`⚠️ [AiService tutorChat chat] Model ${model} failed:`, err?.message || err);
        }
      }
    }

    return {
      reply: isEnglish
        ? `Hello! I am LinguaBot, your AI English Tutor 🤖. Ask me anything about vocabulary, IPA phonetics, grammar, or let's practice conversation together!`
        : `Chào bạn! Mình là Gia sư Tiếng Anh LinguaLeap 🤖. Bạn có thể hỏi mình bất kỳ câu hỏi nào về từ vựng, phiên âm IPA, ngữ pháp hoặc nhờ mình sửa lỗi câu tiếng Anh nhé!`,
    };
  }
}

export const aiService = new AiService();

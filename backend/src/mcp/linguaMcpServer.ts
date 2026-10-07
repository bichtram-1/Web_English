import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import prisma from '../config/prisma';
import { aiService } from '../services/ai.service';

/**
 * LinguaLeap Model Context Protocol (MCP) Server
 * Exposes LinguaLeap database, vocabulary engine, and AI capabilities
 * to Claude Desktop, Cursor, Antigravity, and other LLM agent clients.
 */
export function createLinguaMcpServer(): McpServer {
  const server = new McpServer({
    name: 'lingualeap-mcp-server',
    version: '1.0.0',
  });

  // ==========================================
  // 1. MCP TOOLS (Function Calling for LLMs)
  // ==========================================

  /**
   * Tool 1: search_cards
   * Search vocabulary flashcards by keyword, topic, or translation with IPA and examples
   */
  server.tool(
    'search_cards',
    'Tìm kiếm thẻ từ vựng trong kho LinguaLeap theo từ khóa tiếng Anh hoặc tiếng Việt. Trả về từ, phiên âm IPA, nghĩa, và câu ví dụ ngữ cảnh.',
    {
      query: z.string().describe('Từ khóa cần tìm kiếm (tiếng Anh hoặc nghĩa tiếng Việt, ví dụ: "resilient", "may mắn", "work")'),
      category: z.enum(['Beginner', 'Intermediate', 'Advanced', 'IELTS', 'TOEIC']).optional().describe('Lọc theo trình độ/chủ đề (tùy chọn)'),
      limit: z.number().min(1).max(50).default(10).optional().describe('Số lượng thẻ tối đa cần lấy (mặc định 10)'),
    },
    async ({ query, category, limit = 10 }) => {
      try {
        const whereClause: any = {
          type: 'flashcard',
          OR: [
            { front: { contains: query, mode: 'insensitive' } },
            { back: { contains: query, mode: 'insensitive' } },
            { exampleEn: { contains: query, mode: 'insensitive' } },
            { exampleVi: { contains: query, mode: 'insensitive' } },
          ],
        };

        if (category) {
          whereClause.deck = { category };
        }

        const cards = await prisma.card.findMany({
          where: whereClause,
          take: limit,
          select: {
            id: true,
            front: true,
            back: true,
            phonetic: true,
            exampleEn: true,
            exampleVi: true,
            deck: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        });

        const formatted = cards.map((c) => ({
          id: c.id,
          word: c.front,
          phoneticIPA: c.phonetic || '(chưa cập nhật)',
          meaningVi: c.back,
          exampleEn: c.exampleEn || null,
          exampleVi: c.exampleVi || null,
          deckTitle: c.deck?.title || null,
          deckCategory: c.deck?.category || null,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  totalFound: formatted.length,
                  query,
                  results: formatted,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Lỗi khi tìm kiếm từ vựng: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Tool 2: create_deck
   * Create a new flashcard deck with vocabulary cards directly in LinguaLeap
   */
  server.tool(
    'create_deck',
    'Tạo một bộ thẻ từ vựng (Deck) mới trong cơ sở dữ liệu LinguaLeap kèm danh sách flashcards có đầy đủ IPA và ví dụ.',
    {
      title: z.string().describe('Tiêu đề bộ thẻ (ví dụ: "Từ vựng IELTS Công Nghệ Cao")'),
      description: z.string().optional().describe('Mô tả chi tiết nội dung bộ thẻ'),
      category: z.enum(['Beginner', 'Intermediate', 'Advanced', 'IELTS', 'TOEIC']).default('Intermediate').describe('Cấp độ phù hợp'),
      isPublic: z.boolean().default(true).describe('Công khai bộ thẻ cho mọi người cùng học'),
      cards: z.array(
        z.object({
          front: z.string().describe('Từ vựng tiếng Anh'),
          back: z.string().describe('Nghĩa tiếng Việt'),
          phonetic: z.string().optional().describe('Phiên âm quốc tế IPA (ví dụ: "/rɪˈzɪl.jənt/")'),
          exampleEn: z.string().optional().describe('Câu ví dụ tiếng Anh'),
          exampleVi: z.string().optional().describe('Bản dịch câu ví dụ sang tiếng Việt'),
        })
      ).min(1).describe('Danh sách các thẻ từ vựng cần thêm vào bộ thẻ'),
    },
    async ({ title, description, category, isPublic, cards }) => {
      try {
        let botUser = await prisma.user.findFirst({
          where: { email: 'system.bot@lingualeap.edu.vn' },
        });

        if (!botUser) {
          botUser = await prisma.user.create({
            data: {
              name: 'LinguaBot 🤖',
              email: 'system.bot@lingualeap.edu.vn',
              passwordHash: '$2a$10$SystemBotPasswordHashPlaceholderN8N2026',
              role: 'admin',
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LinguaBot',
            },
          });
        }

        const deck = await prisma.deck.create({
          data: {
            title,
            description: description || `Bộ thẻ được tạo tự động thông qua giao thức MCP (Model Context Protocol).`,
            category,
            isPublic,
            itemCount: cards.length,
            creatorId: botUser.id,
            creatorName: 'AI Agent (qua MCP)',
            color: 'from-violet-600 via-indigo-600 to-cyan-500',
            cards: {
              create: cards.map((c, idx) => ({
                type: 'flashcard',
                front: c.front.trim(),
                back: c.back.trim(),
                phonetic: c.phonetic?.trim() || null,
                exampleEn: c.exampleEn?.trim() || null,
                exampleVi: c.exampleVi?.trim() || null,
                orderIndex: idx,
              })),
            },
          },
          include: {
            cards: true,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Đã tạo thành công bộ thẻ "${deck.title}" trên LinguaLeap!`,
                  deckId: deck.id,
                  title: deck.title,
                  category: deck.category,
                  cardCount: deck.cards.length,
                  webUrl: `/deck/${deck.id}`,
                  studyUrl: `/deck/${deck.id}/study`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Lỗi khi tạo bộ thẻ qua MCP: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Tool 3: get_study_stats
   * Query learning analytics (Streak, XP, cards studied, accuracy) from LinguaLeap
   */
  server.tool(
    'get_study_stats',
    'Lấy số liệu thống kê học tập (chuỗi Streak, tổng số thẻ đã học, XP, độ chính xác, lịch sử ôn tập gần nhất) của học viên trên LinguaLeap.',
    {
      userId: z.string().optional().describe('Mã định danh người dùng (tùy chọn; nếu không truyền sẽ lấy người dùng hoạt động tích cực nhất)'),
    },
    async ({ userId }) => {
      try {
        let statsRecord = userId
          ? await prisma.userStats.findUnique({
              where: { userId },
              include: { user: { select: { id: true, name: true, email: true } } },
            })
          : await prisma.userStats.findFirst({
              orderBy: { streakDays: 'desc' },
              include: { user: { select: { id: true, name: true, email: true } } },
            });

        if (!statsRecord) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: 'Chưa có dữ liệu thống kê học tập nào được ghi nhận trên hệ thống.',
                }),
              },
            ],
          };
        }

        // Get recent study sessions
        const recentSessions = await prisma.studySession.findMany({
          where: { userId: statsRecord.userId },
          take: 5,
          orderBy: { completedAt: 'desc' },
          include: { deck: { select: { title: true, category: true } } },
        });

        const result = {
          learnerName: statsRecord.user?.name || 'Học viên',
          email: statsRecord.user?.email || '',
          streakDays: statsRecord.streakDays,
          totalCardsStudied: statsRecord.totalCardsStudied,
          totalXp: statsRecord.totalXp,
          averageAccuracy: `${statsRecord.averageAccuracy.toFixed(1)}%`,
          sessionsCompleted: statsRecord.sessionsCompleted,
          lastStudyDate: statsRecord.lastStudyDate,
          recentActivity: recentSessions.map((s) => ({
            deckTitle: s.deck?.title,
            mode: s.mode,
            accuracy: `${s.accuracy.toFixed(1)}%`,
            cardsStudied: s.cardsStudied,
            xpEarned: s.xpEarned,
            completedAt: s.completedAt,
          })),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Lỗi khi truy vấn thống kê học tập: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Tool 4: extract_and_save_vocab
   * Use LinguaLeap AI (Gemini Flash-Lite with 100% IPA) to extract key vocabulary from arbitrary text
   * and save directly as a study deck
   */
  server.tool(
    'extract_and_save_vocab',
    'Nhận một đoạn văn bản tiếng Anh (bài báo, email, tài liệu), tự động dùng mô hình AI trích xuất các từ vựng học thuật quan trọng (kèm phiên âm IPA chuẩn, nghĩa tiếng Việt, câu ví dụ) và tạo thành bộ thẻ trên LinguaLeap.',
    {
      text: z.string().min(10).describe('Đoạn văn bản tiếng Anh cần phân tích và trích xuất từ vựng'),
      deckTitle: z.string().describe('Tên bộ thẻ sẽ được lưu trên hệ thống'),
      category: z.enum(['Beginner', 'Intermediate', 'Advanced', 'IELTS', 'TOEIC']).default('Intermediate').describe('Cấp độ phân loại bộ thẻ'),
    },
    async ({ text, deckTitle, category }) => {
      try {
        const enriched = await aiService.analyzeText({ text });
        if (!enriched || !enriched.items || enriched.items.length === 0) {
          throw new Error('AI không tìm thấy từ vựng học thuật phù hợp trong đoạn văn bản.');
        }

        let botUser = await prisma.user.findFirst({
          where: { email: 'system.bot@lingualeap.edu.vn' },
        });

        if (!botUser) {
          botUser = await prisma.user.create({
            data: {
              name: 'LinguaBot 🤖',
              email: 'system.bot@lingualeap.edu.vn',
              passwordHash: '$2a$10$SystemBotPasswordHashPlaceholderN8N2026',
              role: 'admin',
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LinguaBot',
            },
          });
        }

        const deck = await prisma.deck.create({
          data: {
            title: deckTitle,
            description: `Trích xuất từ vựng tự động bởi AI qua MCP Server từ đoạn văn bản (${enriched.items.length} từ).`,
            category,
            isPublic: true,
            itemCount: enriched.items.length,
            creatorId: botUser.id,
            creatorName: 'AI Context Extractor (MCP)',
            color: 'from-emerald-500 via-teal-600 to-indigo-600',
            cards: {
              create: enriched.items.map((item: any, idx: number) => ({
                type: 'flashcard',
                front: item.word.trim(),
                back: item.meaningVi.trim(),
                phonetic: item.ipa?.trim() || null,
                exampleEn: item.exampleEn?.trim() || null,
                exampleVi: item.exampleVi?.trim() || null,
                orderIndex: idx,
              })),
            },
          },
          include: { cards: true },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  deckId: deck.id,
                  title: deck.title,
                  cardsExtracted: deck.cards.length,
                  extractedVocabulary: deck.cards.map((c) => ({
                    word: c.front,
                    ipa: c.phonetic,
                    meaning: c.back,
                    example: c.exampleEn,
                  })),
                  webUrl: `/deck/${deck.id}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Lỗi khi trích xuất và tạo bộ thẻ qua MCP: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Tool 5: get_deck_by_id
   * Get full details of a specific deck including all cards and metadata
   */
  server.tool(
    'get_deck_by_id',
    'Lấy thông tin chi tiết của một bộ thẻ từ vựng trong LinguaLeap (bao gồm danh sách toàn bộ flashcards, phiên âm IPA, câu ví dụ và thống kê).',
    {
      deckId: z.string().describe('Mã định danh (ID hoặc Slug) của bộ thẻ'),
    },
    async ({ deckId }) => {
      try {
        const deck = await prisma.deck.findUnique({
          where: { id: deckId },
          include: {
            cards: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        });

        if (!deck) {
          return {
            content: [
              {
                type: 'text',
                text: `Không tìm thấy bộ thẻ với mã ID: "${deckId}".`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  id: deck.id,
                  title: deck.title,
                  description: deck.description,
                  category: deck.category,
                  itemCount: deck.itemCount,
                  creatorName: deck.creatorName,
                  createdAt: deck.createdAt,
                  cards: deck.cards.map((c) => ({
                    id: c.id,
                    front: c.front,
                    phonetic: c.phonetic,
                    back: c.back,
                    exampleEn: c.exampleEn,
                    exampleVi: c.exampleVi,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Lỗi khi lấy thông tin bộ thẻ: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ==========================================
  // 2. MCP RESOURCES (Context Reading for LLMs)
  // ==========================================

  /**
   * Resource 1: lingualeap://decks/public
   * List all public decks available for studying on LinguaLeap
   */
  server.resource(
    'public_decks',
    'lingualeap://decks/public',
    async (uri) => {
      const decks = await prisma.deck.findMany({
        where: { isPublic: true },
        take: 30,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          itemCount: true,
          creatorName: true,
          rating: true,
        },
      });

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(decks, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Resource 2: lingualeap://stats/summary
   * Platform-wide overview statistics
   */
  server.resource(
    'platform_summary',
    'lingualeap://stats/summary',
    async (uri) => {
      const [totalUsers, totalDecks, totalCards, totalSessions] = await Promise.all([
        prisma.user.count(),
        prisma.deck.count(),
        prisma.card.count(),
        prisma.studySession.count(),
      ]);

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                platform: 'LinguaLeap - Nền tảng học tiếng Anh thông minh',
                totalUsers,
                totalDecks,
                totalCards,
                totalStudySessions: totalSessions,
                mcpCapabilities: [
                  'Full database vocabulary search with IPA',
                  'Dynamic deck creation and automatic AI enrichment',
                  'Personalized learner streak and progress monitoring',
                ],
                updatedAt: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  /**
   * Resource 3: Dynamic Deck Resource Template
   * lingualeap://deck/{deckId}
   */
  server.resource(
    'deck_detail',
    new ResourceTemplate('lingualeap://deck/{deckId}', { list: undefined }),
    async (uri, { deckId }) => {
      const deck = await prisma.deck.findUnique({
        where: { id: String(deckId) },
        include: { cards: true },
      });

      if (!deck) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'text/plain',
              text: `Không tìm thấy bộ thẻ "${deckId}" trên LinguaLeap.`,
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(deck, null, 2),
          },
        ],
      };
    }
  );

  // ==========================================
  // 3. MCP PROMPTS (Pre-configured Expert Prompts)
  // ==========================================

  /**
   * Prompt 1: vocab_tutor
   * Interactive AI tutor prompt for coaching vocabulary & pronunciation
   */
  server.prompt(
    'vocab_tutor',
    'Đóng vai trò Gia sư tiếng Anh tương tác chuyên sâu, huấn luyện người dùng học từ vựng và chuẩn hóa phát âm IPA theo một bộ thẻ trên LinguaLeap.',
    {
      deckId: z.string().describe('ID hoặc tên bộ thẻ trên LinguaLeap'),
      focus: z.enum(['pronunciation_ipa', 'sentence_making', 'conversation']).default('pronunciation_ipa').describe('Trọng tâm bài học'),
    },
    async ({ deckId, focus }) => {
      const deck = await prisma.deck.findUnique({
        where: { id: deckId },
        include: { cards: { take: 10 } },
      });

      const cardsText = deck
        ? deck.cards.map((c) => `- **${c.front}** ${c.phonetic || ''}: ${c.back} (Ví dụ: "${c.exampleEn || ''}")`).join('\n')
        : '(Dùng các từ vựng tiêu biểu trong kho LinguaLeap)';

      const instructions = `Bạn là Gia sư Tiếng Anh AI thông minh từ nền tảng LinguaLeap.
Hôm nay bạn sẽ kèm cặp học viên ôn tập bộ thẻ: "${deck?.title || deckId}".

DANH SÁCH TỪ VỰNG TRỌNG TÂM:
${cardsText}

NHIỆM VỤ CỦA BẠN (Trọng tâm: ${focus}):
1. Hãy bắt đầu bằng một lời chào thân thiện, khích lệ tinh thần người học.
2. Lần lượt đưa ra từng từ vựng, giải thích cặn kẽ cách phát âm từng âm tiết theo ký tự phiên âm quốc tế IPA (khẩu hình miệng, vị trí đặt lưỡi, âm vô thanh/hữu thanh).
3. Đặt một câu hỏi tình huống đời sống yêu cầu người học sử dụng từ vựng đó để trả lời.
4. Đợi người học phản hồi rồi sửa lỗi ngữ pháp, phát âm và khen ngợi cụ thể.`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: instructions,
            },
          },
        ],
      };
    }
  );

  /**
   * Prompt 2: exam_quiz_generator
   * Generate an exam quiz based on a LinguaLeap deck
   */
  server.prompt(
    'exam_quiz_generator',
    'Tạo một đề thi trắc nghiệm (Quiz) 5 câu hỏi dựa trên các từ vựng của bộ thẻ LinguaLeap được chỉ định.',
    {
      deckId: z.string().describe('ID bộ thẻ trên LinguaLeap'),
    },
    async ({ deckId }) => {
      const deck = await prisma.deck.findUnique({
        where: { id: deckId },
        include: { cards: { take: 10 } },
      });

      const cardsText = deck
        ? deck.cards.map((c) => `- ${c.front}: ${c.back}`).join('\n')
        : 'Tạo quiz từ vựng học thuật';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Hãy soạn một đề thi trắc nghiệm gồm 5 câu hỏi phong phú (tìm từ đồng nghĩa, điền vào chỗ trống, chọn nghĩa đúng) dựa trên các từ vựng sau của LinguaLeap:\n${cardsText}\n\nCuối đề thi hãy cung cấp đáp án chi tiết và giải thích lý do tại sao chọn đáp án đó.`,
            },
          },
        ],
      };
    }
  );

  return server;
}

import prisma from '../config/prisma';
import { NotificationService } from './notification.service';
import {
  DailyVocabDTO,
  BroadcastReminderDTO,
  SrsDueUserSummary,
  N8nWebhookPayload,
} from '../types/n8n.types';
import { AppError } from '../utils/appError';

export class N8nService {
  public static readonly VAULT_DECK_TITLE = 'Kho Từ Vựng Chọn Lọc Hàng Ngày ✨';

  /**
   * Get or create the automated system bot user in the database
   */
  private static async getSystemBotUser() {
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

    return botUser;
  }

  /**
   * Get or create the Central System Vault Deck
   * Consolidates daily curated words to prevent database clutter & deck fragmentation.
   */
  private static async getOrCreateVaultDeck(botUserId: string, category?: string) {
    let vaultDeck = await prisma.deck.findFirst({
      where: {
        creatorId: botUserId,
        title: this.VAULT_DECK_TITLE,
      },
    });

    if (!vaultDeck) {
      vaultDeck = await prisma.deck.create({
        data: {
          title: this.VAULT_DECK_TITLE,
          description:
            'Kho từ vựng tinh hoa được AI tuyển chọn đều đặn mỗi ngày, tích hợp đầy đủ phiên âm IPA chuẩn quốc tế và ví dụ ngữ cảnh thực tế.',
          category: category || 'Intermediate',
          color: 'from-amber-500 via-violet-600 to-indigo-600',
          isPublic: true,
          itemCount: 0,
          creatorId: botUserId,
          creatorName: 'LinguaBot 🤖',
        },
      });
    }

    return vaultDeck;
  }

  /**
   * Find the most relevant active deck for a specific learner:
   * 1. Most recently studied deck in study_sessions (highest priority)
   * 2. Deck created by user
   * 3. Fallback to Central Vault Deck or popular public deck
   */
  private static async getUserActiveDeck(userId: string) {
    // 1. Recent study session
    const latestSession = await prisma.studySession.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      include: {
        deck: {
          select: { id: true, title: true, itemCount: true },
        },
      },
    });

    if (latestSession?.deck) {
      return latestSession.deck;
    }

    // 2. User's own created deck
    const userDeck = await prisma.deck.findFirst({
      where: { creatorId: userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, itemCount: true },
    });

    if (userDeck) {
      return userDeck;
    }

    // 3. Central Vault Deck or first public deck
    const fallbackDeck = await prisma.deck.findFirst({
      where: {
        OR: [
          { title: this.VAULT_DECK_TITLE },
          { isPublic: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, itemCount: true },
    });

    return fallbackDeck;
  }

  /**
   * 1. Add daily vocabulary:
   * By default, enriches the Central Vault Deck ("Kho Từ Vựng Chọn Lọc Hàng Ngày ✨")
   * with unique new cards (avoiding 365 fragmented decks cluttering the database).
   */
  static async createDailyVocab(dto: DailyVocabDTO) {
    if (!dto.cards || !Array.isArray(dto.cards) || dto.cards.length === 0) {
      throw new AppError('Danh sách thẻ từ vựng (cards) không được để trống.', 400);
    }

    const botUser = await this.getSystemBotUser();

    // Option A: Standalone Deck (Only if explicitly requested)
    if (dto.createSeparateDeck === true) {
      const todayStr = new Date().toLocaleDateString('vi-VN');
      const topicLabel = dto.topic ? ` [${dto.topic}]` : '';
      const title = dto.deckTitle || `Từ vựng hôm nay (${todayStr})${topicLabel}`;
      const description =
        dto.description ||
        `Bộ từ vựng được tự động tổng hợp & phân tích hàng ngày (Chủ đề: ${dto.topic || 'Tổng hợp'}).`;

      const deck = await prisma.deck.create({
        data: {
          title,
          description,
          category: dto.category || 'Intermediate',
          color: dto.color || 'from-indigo-600 to-violet-600',
          isPublic: true,
          itemCount: dto.cards.length,
          creatorId: botUser.id,
          creatorName: 'LinguaBot 🤖',
          cards: {
            create: dto.cards.map((card, idx) => ({
              type: 'flashcard',
              front: card.front.trim(),
              back: card.back.trim(),
              phonetic: card.phonetic?.trim() || null,
              exampleEn: card.exampleEn?.trim() || null,
              exampleVi: card.exampleVi?.trim() || null,
              imageUrl: card.imageUrl?.trim() || null,
              orderIndex: idx,
            })),
          },
        },
      });

      return {
        deck: {
          id: deck.id,
          title: deck.title,
          category: deck.category,
          itemCount: deck.itemCount,
          isVault: false,
        },
        cardsAdded: dto.cards.length,
        duplicatesSkipped: 0,
        notificationsSent: 0,
      };
    }

    // Option B (DEFAULT): Centralized Vault Deck
    const vaultDeck = await this.getOrCreateVaultDeck(botUser.id, dto.category);

    // Prevent duplicate vocabulary words in the vault
    const existingCards = await prisma.card.findMany({
      where: { deckId: vaultDeck.id },
      select: { front: true },
    });
    const existingFronts = new Set(
      existingCards.map((c) => (c.front || '').trim().toLowerCase())
    );

    const newCards = dto.cards.filter(
      (c) => c.front && !existingFronts.has(c.front.trim().toLowerCase())
    );

    let cardsAdded = 0;
    if (newCards.length > 0) {
      await prisma.card.createMany({
        data: newCards.map((card, idx) => ({
          deckId: vaultDeck.id,
          type: 'flashcard',
          front: card.front.trim(),
          back: card.back.trim(),
          phonetic: card.phonetic?.trim() || null,
          exampleEn: card.exampleEn?.trim() || null,
          exampleVi: card.exampleVi?.trim() || null,
          imageUrl: card.imageUrl?.trim() || null,
          orderIndex: existingCards.length + idx,
        })),
      });

      cardsAdded = newCards.length;
      await prisma.deck.update({
        where: { id: vaultDeck.id },
        data: {
          itemCount: existingCards.length + cardsAdded,
          updatedAt: new Date(),
        },
      });
    }

    let notificationsSent = 0;
    if (dto.broadcastNotification !== false) {
      try {
        const topicStr = dto.topic ? ` (${dto.topic})` : '';
        const message =
          dto.notificationMessage ||
          (cardsAdded > 0
            ? `✨ Đã cập nhật ${cardsAdded} từ vựng mới${topicStr} vào "${this.VAULT_DECK_TITLE}"! Dành 3 phút ôn luyện để duy trì chuỗi Streak nhé! 🔥`
            : `✨ Hãy dành 3 phút hôm nay ôn luyện "${this.VAULT_DECK_TITLE}" để duy trì chuỗi Streak học tập nhé! 🔥`);

        const users = await prisma.user.findMany({
          where: { id: { not: botUser.id } },
          select: { id: true, email: true, name: true },
          take: 100,
        });

        for (const user of users) {
          await NotificationService.createNotification({
            recipientEmail: user.email,
            recipientUserId: user.id,
            senderName: 'LinguaBot 🤖',
            senderEmail: 'bot@lingualeap.edu.vn',
            type: 'daily_vocab',
            collectionTitle: this.VAULT_DECK_TITLE,
            message,
            actionUrl: `/deck/${vaultDeck.id}`,
          });
          notificationsSent++;
        }
      } catch (err) {
        console.warn('[N8nService] Could not send broadcast notifications:', err);
      }
    }

    return {
      deck: {
        id: vaultDeck.id,
        title: vaultDeck.title,
        category: vaultDeck.category,
        totalCards: existingCards.length + cardsAdded,
        isVault: true,
      },
      cardsAdded,
      duplicatesSkipped: dto.cards.length - cardsAdded,
      notificationsSent,
    };
  }

  /**
   * 2. Broadcast study reminder (Streak warning or SRS spaced review):
   * Intelligently links back to the user's ACTUAL active deck so previous decks are never wasted!
   */
  static async broadcastReminder(dto: BroadcastReminderDTO) {
    let notificationsSent = 0;
    const type = dto.type || 'streak_reminder';

    if (dto.targetUserId) {
      const user = await prisma.user.findUnique({
        where: { id: dto.targetUserId },
        select: { id: true, email: true, name: true },
      });
      if (!user) {
        throw new AppError('Không tìm thấy người dùng với targetUserId đã cho.', 404);
      }

      const activeDeck = await this.getUserActiveDeck(user.id);
      const actionUrl = dto.actionUrl || (activeDeck ? `/deck/${activeDeck.id}` : '/');

      let message = dto.message;
      if (!message) {
        message = activeDeck
          ? `🔥 Bạn còn bài học chưa hoàn thành trong bộ thẻ "${activeDeck.title}"! Dành 3 phút ôn luyện để duy trì chuỗi Streak nhé!`
          : '🔥 Hãy dành 3 phút hôm nay ôn luyện từ vựng để duy trì chuỗi Streak học tập nhé!';
      } else if (activeDeck) {
        message = message.replace('{deckTitle}', activeDeck.title);
      }

      const collectionTitle = dto.title || (activeDeck ? activeDeck.title : 'Nhắc nhở học tập');

      await NotificationService.createNotification({
        recipientEmail: user.email,
        recipientUserId: user.id,
        senderName: 'LinguaBot 🤖',
        senderEmail: 'automation@lingualeap.edu.vn',
        type,
        collectionTitle,
        message,
        actionUrl,
      });
      notificationsSent = 1;

      return {
        success: true,
        notificationsSent,
        type,
        targetDeckId: activeDeck?.id,
        targetDeckTitle: activeDeck?.title,
        message,
        actionUrl,
      };
    }

    // Broadcast to all active students - personalized for each student's existing deck!
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
      take: 100,
    });

    for (const user of users) {
      const activeDeck = await this.getUserActiveDeck(user.id);
      const actionUrl = dto.actionUrl || (activeDeck ? `/deck/${activeDeck.id}` : '/');

      let userMsg = dto.message;
      if (!userMsg) {
        userMsg = activeDeck
          ? `🔥 Bạn còn bài học chưa hoàn thành trong bộ thẻ "${activeDeck.title}"! Dành 3 phút ôn luyện để duy trì chuỗi Streak nhé!`
          : '🔥 Hãy dành 3 phút hôm nay ôn luyện từ vựng để duy trì chuỗi Streak học tập nhé!';
      } else if (activeDeck) {
        userMsg = userMsg.replace('{deckTitle}', activeDeck.title);
      }

      const collectionTitle = dto.title || (activeDeck ? activeDeck.title : 'Nhắc nhở chuỗi Streak 🔥');

      await NotificationService.createNotification({
        recipientEmail: user.email,
        recipientUserId: user.id,
        senderName: 'LinguaBot 🤖',
        senderEmail: 'automation@lingualeap.edu.vn',
        type,
        collectionTitle,
        message: userMsg,
        actionUrl,
      });
      notificationsSent++;
    }

    return {
      success: true,
      notificationsSent,
      type,
    };
  }

  /**
   * 3. Get users who are due for SRS study or have inactive streaks today
   * Along with their most recent deck ID & title so n8n can route reminders intelligently!
   */
  static async getSrsDueUsers(): Promise<SrsDueUserSummary[]> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const statsList = await prisma.userStats.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      take: 100,
    });

    const results: SrsDueUserSummary[] = [];

    for (const stat of statsList) {
      const needsReview = !stat.lastStudyDate || stat.lastStudyDate < startOfToday;
      const activeDeck = await this.getUserActiveDeck(stat.userId);

      results.push({
        userId: stat.userId,
        name: stat.user?.name || 'Học viên',
        email: stat.user?.email || '',
        streakDays: stat.streakDays || 1,
        lastStudyDate: stat.lastStudyDate,
        needsReview,
        recentDeckId: activeDeck?.id,
        recentDeckTitle: activeDeck?.title,
        recentDeckItemCount: activeDeck?.itemCount || 0,
      });
    }

    return results;
  }

  /**
   * 4. Get automation system status
   */
  static async getAutomationStatus() {
    const botUser = await prisma.user.findFirst({
      where: { email: 'system.bot@lingualeap.edu.vn' },
    });

    const vaultDeck = botUser
      ? await prisma.deck.findFirst({
          where: { creatorId: botUser.id, title: this.VAULT_DECK_TITLE },
          select: { id: true, itemCount: true, updatedAt: true },
        })
      : null;

    const [totalUsers, totalDecks, totalCards] = await Promise.all([
      prisma.user.count(),
      prisma.deck.count(),
      prisma.card.count(),
    ]);

    return {
      status: 'active',
      service: 'LinguaLeap n8n Workflow Automation Engine',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      vaultDeck: vaultDeck
        ? {
            id: vaultDeck.id,
            title: this.VAULT_DECK_TITLE,
            cardCount: vaultDeck.itemCount,
            updatedAt: vaultDeck.updatedAt,
          }
        : null,
      stats: {
        totalUsers,
        totalDecks,
        totalCards,
      },
      supportedWorkflows: [
        'Central Vault Vocabulary Enrichment & De-duplication',
        'Smart SRS & Streak Re-activation for Existing Decks',
        'Automated In-App Learner Notifications (Zero 404 Routing)',
      ],
    };
  }

  /**
   * 5. General Webhook Handler for custom n8n events
   */
  static async handleWebhook(payload: N8nWebhookPayload) {
    console.log(`[N8nService] Received webhook event "${payload.event}":`, payload);

    return {
      received: true,
      event: payload.event,
      processedAt: new Date().toISOString(),
    };
  }
}

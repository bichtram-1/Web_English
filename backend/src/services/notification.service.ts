import prisma from '../config/prisma';
import { InAppNotification, CreateNotificationDTO } from '../types/notification.types';
import { CollectionService } from './collection.service';
import { AppError } from '../utils/appError';

let tableChecked = false;

const ensureNotificationTable = async () => {
  if (tableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        "recipientEmail" TEXT NOT NULL,
        "recipientUserId" TEXT,
        "senderName" TEXT NOT NULL,
        "senderEmail" TEXT NOT NULL,
        type TEXT DEFAULT 'collection_invite',
        "collectionId" TEXT,
        "collectionTitle" TEXT,
        role TEXT DEFAULT 'viewer',
        status TEXT DEFAULT 'pending',
        read BOOLEAN DEFAULT false,
        message TEXT,
        "actionUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;`).catch(() => {});
    await prisma.$executeRawUnsafe(`UPDATE notifications SET "actionUrl" = '/' WHERE "actionUrl" = '/decks';`).catch(() => {});
    tableChecked = true;
  } catch (err) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          recipientEmail TEXT NOT NULL,
          recipientUserId TEXT,
          senderName TEXT NOT NULL,
          senderEmail TEXT NOT NULL,
          type TEXT DEFAULT 'collection_invite',
          collectionId TEXT,
          collectionTitle TEXT,
          role TEXT DEFAULT 'viewer',
          status TEXT DEFAULT 'pending',
          read BOOLEAN DEFAULT false,
          message TEXT,
          actionUrl TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      tableChecked = true;
    } catch (e2) {
      console.warn('[NotificationService] ensureNotificationTable error:', e2);
    }
  }
};

const mapNotification = (row: any): InAppNotification => ({
  id: row.id,
  recipientEmail: row.recipientEmail || row.recipientemail,
  recipientUserId: row.recipientUserId || row.recipientuserid || undefined,
  senderName: row.senderName || row.sendername || 'Người dùng',
  senderEmail: row.senderEmail || row.senderemail || '',
  type: row.type || 'collection_invite',
  collectionId: row.collectionId || row.collectionid || undefined,
  collectionTitle: row.collectionTitle || row.collectiontitle || undefined,
  role: row.role || 'viewer',
  status: row.status || 'pending',
  read: Boolean(row.read),
  createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  message: row.message || undefined,
  actionUrl: row.actionUrl || row.actionurl || undefined,
});

export class NotificationService {
  static async getNotificationsForUser(userId: string, email: string): Promise<InAppNotification[]> {
    await ensureNotificationTable();
    const emailLower = email.toLowerCase().trim();

    // Dynamically ensure Quizlet-style daily study reminders (streak & SRS review)
    try {
      await this.ensureDailyStudyReminders(userId, emailLower);
    } catch (reminderErr) {
      console.warn('[NotificationService] ensureDailyStudyReminders error:', reminderErr);
    }

    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM notifications 
         WHERE LOWER("recipientEmail") = $1 OR "recipientUserId" = $2 
         ORDER BY "createdAt" DESC LIMIT 50`,
        emailLower,
        userId
      );
      return rows.map(mapNotification);
    } catch (e) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM notifications 
           WHERE LOWER(recipientEmail) = '${emailLower.replace(/'/g, "''")}' OR recipientUserId = '${userId.replace(/'/g, "''")}' 
           ORDER BY createdAt DESC LIMIT 50`
        );
        return rows.map(mapNotification);
      } catch (err2) {
        console.warn('[NotificationService] getNotifications error:', err2);
        return [];
      }
    }
  }

  /**
   * Generates Quizlet-style Streak and SRS Review Reminders (max 1 per type per day)
   */
  private static async ensureDailyStudyReminders(userId: string, emailLower: string) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const streakNotifId = `notif-streak-${userId}-${todayStr}`;
    const srsNotifId = `notif-srs-${userId}-${todayStr}`;

    // Get user stats
    let streakDays = 1;
    let totalCards = 0;
    try {
      const stats = await prisma.userStats.findUnique({ where: { userId } });
      if (stats) {
        streakDays = stats.streakDays || 1;
        totalCards = stats.totalCardsStudied || 0;
      }
    } catch {}

    // Find most recent deckId studied by user if available
    let recentDeckId: string | undefined;
    try {
      const recentSession = await prisma.studySession.findFirst({
        where: { userId },
        orderBy: { completedAt: 'desc' },
      });
      if (recentSession?.deckId) {
        recentDeckId = recentSession.deckId;
      }
    } catch {}

    const studyUrl = recentDeckId ? `/deck/${recentDeckId}/study` : '/';

    // 1. Streak Reminder
    try {
      const existingStreak: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM notifications WHERE id = $1 LIMIT 1`,
        streakNotifId
      );
      if (!existingStreak || existingStreak.length === 0) {
        await this.createNotification({
          recipientEmail: emailLower,
          recipientUserId: userId,
          senderName: 'LinguaLeap Coach 🔥',
          senderEmail: 'coach@lingualeap.edu.vn',
          type: 'streak_reminder',
          collectionTitle: `Chuỗi học tập ${streakDays} ngày`,
          message: `Duy trì chuỗi học tập! Bạn đang có chuỗi ${streakDays} ngày liên tiếp. Hãy học ít nhất 1 bài flashcard hôm nay để không bị đứt chuỗi nhé!`,
          actionUrl: studyUrl,
        }, streakNotifId);
      }
    } catch {}

    // 2. Review Reminder (SRS - Spaced Repetition)
    try {
      const existingSrs: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM notifications WHERE id = $1 LIMIT 1`,
        srsNotifId
      );
      if (!existingSrs || existingSrs.length === 0) {
        await this.createNotification({
          recipientEmail: emailLower,
          recipientUserId: userId,
          senderName: 'LinguaLeap SRS 🧠',
          senderEmail: 'srs@lingualeap.edu.vn',
          type: 'review_reminder',
          collectionTitle: 'Cần ôn từ vựng sắp quên',
          message: 'Các từ vựng bạn đã học đang chuẩn bị bước vào vùng quên. Hãy dành 3-5 phút ôn tập ngay để củng cố trí nhớ dài hạn!',
          actionUrl: studyUrl,
        }, srsNotifId);
      }
    } catch {}
  }

  static async createNotification(dto: CreateNotificationDTO, customId?: string): Promise<InAppNotification> {
    await ensureNotificationTable();

    const id = customId || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const emailLower = dto.recipientEmail.toLowerCase().trim();
    const role = dto.role === 'editor' ? 'editor' : 'viewer';
    const type = dto.type || 'collection_invite';
    const now = new Date();

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO notifications (id, "recipientEmail", "recipientUserId", "senderName", "senderEmail", type, "collectionId", "collectionTitle", role, status, read, message, "actionUrl", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        id,
        emailLower,
        dto.recipientUserId || null,
        dto.senderName || 'Người dùng',
        dto.senderEmail || '',
        type,
        dto.collectionId || null,
        dto.collectionTitle || '',
        role,
        'pending',
        false,
        dto.message || null,
        dto.actionUrl || null,
        now
      );
    } catch (e) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO notifications (id, recipientEmail, recipientUserId, senderName, senderEmail, type, collectionId, collectionTitle, role, status, read, message, actionUrl, createdAt)
         VALUES ('${id}', '${emailLower.replace(/'/g, "''")}', ${dto.recipientUserId ? `'${dto.recipientUserId}'` : 'NULL'}, '${(dto.senderName || '').replace(/'/g, "''")}', '${(dto.senderEmail || '').replace(/'/g, "''")}', '${type}', ${dto.collectionId ? `'${dto.collectionId}'` : 'NULL'}, '${(dto.collectionTitle || '').replace(/'/g, "''")}', '${role}', 'pending', 0, '${(dto.message || '').replace(/'/g, "''")}', '${(dto.actionUrl || '').replace(/'/g, "''")}', CURRENT_TIMESTAMP)`
      );
    }

    return {
      id,
      recipientEmail: emailLower,
      recipientUserId: dto.recipientUserId,
      senderName: dto.senderName,
      senderEmail: dto.senderEmail,
      type,
      collectionId: dto.collectionId,
      collectionTitle: dto.collectionTitle,
      role,
      status: 'pending',
      read: false,
      createdAt: now.toISOString(),
      message: dto.message,
      actionUrl: dto.actionUrl,
    };
  }

  static async acceptInvite(
    notificationId: string,
    user: { userId: string; email: string; name?: string }
  ): Promise<{ notification: InAppNotification; collection?: any }> {
    await ensureNotificationTable();

    let rows: any[] = [];
    try {
      rows = await prisma.$queryRawUnsafe(`SELECT * FROM notifications WHERE id = $1 LIMIT 1`, notificationId);
    } catch {
      rows = await prisma.$queryRawUnsafe(`SELECT * FROM notifications WHERE id = '${notificationId.replace(/'/g, "''")}' LIMIT 1`);
    }

    if (!rows || rows.length === 0) {
      throw new AppError('Không tìm thấy thông báo', 404);
    }

    const notif = mapNotification(rows[0]);
    if (notif.recipientEmail.toLowerCase() !== user.email.toLowerCase() && notif.recipientUserId !== user.userId) {
      throw new AppError('Bạn không có quyền xử lý thông báo này', 403);
    }

    let updatedCollection = undefined;
    if (notif.collectionId) {
      updatedCollection = await CollectionService.joinCollection(
        notif.collectionId,
        { userId: user.userId, email: user.email, name: user.name },
        notif.role || 'viewer'
      );
    }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE notifications SET status = 'accepted', read = true, "recipientUserId" = $1 WHERE id = $2`,
        user.userId,
        notificationId
      );
    } catch {
      await prisma.$executeRawUnsafe(
        `UPDATE notifications SET status = 'accepted', read = 1, recipientUserId = '${user.userId}' WHERE id = '${notificationId}'`
      );
    }

    // Notify the inviter that their invite was accepted
    if (notif.senderEmail && notif.senderEmail.toLowerCase() !== user.email.toLowerCase()) {
      try {
        const respondentName = user.name || user.email.split('@')[0];
        const roleLabel = notif.role === 'editor' ? 'Chỉnh sửa bộ thẻ' : 'Cùng học';
        await this.createNotification({
          recipientEmail: notif.senderEmail,
          senderName: respondentName,
          senderEmail: user.email,
          type: 'invite_response',
          collectionId: notif.collectionId,
          collectionTitle: notif.collectionTitle,
          role: notif.role,
          message: `${respondentName} đã chấp nhận lời mời tham gia "${notif.collectionTitle || 'Danh sách bộ thẻ'}" với vai trò ${roleLabel}.`,
          actionUrl: notif.collectionId ? `/collections/${notif.collectionId}` : '/collections',
        });
      } catch (notifyErr) {
        console.warn('Could not notify inviter on accept:', notifyErr);
      }
    }

    return {
      notification: { ...notif, status: 'accepted', read: true, recipientUserId: user.userId },
      collection: updatedCollection,
    };
  }

  static async declineInvite(
    notificationId: string,
    user: { userId: string; email: string; name?: string }
  ): Promise<InAppNotification> {
    await ensureNotificationTable();

    let rows: any[] = [];
    try {
      rows = await prisma.$queryRawUnsafe(`SELECT * FROM notifications WHERE id = $1 LIMIT 1`, notificationId);
    } catch {
      rows = await prisma.$queryRawUnsafe(`SELECT * FROM notifications WHERE id = '${notificationId.replace(/'/g, "''")}' LIMIT 1`);
    }

    if (!rows || rows.length === 0) {
      throw new AppError('Không tìm thấy thông báo', 404);
    }

    const notif = mapNotification(rows[0]);
    if (notif.recipientEmail.toLowerCase() !== user.email.toLowerCase() && notif.recipientUserId !== user.userId) {
      throw new AppError('Bạn không có quyền xử lý thông báo này', 403);
    }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE notifications SET status = 'declined', read = true WHERE id = $1`,
        notificationId
      );
    } catch {
      await prisma.$executeRawUnsafe(
        `UPDATE notifications SET status = 'declined', read = 1 WHERE id = '${notificationId}'`
      );
    }

    // Notify the inviter that their invite was declined
    if (notif.senderEmail && notif.senderEmail.toLowerCase() !== user.email.toLowerCase()) {
      try {
        const respondentName = user.name || user.email.split('@')[0];
        await this.createNotification({
          recipientEmail: notif.senderEmail,
          senderName: respondentName,
          senderEmail: user.email,
          type: 'invite_response',
          collectionId: notif.collectionId,
          collectionTitle: notif.collectionTitle,
          role: notif.role,
          message: `${respondentName} đã từ chối lời mời tham gia "${notif.collectionTitle || 'Danh sách bộ thẻ'}".`,
          actionUrl: notif.collectionId ? `/collections/${notif.collectionId}` : '/collections',
        });
      } catch (notifyErr) {
        console.warn('Could not notify inviter on decline:', notifyErr);
      }
    }

    return { ...notif, status: 'declined', read: true };
  }

  static async markAllAsRead(userId: string, email: string): Promise<boolean> {
    await ensureNotificationTable();
    const emailLower = email.toLowerCase().trim();

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE notifications SET read = true WHERE LOWER("recipientEmail") = $1 OR "recipientUserId" = $2`,
        emailLower,
        userId
      );
      return true;
    } catch {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE notifications SET read = 1 WHERE LOWER(recipientEmail) = '${emailLower}' OR recipientUserId = '${userId}'`
        );
        return true;
      } catch {
        return false;
      }
    }
  }
}

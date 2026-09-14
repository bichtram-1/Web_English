import prisma from '../config/prisma';
import { DeckCollection, Collaborator, CreateCollectionDTO, UpdateCollectionDTO } from '../types/collection.types';
import { AppError } from '../utils/appError';
import { slugify } from '../utils/slugify';

let isTableInitialized = false;

const mockDefaultCollections: DeckCollection[] = [
  {
    id: 'col-1',
    title: 'Bộ Sưu Tập Giao Tiếp Cơ Bản & Công Sở',
    description: 'Tổng hợp tất cả các bộ thẻ từ vựng giao tiếp hàng ngày, công việc và ngữ pháp câu mẫu.',
    creator: 'LinguaLeap Master',
    isPublic: true,
    deckIds: ['deck-1', 'deck-3'],
    color: 'from-blue-600 to-indigo-600',
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'col-2',
    title: 'Ngữ Pháp Nâng Cao & Thành Ngữ Điểm Cao',
    description: 'Chuyên đề ôn luyện ngữ pháp chuyên sâu và các idioms thông dụng nhất.',
    creator: 'Teacher John',
    isPublic: true,
    deckIds: ['deck-2', 'deck-4'],
    color: 'from-purple-600 to-pink-600',
    createdAt: '2026-08-21T14:30:00.000Z',
    updatedAt: '2026-08-21T14:30:00.000Z',
  },
];

async function ensureTable() {
  if (isTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS collections (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "creatorName" VARCHAR(255) NOT NULL DEFAULT 'Người dùng',
        "creatorId" VARCHAR(255),
        "isPublic" BOOLEAN NOT NULL DEFAULT true,
        "deckIdsJson" TEXT NOT NULL DEFAULT '[]',
        "collaboratorsJson" TEXT DEFAULT '[]',
        "inviteCode" VARCHAR(255),
        color VARCHAR(255) NOT NULL DEFAULT 'from-indigo-600 to-violet-600',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    isTableInitialized = true;
  } catch (err: any) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS collections (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          creatorName TEXT NOT NULL DEFAULT 'Người dùng',
          creatorId TEXT,
          isPublic INTEGER NOT NULL DEFAULT 1,
          deckIdsJson TEXT NOT NULL DEFAULT '[]',
          collaboratorsJson TEXT DEFAULT '[]',
          inviteCode TEXT,
          color TEXT NOT NULL DEFAULT 'from-indigo-600 to-violet-600',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
      isTableInitialized = true;
    } catch (innerErr) {
      console.warn('[CollectionService] Could not auto-create collections table:', innerErr);
    }
  }

  // Seed default collections if empty
  try {
    const existing: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM collections LIMIT 1`);
    if (!existing || existing.length === 0) {
      for (const col of mockDefaultCollections) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO collections (id, title, description, "creatorName", "creatorId", "isPublic", "deckIdsJson", "collaboratorsJson", color, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          col.id,
          col.title,
          col.description,
          col.creator,
          null,
          col.isPublic,
          JSON.stringify(col.deckIds),
          JSON.stringify(col.collaborators || []),
          col.color || 'from-indigo-600 to-violet-600',
          new Date(col.createdAt),
          new Date(col.updatedAt || col.createdAt)
        );
      }
    }
  } catch (seedErr) {
    // Ignore seeding error if already seeded or SQLite parameter mismatch
  }
}

const mapCollectionFromDb = (row: any): DeckCollection => {
  let deckIds: string[] = [];
  let collaborators: Collaborator[] = [];

  try {
    if (row.deckIdsJson) deckIds = typeof row.deckIdsJson === 'string' ? JSON.parse(row.deckIdsJson) : row.deckIdsJson;
    else if (Array.isArray(row.deckIds)) deckIds = row.deckIds;
  } catch {
    deckIds = [];
  }

  try {
    if (row.collaboratorsJson) collaborators = typeof row.collaboratorsJson === 'string' ? JSON.parse(row.collaboratorsJson) : row.collaboratorsJson;
    else if (Array.isArray(row.collaborators)) collaborators = row.collaborators;
  } catch {
    collaborators = [];
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    creator: row.creatorName || (row.creator ? row.creator.name : 'Người dùng'),
    creatorId: row.creatorId || undefined,
    isPublic: row.isPublic !== undefined ? Boolean(row.isPublic) : true,
    deckIds,
    collaborators,
    inviteCode: row.inviteCode || undefined,
    color: row.color || 'from-indigo-600 to-violet-600',
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };
};

export class CollectionService {
  static async getAllCollections(options?: {
    search?: string;
    userId?: string;
    currentUserId?: string;
    currentUserRole?: string;
  }): Promise<DeckCollection[]> {
    await ensureTable();

    let rawList: any[] = [];
    try {
      if ((prisma as any).collection) {
        rawList = await (prisma as any).collection.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } else {
        rawList = await prisma.$queryRawUnsafe(`SELECT * FROM collections ORDER BY "createdAt" DESC`);
      }
    } catch (e) {
      try {
        rawList = await prisma.$queryRawUnsafe(`SELECT * FROM collections ORDER BY createdAt DESC`);
      } catch (err2) {
        console.warn('[CollectionService] Fallback to mock collections:', err2);
        rawList = mockDefaultCollections;
      }
    }

    let collections = rawList.map(mapCollectionFromDb);

    // Filter by visibility:
    // Admin: sees all
    // Logged in user: sees public collections OR own collections OR collaborator
    // Guest: sees public only
    const userRole = options?.currentUserRole;
    const currentUserId = options?.currentUserId;

    if (userRole !== 'admin') {
      collections = collections.filter((c) => {
        if (c.isPublic) return true;
        if (!currentUserId) return false;
        if (c.creatorId === currentUserId) return true;
        const isCollab = c.collaborators?.some(
          (collab) => collab.userId === currentUserId
        );
        return Boolean(isCollab);
      });
    }

    // Filter by userId query parameter (e.g. My Collections tab)
    if (options?.userId) {
      collections = collections.filter((c) => c.creatorId === options.userId);
    }

    // Filter by search query
    if (options?.search) {
      const q = options.search.toLowerCase();
      collections = collections.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.creator.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    return collections;
  }

  static async getCollectionById(id: string, currentUserId?: string, currentUserRole?: string): Promise<DeckCollection> {
    await ensureTable();

    let found: any = null;
    try {
      if ((prisma as any).collection) {
        found = await (prisma as any).collection.findUnique({ where: { id } });
      } else {
        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM collections WHERE id = $1 LIMIT 1`, id);
        found = rows?.[0];
      }
    } catch (e) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM collections WHERE id = '${id.replace(/'/g, "''")}' LIMIT 1`);
        found = rows?.[0];
      } catch (err2) {
        console.warn('[CollectionService] Query error:', err2);
      }
    }

    if (!found) {
      const mock = mockDefaultCollections.find((m) => m.id === id);
      if (mock) return mock;
      throw new AppError('Không tìm thấy danh sách bộ thẻ', 404);
    }

    const col = mapCollectionFromDb(found);

    if (col.isPublic === false) {
      if (!currentUserId) {
        throw new AppError('Danh sách này ở chế độ riêng tư. Vui lòng đăng nhập để truy cập.', 403);
      }
      const isOwner = col.creatorId === currentUserId;
      const isCollab = col.collaborators?.some((c) => c.userId === currentUserId);
      if (currentUserRole !== 'admin' && !isOwner && !isCollab) {
        throw new AppError('Bạn không có quyền truy cập danh sách bộ thẻ riêng tư này', 403);
      }
    }

    return col;
  }

  static async createCollection(
    dto: CreateCollectionDTO,
    creatorName = 'Người dùng',
    creatorId?: string
  ): Promise<DeckCollection> {
    await ensureTable();

    if (!creatorId) {
      throw new AppError('Vui lòng đăng nhập để tạo danh sách bộ thẻ', 401);
    }

    if (!dto.title || dto.title.trim().length === 0) {
      throw new AppError('Tiêu đề danh sách không được để trống', 400);
    }

    let finalCreatorName = creatorName;
    try {
      const user = await prisma.user.findUnique({ where: { id: creatorId } });
      if (user?.name) {
        finalCreatorName = user.name;
      }
    } catch {}

    const slug = slugify(dto.title.trim());
    const id = `col-${slug || 'collection'}-${Date.now().toString(36)}`;
    const isPublic = dto.isPublic !== undefined ? dto.isPublic : true;
    const deckIdsJson = JSON.stringify(dto.deckIds || []);
    const collaboratorsJson = JSON.stringify([]);
    const color = dto.color || 'from-indigo-600 to-violet-600';
    const now = new Date();

    try {
      if ((prisma as any).collection) {
        const created = await (prisma as any).collection.create({
          data: {
            id,
            title: dto.title.trim(),
            description: dto.description?.trim() || '',
            creatorName: finalCreatorName,
            creatorId,
            isPublic,
            deckIdsJson,
            collaboratorsJson,
            color,
            createdAt: now,
            updatedAt: now,
          },
        });
        return mapCollectionFromDb(created);
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO collections (id, title, description, "creatorName", "creatorId", "isPublic", "deckIdsJson", "collaboratorsJson", color, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          id,
          dto.title.trim(),
          dto.description?.trim() || '',
          finalCreatorName,
          creatorId,
          isPublic,
          deckIdsJson,
          collaboratorsJson,
          color,
          now,
          now
        );
      }
    } catch (e: any) {
      // Fallback without quoted column names if needed
      await prisma.$executeRawUnsafe(
        `INSERT INTO collections (id, title, description, creatorName, creatorId, isPublic, deckIdsJson, collaboratorsJson, color, createdAt, updatedAt)
         VALUES ('${id}', '${dto.title.trim().replace(/'/g, "''")}', '${(dto.description || '').replace(/'/g, "''")}', '${finalCreatorName.replace(/'/g, "''")}', '${creatorId}', ${isPublic ? 1 : 0}, '${deckIdsJson.replace(/'/g, "''")}', '${collaboratorsJson}', '${color}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      );
    }

    return {
      id,
      title: dto.title.trim(),
      description: dto.description?.trim() || '',
      creator: finalCreatorName,
      creatorId,
      isPublic,
      deckIds: dto.deckIds || [],
      collaborators: [],
      color,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  static async updateCollection(
    id: string,
    updates: UpdateCollectionDTO,
    userId?: string,
    userRole?: string
  ): Promise<DeckCollection> {
    const existing = await this.getCollectionById(id, userId, userRole);

    if (!userId) {
      throw new AppError('Vui lòng đăng nhập để chỉnh sửa', 401);
    }

    let isOwner = existing.creatorId === userId;
    if (!isOwner && !existing.creatorId) {
      // If collection has no creatorId yet, allow user to claim it upon first edit
      isOwner = true;
    }
    const isEditor = existing.collaborators?.some((c) => c.userId === userId && c.role === 'editor');
    if (userRole !== 'admin' && !isOwner && !isEditor) {
      throw new AppError('Bạn không có quyền chỉnh sửa danh sách bộ thẻ này', 403);
    }

    const updatedCol: DeckCollection = {
      ...existing,
      ...updates,
      creatorId: existing.creatorId || userId,
      isPublic: updates.isPublic !== undefined ? Boolean(updates.isPublic) : existing.isPublic,
      updatedAt: new Date().toISOString(),
    };

    const deckIdsJson = JSON.stringify(updatedCol.deckIds);
    const collaboratorsJson = JSON.stringify(updatedCol.collaborators || []);
    const now = new Date();

    try {
      if ((prisma as any).collection) {
        await (prisma as any).collection.update({
          where: { id },
          data: {
            title: updatedCol.title,
            description: updatedCol.description,
            creatorId: updatedCol.creatorId,
            isPublic: updatedCol.isPublic,
            deckIdsJson,
            collaboratorsJson,
            color: updatedCol.color,
            updatedAt: now,
          },
        });
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE collections 
           SET title = $1, description = $2, "isPublic" = $3, "deckIdsJson" = $4, "collaboratorsJson" = $5, color = $6, "updatedAt" = $7
           WHERE id = $8`,
          updatedCol.title,
          updatedCol.description || '',
          updatedCol.isPublic,
          deckIdsJson,
          collaboratorsJson,
          updatedCol.color || 'from-indigo-600 to-violet-600',
          now,
          id
        );
      }
    } catch (e) {
      await prisma.$executeRawUnsafe(
        `UPDATE collections 
         SET title = '${updatedCol.title.replace(/'/g, "''")}', 
             description = '${(updatedCol.description || '').replace(/'/g, "''")}', 
             isPublic = ${updatedCol.isPublic ? 1 : 0}, 
             deckIdsJson = '${deckIdsJson.replace(/'/g, "''")}', 
             collaboratorsJson = '${collaboratorsJson.replace(/'/g, "''")}', 
             color = '${updatedCol.color || 'from-indigo-600 to-violet-600'}', 
             updatedAt = CURRENT_TIMESTAMP
         WHERE id = '${id.replace(/'/g, "''")}'`
      );
    }

    return updatedCol;
  }

  static async deleteCollection(id: string, userId?: string, userRole?: string): Promise<{ deleted: boolean; id: string }> {
    const existing = await this.getCollectionById(id, userId, userRole);

    if (!userId) {
      throw new AppError('Vui lòng đăng nhập để xóa danh sách bộ thẻ', 401);
    }

    if (userRole !== 'admin' && existing.creatorId && existing.creatorId !== userId) {
      throw new AppError('Chỉ tác giả sở hữu mới có quyền xóa danh sách này', 403);
    }

    try {
      if ((prisma as any).collection) {
        await (prisma as any).collection.delete({ where: { id } });
      } else {
        await prisma.$executeRawUnsafe(`DELETE FROM collections WHERE id = $1`, id);
      }
    } catch (e) {
      await prisma.$executeRawUnsafe(`DELETE FROM collections WHERE id = '${id.replace(/'/g, "''")}'`);
    }

    return { deleted: true, id };
  }

  static async addDeckToCollection(
    collectionId: string,
    deckId: string,
    userId?: string,
    userRole?: string
  ): Promise<DeckCollection> {
    const existing = await this.getCollectionById(collectionId, userId, userRole);
    if (!existing.deckIds.includes(deckId)) {
      const newDeckIds = [...existing.deckIds, deckId];
      return this.updateCollection(collectionId, { deckIds: newDeckIds }, userId, userRole);
    }
    return existing;
  }

  static async removeDeckFromCollection(
    collectionId: string,
    deckId: string,
    userId?: string,
    userRole?: string
  ): Promise<DeckCollection> {
    const existing = await this.getCollectionById(collectionId, userId, userRole);
    const newDeckIds = existing.deckIds.filter((dId) => dId !== deckId);
    return this.updateCollection(collectionId, { deckIds: newDeckIds }, userId, userRole);
  }

  static async inviteCollaborator(
    collectionId: string,
    collaborator: { email: string; name?: string; role: 'viewer' | 'editor'; userId?: string },
    userId?: string,
    userRole?: string
  ): Promise<DeckCollection> {
    const existing = await this.getCollectionById(collectionId, userId, userRole);
    const collaborators = [...(existing.collaborators || [])];
    const existingIndex = collaborators.findIndex((c) => c.email.toLowerCase() === collaborator.email.toLowerCase());

    const newCollaborator: Collaborator = {
      email: collaborator.email.trim().toLowerCase(),
      name: collaborator.name?.trim() || collaborator.email.split('@')[0],
      role: collaborator.role,
      userId: collaborator.userId,
      addedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      collaborators[existingIndex] = { ...collaborators[existingIndex], ...newCollaborator };
    } else {
      collaborators.push(newCollaborator);
    }

    return this.updateCollection(collectionId, { collaborators }, userId, userRole);
  }

  static async removeCollaborator(
    collectionId: string,
    email: string,
    userId?: string,
    userRole?: string
  ): Promise<DeckCollection> {
    const existing = await this.getCollectionById(collectionId, userId, userRole);
    const collaborators = (existing.collaborators || []).filter(
      (c) => c.email.toLowerCase() !== email.toLowerCase()
    );
    return this.updateCollection(collectionId, { collaborators }, userId, userRole);
  }

  static async updateCollaboratorRole(
    collectionId: string,
    email: string,
    role: 'viewer' | 'editor',
    userId?: string,
    userRole?: string
  ): Promise<DeckCollection> {
    const existing = await this.getCollectionById(collectionId, userId, userRole);
    const collaborators = (existing.collaborators || []).map((c) =>
      c.email.toLowerCase() === email.toLowerCase() ? { ...c, role } : c
    );
    return this.updateCollection(collectionId, { collaborators }, userId, userRole);
  }
}

import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { STORAGE_KEYS } from '../constants/storage';
import { deckApi, getCurrentUserFromStorage } from './deckApi';
import type { Deck, DeckCollection, CardItem } from '../types/DeckType';
import type { ApiResponse } from '../types/api.types';
import { generateFriendlyId } from '../utils/slugify';
import { canViewCollection } from '../utils/permission';

export const mockDefaultCollections: DeckCollection[] = [
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

export const getStoredCollections = (): DeckCollection[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading collections cache:', e);
  }
  return mockDefaultCollections;
};

export const saveCollectionsToStorage = (collections: DeckCollection[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS_CACHE, JSON.stringify(collections));
  } catch (e) {
    console.error('Error saving collections cache:', e);
  }
};

export const collectionApi = {
  getCollections: async (params?: { search?: string; userId?: string }): Promise<DeckCollection[]> => {
    let result: DeckCollection[] = [];
    try {
      const res = (await axiosInstance.get(ENDPOINTS.COLLECTIONS, {
        params,
      })) as any;

      if (Array.isArray(res) && res.length > 0) {
        result = res;
      } else if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        result = res.data;
      }

      if (result.length > 0) {
        saveCollectionsToStorage(result);
      }
    } catch (e) {
      console.warn('Backend unavailable, fallback to local collections cache:', e);
    }

    if (!result || result.length === 0) {
      let local = getStoredCollections();
      if (!local || local.length === 0) {
        local = mockDefaultCollections;
        saveCollectionsToStorage(mockDefaultCollections);
      }

      const currentUser = getCurrentUserFromStorage();
      local = local.filter((c) => canViewCollection(c, currentUser));

      if (params?.userId) {
        local = local.filter((c) => c.creatorId === params.userId);
      }

      if (params?.search) {
        const q = params.search.toLowerCase();
        local = local.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.creator.toLowerCase().includes(q) ||
            (c.description && c.description.toLowerCase().includes(q))
        );
      }
      result = local;
    }

    const currentUser = getCurrentUserFromStorage();
    return result.filter((c) => canViewCollection(c, currentUser));
  },

  getCollectionById: async (id: string): Promise<DeckCollection | undefined> => {
    let found: DeckCollection | undefined;
    let is403 = false;
    let is404 = false;

    try {
      const res = (await axiosInstance.get(ENDPOINTS.COLLECTION_BY_ID(id))) as unknown as ApiResponse<DeckCollection>;
      if (res?.data && typeof res.data === 'object') {
        found = res.data;
      } else if ((res as any)?.id) {
        found = res as any;
      }
    } catch (e: any) {
      if (e?.status === 403) is403 = true;
      if (e?.status === 404) is404 = true;
      console.warn(`Backend unavailable for collection ${id}, fallback to local cache:`, e);
    }

    if (is403) return undefined;

    if (!found && !is404) {
      const collections = getStoredCollections();
      found = collections.find((c) => c.id === id);
    }

    if (!found) {
      found = mockDefaultCollections.find((c) => c.id === id);
    }

    if (found) {
      const currentUser = getCurrentUserFromStorage();
      if (!canViewCollection(found, currentUser)) {
        return undefined;
      }
    }

    return found;
  },

  createCollection: async (data: {
    title: string;
    description?: string;
    creator?: string;
    creatorId?: string;
    isPublic?: boolean;
    deckIds?: string[];
    color?: string;
  }): Promise<DeckCollection> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.COLLECTIONS,
        data
      )) as unknown as ApiResponse<DeckCollection>;

      if (res?.data) {
        const stored = getStoredCollections();
        saveCollectionsToStorage([res.data, ...stored.filter((c) => c.id !== res.data.id)]);
        return res.data;
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        throw e;
      }
      console.warn('Backend unavailable for createCollection, saving locally:', e);
    }

    const newCol: DeckCollection = {
      id: generateFriendlyId(data.title.trim(), 'col'),
      title: data.title.trim(),
      description: data.description?.trim() || '',
      creator: data.creator || 'Người dùng',
      creatorId: data.creatorId,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      deckIds: data.deckIds || [],
      collaborators: [],
      color: data.color || 'from-indigo-600 to-violet-600',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const collections = getStoredCollections();
    const updated = [newCol, ...collections.filter((c) => c.id !== newCol.id)];
    saveCollectionsToStorage(updated);
    return newCol;
  },

  updateCollection: async (
    id: string,
    updates: Partial<DeckCollection>
  ): Promise<DeckCollection | undefined> => {
    try {
      const res = (await axiosInstance.put(
        ENDPOINTS.COLLECTION_BY_ID(id),
        updates
      )) as unknown as ApiResponse<DeckCollection>;

      if (res?.data) {
        const stored = getStoredCollections();
        const updated = stored.map((c) => (c.id === id ? res.data : c));
        saveCollectionsToStorage(updated);
        return res.data;
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) throw e;
      console.warn('Backend unavailable for updateCollection, updating locally:', e);
    }

    const collections = getStoredCollections();
    const index = collections.findIndex((c) => c.id === id);
    if (index !== -1) {
      const updatedCol = {
        ...collections[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      collections[index] = updatedCol;
      saveCollectionsToStorage(collections);
      return updatedCol;
    }
    return undefined;
  },

  deleteCollection: async (id: string): Promise<boolean> => {
    try {
      await axiosInstance.delete(ENDPOINTS.COLLECTION_BY_ID(id));
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) throw e;
      console.warn('Backend unavailable for deleteCollection, deleting locally:', e);
    }

    const collections = getStoredCollections();
    const updated = collections.filter((c) => c.id !== id);
    saveCollectionsToStorage(updated);
    return true;
  },

  addDeckToCollection: async (collectionId: string, deckId: string): Promise<DeckCollection | undefined> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.COLLECTION_DECKS(collectionId),
        { deckId }
      )) as unknown as ApiResponse<DeckCollection>;

      if (res?.data) {
        const stored = getStoredCollections();
        const updated = stored.map((c) => (c.id === collectionId ? res.data : c));
        saveCollectionsToStorage(updated);
        return res.data;
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) throw e;
      console.warn('Backend unavailable for addDeckToCollection, updating locally:', e);
    }

    const collections = getStoredCollections();
    const target = collections.find((c) => c.id === collectionId);
    if (!target) return undefined;

    if (!target.deckIds.includes(deckId)) {
      target.deckIds.push(deckId);
      target.updatedAt = new Date().toISOString();
      saveCollectionsToStorage(collections);
    }
    return target;
  },

  removeDeckFromCollection: async (collectionId: string, deckId: string): Promise<DeckCollection | undefined> => {
    try {
      const res = (await axiosInstance.delete(
        ENDPOINTS.COLLECTION_DECK_ITEM(collectionId, deckId)
      )) as unknown as ApiResponse<DeckCollection>;

      if (res?.data) {
        const stored = getStoredCollections();
        const updated = stored.map((c) => (c.id === collectionId ? res.data : c));
        saveCollectionsToStorage(updated);
        return res.data;
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) throw e;
      console.warn('Backend unavailable for removeDeckFromCollection, updating locally:', e);
    }

    const collections = getStoredCollections();
    const target = collections.find((c) => c.id === collectionId);
    if (!target) return undefined;

    target.deckIds = target.deckIds.filter((id) => id !== deckId);
    target.updatedAt = new Date().toISOString();
    saveCollectionsToStorage(collections);
    return target;
  },

  inviteCollaborator: async (
    collectionId: string,
    collaborator: { email: string; name?: string; role: 'viewer' | 'editor'; userId?: string }
  ): Promise<DeckCollection | undefined> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.COLLECTION_COLLABORATORS(collectionId),
        collaborator
      )) as unknown as ApiResponse<DeckCollection>;

      if (res?.data) {
        const stored = getStoredCollections();
        const updated = stored.map((c) => (c.id === collectionId ? res.data : c));
        saveCollectionsToStorage(updated);
        return res.data;
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) throw e;
      console.warn('Backend unavailable for inviteCollaborator, updating locally:', e);
    }

    const collections = getStoredCollections();
    const target = collections.find((c) => c.id === collectionId);
    if (!target) return undefined;

    if (!target.collaborators) target.collaborators = [];
    const existingIndex = target.collaborators.findIndex((c) => c.email.toLowerCase() === collaborator.email.toLowerCase());

    const newCollaborator = {
      email: collaborator.email.trim().toLowerCase(),
      name: collaborator.name?.trim() || collaborator.email.split('@')[0],
      role: collaborator.role,
      userId: collaborator.userId,
      addedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      target.collaborators[existingIndex] = {
        ...target.collaborators[existingIndex],
        ...newCollaborator,
      };
    } else {
      target.collaborators.push(newCollaborator);
    }

    target.updatedAt = new Date().toISOString();
    saveCollectionsToStorage(collections);
    return target;
  },

  removeCollaborator: async (collectionId: string, email: string): Promise<DeckCollection | undefined> => {
    try {
      const res = (await axiosInstance.delete(
        ENDPOINTS.COLLECTION_COLLABORATOR_ITEM(collectionId, email)
      )) as unknown as ApiResponse<DeckCollection>;

      if (res?.data) {
        const stored = getStoredCollections();
        const updated = stored.map((c) => (c.id === collectionId ? res.data : c));
        saveCollectionsToStorage(updated);
        return res.data;
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) throw e;
      console.warn('Backend unavailable for removeCollaborator, updating locally:', e);
    }

    const collections = getStoredCollections();
    const target = collections.find((c) => c.id === collectionId);
    if (!target || !target.collaborators) return target;

    target.collaborators = target.collaborators.filter((c) => c.email.toLowerCase() !== email.toLowerCase());
    target.updatedAt = new Date().toISOString();
    saveCollectionsToStorage(collections);
    return target;
  },

  updateCollaboratorRole: async (
    collectionId: string,
    email: string,
    role: 'viewer' | 'editor'
  ): Promise<DeckCollection | undefined> => {
    try {
      const res = (await axiosInstance.patch(
        ENDPOINTS.COLLECTION_COLLABORATOR_ITEM(collectionId, email),
        { role }
      )) as unknown as ApiResponse<DeckCollection>;

      if (res?.data) {
        const stored = getStoredCollections();
        const updated = stored.map((c) => (c.id === collectionId ? res.data : c));
        saveCollectionsToStorage(updated);
        return res.data;
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) throw e;
      console.warn('Backend unavailable for updateCollaboratorRole, updating locally:', e);
    }

    const collections = getStoredCollections();
    const target = collections.find((c) => c.id === collectionId);
    if (!target || !target.collaborators) return target;

    const member = target.collaborators.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (member) {
      member.role = role;
      target.updatedAt = new Date().toISOString();
      saveCollectionsToStorage(collections);
    }
    return target;
  },

  // Generates a virtual Deck containing all cards from all included decks for seamless study / writing practice
  getCompositeDeckForCollection: async (collectionId: string): Promise<Deck | undefined> => {
    const col = await collectionApi.getCollectionById(collectionId);
    if (!col) return undefined;

    const allDecks = await deckApi.getDecks();
    const includedDecks = allDecks.filter((d) => col.deckIds.includes(d.id));

    // Combine all cards and re-index them
    const combinedCards: CardItem[] = [];
    let cardIdx = 1;

    includedDecks.forEach((deck) => {
      deck.cards.forEach((card) => {
        combinedCards.push({
          ...card,
          id: cardIdx++,
        });
      });
    });

    const compositeDeck: Deck = {
      id: col.id,
      title: col.title,
      description: col.description,
      creator: col.creator,
      creatorId: col.creatorId,
      itemCount: combinedCards.length,
      category: 'Tổng hợp (Collection)',
      color: col.color || 'from-indigo-600 to-violet-600',
      isPublic: col.isPublic,
      collaborators: col.collaborators,
      cards: combinedCards,
      createdAt: col.createdAt,
    };

    return compositeDeck;
  },
};

export default collectionApi;

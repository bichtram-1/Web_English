import axiosInstance from './axiosInstance';
import { STORAGE_KEYS } from '../constants/storage';
import { deckApi } from './deckApi';
import type { Deck, DeckCollection, CardItem } from '../types/DeckType';

const mockDefaultCollections: DeckCollection[] = [
  {
    id: 'col-1',
    title: 'Bộ Sưu Tập Giao Tiếp Cơ Bản & Công Sở',
    description: 'Tổng hợp tất cả các bộ thẻ từ vựng giao tiếp hàng ngày, công việc và ngữ pháp câu mẫu.',
    creator: 'LinguaLeap Master',
    isPublic: true,
    deckIds: ['deck-1', 'deck-3'],
    color: 'from-blue-600 to-indigo-600',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'col-2',
    title: 'Ngữ Pháp Nâng Cao & Thành Ngữ Điểm Cao',
    description: 'Chuyên đề ôn luyện ngữ pháp chuyên sâu và các idioms thông dụng nhất.',
    creator: 'Teacher John',
    isPublic: true,
    deckIds: ['deck-2', 'deck-4'],
    color: 'from-purple-600 to-pink-600',
    createdAt: '2026-08-21T14:30:00Z',
    updatedAt: '2026-08-21T14:30:00Z',
  },
];

const getStoredCollections = (): DeckCollection[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS_CACHE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading collections cache:', e);
  }
  return mockDefaultCollections;
};

const saveCollectionsToStorage = (collections: DeckCollection[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS_CACHE, JSON.stringify(collections));
  } catch (e) {
    console.error('Error saving collections cache:', e);
  }
};

export const collectionApi = {
  getCollections: async (params?: { search?: string; userId?: string }): Promise<DeckCollection[]> => {
    let collections = getStoredCollections();

    // Filter by visibility: show all public OR collections owned by current user
    if (params?.userId) {
      collections = collections.filter(
        (c) => c.isPublic || c.creatorId === params.userId
      );
    } else {
      collections = collections.filter((c) => c.isPublic);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      collections = collections.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.creator.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    return collections;
  },

  getCollectionById: async (id: string): Promise<DeckCollection | undefined> => {
    const collections = getStoredCollections();
    return collections.find((c) => c.id === id);
  },

  createCollection: async (data: {
    title: string;
    description?: string;
    creator: string;
    creatorId?: string;
    isPublic?: boolean;
    deckIds?: string[];
    color?: string;
  }): Promise<DeckCollection> => {
    const collections = getStoredCollections();
    const newCol: DeckCollection = {
      id: `col-${Date.now()}`,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      creator: data.creator || 'Người dùng',
      creatorId: data.creatorId,
      isPublic: data.isPublic !== undefined ? data.isPublic : true, // default is public
      deckIds: data.deckIds || [],
      color: data.color || 'from-indigo-600 to-violet-600',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newCol, ...collections];
    saveCollectionsToStorage(updated);
    return newCol;
  },

  updateCollection: async (
    id: string,
    updates: Partial<DeckCollection>
  ): Promise<DeckCollection | undefined> => {
    const collections = getStoredCollections();
    const index = collections.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    const updatedCol = {
      ...collections[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    collections[index] = updatedCol;
    saveCollectionsToStorage(collections);
    return updatedCol;
  },

  deleteCollection: async (id: string): Promise<boolean> => {
    const collections = getStoredCollections();
    const updated = collections.filter((c) => c.id !== id);
    saveCollectionsToStorage(updated);
    return true;
  },

  addDeckToCollection: async (collectionId: string, deckId: string): Promise<DeckCollection | undefined> => {
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

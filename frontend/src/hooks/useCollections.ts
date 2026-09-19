import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import collectionApi, { COLLECTIONS_CHANGED_EVENT } from '../api/collectionApi';
import type { DeckCollection } from '../types/DeckType';

export function useCollections(searchQuery?: string) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<DeckCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await collectionApi.getCollections({
        search: searchQuery,
      });
      setCollections(data);
    } catch (e) {
      console.error('Failed to load collections:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCollections();

    const handleCollectionsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<DeckCollection | undefined>;
      const item = customEvent.detail;
      if (item && item.id) {
        if ((item as any)._deleted) {
          setCollections((prev) => prev.filter((c) => c.id !== item.id));
        } else {
          setCollections((prev) => {
            const index = prev.findIndex((c) => c.id === item.id);
            if (index !== -1) {
              return prev.map((c) => (c.id === item.id ? { ...c, ...item } : c));
            } else {
              return [item, ...prev.filter((c) => c.id !== item.id)];
            }
          });
        }
      } else {
        fetchCollections();
      }
    };

    window.addEventListener(COLLECTIONS_CHANGED_EVENT, handleCollectionsChanged);
    return () => {
      window.removeEventListener(COLLECTIONS_CHANGED_EVENT, handleCollectionsChanged);
    };
  }, [fetchCollections]);

  const createCollection = async (data: {
    title: string;
    description?: string;
    isPublic?: boolean;
    deckIds?: string[];
  }) => {
    const created = await collectionApi.createCollection({
      ...data,
      creator: user?.name || 'Người dùng',
      creatorId: user?.id,
    });
    setCollections((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    return created;
  };

  const updateCollection = async (
    id: string,
    updates: Partial<DeckCollection>
  ) => {
    const updated = await collectionApi.updateCollection(id, updates);
    if (updated) {
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
    }
    return updated;
  };

  const addDeckToCollection = async (collectionId: string, deckId: string) => {
    const updated = await collectionApi.addDeckToCollection(collectionId, deckId);
    if (updated) {
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? updated : c))
      );
    }
    return updated;
  };

  const removeDeckFromCollection = async (collectionId: string, deckId: string) => {
    const updated = await collectionApi.removeDeckFromCollection(collectionId, deckId);
    if (updated) {
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? updated : c))
      );
    }
    return updated;
  };

  const deleteCollection = async (id: string) => {
    await collectionApi.deleteCollection(id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    collections,
    loading,
    refetch: fetchCollections,
    createCollection,
    updateCollection,
    addDeckToCollection,
    removeDeckFromCollection,
    deleteCollection,
  };
}

export default useCollections;

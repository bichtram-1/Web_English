import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import collectionApi from '../api/collectionApi';
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
        userId: user?.id,
      });
      setCollections(data);
    } catch (e) {
      console.error('Failed to load collections:', e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, user?.id]);

  useEffect(() => {
    fetchCollections();
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
    setCollections((prev) => [created, ...prev]);
    return created;
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
    addDeckToCollection,
    removeDeckFromCollection,
    deleteCollection,
  };
}

export default useCollections;

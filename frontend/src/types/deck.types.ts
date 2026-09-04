export type WordType = 'noun' | 'verb' | 'adjective' | 'pronoun' | 'other';

export interface FlashcardItem {
  id: number;
  type: 'flashcard';
  front: string;
  back: string;
  phonetic?: string;
  exampleEn?: string;
  exampleVi?: string;
}

export interface DragDropWord {
  id: string;
  word: string;
  type: WordType;
}

export interface DragDropItem {
  id: number;
  type: 'drag_drop';
  meaning: string;
  shuffled: DragDropWord[];
  correctOrder: string[];
  grammarRule?: string;
  grammarExplanation?: string;
  grammarNote?: string;
}

export type CardItem = FlashcardItem | DragDropItem;

export type DeckCategory = 'Beginner' | 'Intermediate' | 'Advanced' | string;

export type CollaboratorRole = 'viewer' | 'editor';

export interface Collaborator {
  userId?: string;
  email: string;
  name?: string;
  role: CollaboratorRole; // 'viewer': chỉ cùng học | 'editor': được sửa thẻ
  addedAt: string;
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  creator: string;
  creatorId?: string;
  itemCount: number;
  category: DeckCategory;
  color: string;
  isPublic?: boolean;
  collaborators?: Collaborator[];
  inviteCode?: string;
  cards: CardItem[];
  rating?: number; // Average rating 1.0 - 5.0
  ratingCount?: number; // Total number of ratings submitted
  userRatings?: Record<string, number>; // Map userId/email -> rating (1-5)
  createdAt?: string;
  updatedAt?: string;
}

export interface DeckCollection {
  id: string;
  title: string;
  description?: string;
  creator: string;
  creatorId?: string;
  isPublic: boolean;
  deckIds: string[];
  collaborators?: Collaborator[];
  inviteCode?: string;
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

export type StudyMode = 'flashcard' | 'test' | 'minigame' | 'zen' | 'written' | 'match' | 'treasure';

export interface CreateDeckDTO {
  title: string;
  description?: string;
  category?: string;
  color?: string;
  isPublic?: boolean;
  cards: CardItem[];
}

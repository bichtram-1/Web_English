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
}

export type CardItem = FlashcardItem | DragDropItem;

export type DeckCategory = 'Beginner' | 'Intermediate' | 'Advanced' | string;

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
  cards: CardItem[];
  createdAt?: string;
  updatedAt?: string;
}

export type StudyMode = 'flashcard' | 'test' | 'minigame' | 'zen' | 'written';

export interface CreateDeckDTO {
  title: string;
  description?: string;
  category?: string;
  color?: string;
  isPublic?: boolean;
  cards: CardItem[];
}

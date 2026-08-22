export type WordType = 'noun' | 'verb' | 'adjective' | 'pronoun' | 'other';

export interface FlashcardItem {
  id: number;
  type: 'flashcard';
  front: string;
  back: string;
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

export interface Deck {
  id: string;
  title: string;
  creator: string;
  itemCount: number;
  category: string;
  color: string;
  cards: CardItem[];
}

export type StudyMode = 'flashcard' | 'test' | 'minigame' | 'zen' | 'written';

import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import { CardItem, Deck } from '../types/deck.types';
import { ApiResponse } from '../types/api.types';

export const cardApi = {
  addCard: async (deckId: string, card: CardItem): Promise<Deck> => {
    const res = (await axiosInstance.post(
      ENDPOINTS.CARDS(deckId),
      card
    )) as unknown as ApiResponse<Deck>;
    return res.data;
  },

  updateCard: async (deckId: string, cardId: number, cardData: Partial<CardItem>): Promise<Deck> => {
    const res = (await axiosInstance.put(
      ENDPOINTS.CARD_BY_ID(deckId, cardId),
      cardData
    )) as unknown as ApiResponse<Deck>;
    return res.data;
  },

  deleteCard: async (deckId: string, cardId: number): Promise<Deck> => {
    const res = (await axiosInstance.delete(
      ENDPOINTS.CARD_BY_ID(deckId, cardId)
    )) as unknown as ApiResponse<Deck>;
    return res.data;
  },
};

export default cardApi;

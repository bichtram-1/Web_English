export const ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/api/v1/auth/register',
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_ME: '/api/v1/auth/me',

  // Decks
  DECKS: '/api/v1/decks',
  DECK_BY_ID: (id: string) => `/api/v1/decks/${id}`,
  CREATE_DECK: '/api/v1/decks',
  UPDATE_DECK: (id: string) => `/api/v1/decks/${id}`,
  DELETE_DECK: (id: string) => `/api/v1/decks/${id}`,

  // Cards
  CARDS: (deckId: string) => `/api/v1/cards/${deckId}/cards`,
  CARD_BY_ID: (deckId: string, cardId: number) => `/api/v1/cards/${deckId}/cards/${cardId}`,

  // Study
  STUDY_SESSIONS: '/api/v1/study/sessions',
  STUDY_HISTORY: '/api/v1/study/history',
  STUDY_STATS: '/api/v1/study/stats',

  // Stats
  STATS_SUMMARY: '/api/v1/stats/summary',
  STATS_LEADERBOARD: '/api/v1/stats/leaderboard',
};

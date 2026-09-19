export const ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/api/v1/auth/register',
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_ME: '/api/v1/auth/me',
  AUTH_FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  AUTH_VERIFY_OTP: '/api/v1/auth/verify-otp',
  AUTH_RESET_PASSWORD: '/api/v1/auth/reset-password',

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

  // Collections
  COLLECTIONS: '/api/v1/collections',
  COLLECTION_BY_ID: (id: string) => `/api/v1/collections/${id}`,
  COLLECTION_DECKS: (id: string) => `/api/v1/collections/${id}/decks`,
  COLLECTION_DECK_ITEM: (id: string, deckId: string) => `/api/v1/collections/${id}/decks/${deckId}`,
  COLLECTION_COLLABORATORS: (id: string) => `/api/v1/collections/${id}/collaborators`,
  COLLECTION_COLLABORATOR_ITEM: (id: string, email: string) => `/api/v1/collections/${id}/collaborators/${encodeURIComponent(email)}`,
  COLLECTION_JOIN: (id: string) => `/api/v1/collections/${id}/join`,

  // Notifications
  NOTIFICATIONS: '/api/v1/notifications',
  NOTIFICATION_ACCEPT: (id: string) => `/api/v1/notifications/${id}/accept`,
  NOTIFICATION_DECLINE: (id: string) => `/api/v1/notifications/${id}/decline`,
  NOTIFICATION_MARK_READ: '/api/v1/notifications/mark-read',

  // Stats
  STATS_SUMMARY: '/api/v1/stats/summary',
  STATS_LEADERBOARD: '/api/v1/stats/leaderboard',
};

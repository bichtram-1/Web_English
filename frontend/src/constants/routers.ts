export const ROUTES = {
  HOME: '/',
  DECK_DETAIL: '/deck/:id',
  CREATE_DECK: '/create-deck',
  COLLECTIONS: '/collections',
  COLLECTION_DETAIL: '/collections/:id',
  CREATE_COLLECTION: '/create-collection',
  STUDY: '/deck/:id/study',
  COLLECTION_STUDY: '/collections/:id/study',
  COLLECTION_WRITTEN: '/collections/:id/written',
  TEST: '/deck/:id/test',
  MINIGAME: '/deck/:id/minigame',
  ZEN: '/deck/:id/zen',
  WRITTEN: '/deck/:id/written',
  MATCH: '/deck/:id/match',
  TREASURE: '/deck/:id/treasure',
  GAMES: '/games',
  GLOBAL_TREASURE: '/games/treasure',
  GLOBAL_MATCH: '/games/match',
  GLOBAL_SHOOTER: '/games/shooter',
  GLOBAL_ZEN: '/games/zen',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  STATS: '/stats',
  LEADERBOARD: '/leaderboard',
  TRANSLATE_EXTRACT: '/tools/translate-extract',
  EDIT_DECK: '/deck/:id/edit',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export const getDeckDetailRoute = (id: string) => `/deck/${id}`;
export const getEditDeckRoute = (id: string) => `/deck/${id}/edit`;
export const getCollectionDetailRoute = (id: string) => `/collections/${id}`;
export const getCollectionStudyRoute = (id: string) => `/deck/${id}/study`;
export const getCollectionWrittenRoute = (id: string) => `/deck/${id}/written`;
export const getStudyRoute = (id: string) => `/deck/${id}/study`;
export const getTestRoute = (id: string) => `/deck/${id}/test`;
export const getMinigameRoute = (id: string) => `/deck/${id}/minigame`;
export const getZenRoute = (id: string) => `/deck/${id}/zen`;
export const getWrittenRoute = (id: string) => `/deck/${id}/written`;
export const getMatchRoute = (id: string) => `/deck/${id}/match`;
export const getTreasureRoute = (id: string) => `/deck/${id}/treasure`;


export const ROUTES = {
  HOME: '/',
  DECK_DETAIL: '/deck/:id',
  CREATE_DECK: '/create-deck',
  STUDY: '/deck/:id/study',
  TEST: '/deck/:id/test',
  MINIGAME: '/deck/:id/minigame',
  ZEN: '/deck/:id/zen',
  WRITTEN: '/deck/:id/written',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export const getDeckDetailRoute = (id: string) => `/deck/${id}`;
export const getStudyRoute = (id: string) => `/deck/${id}/study`;
export const getTestRoute = (id: string) => `/deck/${id}/test`;
export const getMinigameRoute = (id: string) => `/deck/${id}/minigame`;
export const getZenRoute = (id: string) => `/deck/${id}/zen`;
export const getWrittenRoute = (id: string) => `/deck/${id}/written`;

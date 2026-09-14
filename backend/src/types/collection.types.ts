export type CollaboratorRole = 'viewer' | 'editor';

export interface Collaborator {
  userId?: string;
  email: string;
  name?: string;
  role: CollaboratorRole;
  addedAt: string;
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

export interface CreateCollectionDTO {
  title: string;
  description?: string;
  isPublic?: boolean;
  deckIds?: string[];
  color?: string;
}

export interface UpdateCollectionDTO {
  title?: string;
  description?: string;
  isPublic?: boolean;
  deckIds?: string[];
  color?: string;
  collaborators?: Collaborator[];
}

export type NotificationType =
  | 'collection_invite'
  | 'invite_response'
  | 'streak_reminder'
  | 'review_reminder'
  | 'system';
export type NotificationStatus = 'pending' | 'accepted' | 'declined';

export interface InAppNotification {
  id: string;
  recipientEmail: string;
  recipientUserId?: string;
  senderName: string;
  senderEmail: string;
  type: NotificationType;
  collectionId?: string;
  collectionTitle?: string;
  role?: 'viewer' | 'editor';
  status: NotificationStatus;
  read: boolean;
  createdAt: string;
  message?: string;
  actionUrl?: string;
}

export interface CreateNotificationDTO {
  recipientEmail: string;
  recipientUserId?: string;
  senderName: string;
  senderEmail: string;
  type?: NotificationType;
  collectionId?: string;
  collectionTitle?: string;
  role?: 'viewer' | 'editor';
  message?: string;
  actionUrl?: string;
}

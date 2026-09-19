import axiosInstance from './axiosInstance';
import { ENDPOINTS } from '../constants/endpoint';
import type { ApiResponse } from '../types/api.types';
import type { InAppNotification } from '../types/notification.types';
import collectionApi from './collectionApi';

const STORAGE_KEY = 'lingua_notifications';

const getStoredNotifications = (): InAppNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredNotifications = (list: InAppNotification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
};

export const notificationApi = {
  getNotifications: async (): Promise<InAppNotification[]> => {
    try {
      const res = (await axiosInstance.get(
        ENDPOINTS.NOTIFICATIONS
      )) as unknown as ApiResponse<InAppNotification[]>;
      if (Array.isArray(res?.data)) {
        saveStoredNotifications(res.data);
        return res.data;
      }
    } catch (e: any) {
      console.warn('[NotificationApi] Backend unavailable, using local notifications:', e);
    }

    // Fallback: local storage
    const all = getStoredNotifications();
    const authStr = localStorage.getItem('lingua_auth');
    let currentUser: any = null;
    try {
      currentUser = authStr ? JSON.parse(authStr).user : null;
    } catch {}

    if (!currentUser) return [];
    const emailLower = currentUser.email?.toLowerCase();

    return all.filter(
      (n) =>
        (currentUser.id && n.recipientUserId === currentUser.id) ||
        (emailLower && n.recipientEmail?.toLowerCase() === emailLower)
    );
  },

  acceptInvite: async (
    notificationId: string
  ): Promise<{ notification: InAppNotification; collection?: any } | undefined> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.NOTIFICATION_ACCEPT(notificationId)
      )) as unknown as ApiResponse<{ notification: InAppNotification; collection?: any }>;
      if (res?.data) {
        // Update local cache
        const all = getStoredNotifications();
        const updated = all.map((n) =>
          n.id === notificationId ? { ...n, status: 'accepted' as const, read: true } : n
        );
        saveStoredNotifications(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[NotificationApi] Backend accept failed, falling back to local join:', e);
    }

    // Fallback locally
    const all = getStoredNotifications();
    const target = all.find((n) => n.id === notificationId);
    if (!target) return undefined;

    target.status = 'accepted';
    target.read = true;
    saveStoredNotifications(all);

    let joinedCol = undefined;
    if (target.collectionId) {
      joinedCol = await collectionApi.joinCollection(target.collectionId, {
        role: target.role || 'viewer',
      });
    }

    return { notification: target, collection: joinedCol };
  },

  declineInvite: async (notificationId: string): Promise<InAppNotification | undefined> => {
    try {
      const res = (await axiosInstance.post(
        ENDPOINTS.NOTIFICATION_DECLINE(notificationId)
      )) as unknown as ApiResponse<InAppNotification>;
      if (res?.data) {
        const all = getStoredNotifications();
        const updated = all.map((n) =>
          n.id === notificationId ? { ...n, status: 'declined' as const, read: true } : n
        );
        saveStoredNotifications(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('[NotificationApi] Backend decline failed, falling back to local update:', e);
    }

    const all = getStoredNotifications();
    const target = all.find((n) => n.id === notificationId);
    if (!target) return undefined;

    target.status = 'declined';
    target.read = true;
    saveStoredNotifications(all);
    return target;
  },

  markAllAsRead: async (): Promise<boolean> => {
    try {
      await axiosInstance.patch(ENDPOINTS.NOTIFICATION_MARK_READ);
    } catch (e) {
      console.warn('[NotificationApi] Backend mark-read failed, updating locally:', e);
    }

    const all = getStoredNotifications();
    all.forEach((n) => {
      n.read = true;
    });
    saveStoredNotifications(all);
    return true;
  },

  // Helper for local mock dispatch when user invites via modal
  dispatchLocalInviteNotification: (dto: {
    recipientEmail: string;
    senderName: string;
    collectionId: string;
    collectionTitle: string;
    role: 'viewer' | 'editor';
  }) => {
    const all = getStoredNotifications();
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientEmail: dto.recipientEmail.toLowerCase().trim(),
      senderName: dto.senderName,
      senderEmail: '',
      type: 'collection_invite',
      collectionId: dto.collectionId,
      collectionTitle: dto.collectionTitle,
      role: dto.role,
      status: 'pending',
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveStoredNotifications([newNotif, ...all]);
    return newNotif;
  },
};

export default notificationApi;

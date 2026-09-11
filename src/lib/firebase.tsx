// lib/firebase.tsx
// Firebase-free compatibility shim.
// All Firebase imports have been removed from the active runtime path.
// This module provides stub exports so legacy components that still import
// from "@/lib/firebase" don't crash at module load time.
// Notification functions are now backed by the Base44 SDK.

import { base44 } from "@/lib/base44";

// ==================== STUB EXPORTS (no Firebase) ====================

export const app = {};
export const auth = {
  signOut: async () => {},
  onAuthStateChanged: (_cb: (user: any) => void) => () => {},
  currentUser: null as any,
};
export const db = {} as any;
export const storage = {} as any;

// ==================== NOTIFICATION TYPES ====================

export type NotificationCategory = 'task' | 'hr' | 'leave' | 'system';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  link: string;
  image?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  link: string;
  image?: string;
}

// ==================== NOTIFICATION FUNCTIONS (Base44-backed) ====================

export async function createNotification(data: CreateNotificationData): Promise<string> {
  try {
    const result = await (base44.entities as any).Notification.create({
      user_id: data.userId,
      title: data.title,
      message: data.message,
      category: data.category,
      link: data.link,
      image: data.image || null,
      is_read: false,
    });
    return result?.id || "";
  } catch (error) {
    console.error('Error creating notification:', error);
    // Non-blocking — notifications are best-effort
    return "";
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await (base44.entities as any).Notification.update(notificationId, {
      is_read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export function convertTimestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  return new Date();
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    try {
      const results = await (base44.entities as any).Notification.filter(
        { user_id: userId },
        "-created_date"
      );
      if (cancelled) return;
      const notifications: Notification[] = (results || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title || "",
        message: r.message || "",
        category: r.category || "system",
        link: r.link || "",
        image: r.image || undefined,
        isRead: r.is_read || false,
        createdAt: convertTimestampToDate(r.created_date),
      }));
      callback(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      callback([]);
    }
  };

  poll();
  // Poll every 30 seconds as a lightweight real-time substitute
  const interval = setInterval(poll, 30000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

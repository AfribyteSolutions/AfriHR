// lib/notification.ts
// Base44-native notification functions (no Firebase).

import { base44 } from "@/lib/base44";
import { CreateNotificationData, Notification } from "@/types/notification";

function convertTimestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
}

/**
 * Create a new notification via Base44
 */
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
    console.error("Error creating notification:", error);
    // Non-blocking — notifications are best-effort
    return "";
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await (base44.entities as any).Notification.update(notificationId, {
      is_read: true,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const results = await (base44.entities as any).Notification.filter({
      user_id: userId,
      is_read: false,
    });
    if (results && results.length > 0) {
      await Promise.all(
        results.map((n: any) =>
          (base44.entities as any).Notification.update(n.id, { is_read: true })
        )
      );
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}

/**
 * Subscribe to notifications for a specific user.
 * Returns an unsubscribe function.
 */
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
      console.error("Error fetching notifications:", error);
      callback([]);
    }
  };

  poll();
  const interval = setInterval(poll, 30000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

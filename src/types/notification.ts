// types/notification.ts

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

// lib/firebase/notifications.ts

import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    Timestamp
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase'; // Your Firebase config
  import { CreateNotificationData, Notification } from '@/types/notification';
  
  const NOTIFICATIONS_COLLECTION = 'notifications';
  
  /**
   * Create a new notification in Firestore
   * Call this function whenever an event occurs (task assigned, leave approved, etc.)
   */
  export async function createNotification(data: CreateNotificationData): Promise<string> {
    try {
      const notificationRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        userId: data.userId,
        title: data.title,
        message: data.message,
        category: data.category,
        link: data.link,
        image: data.image || null,
        isRead: false,
        createdAt: serverTimestamp(),
      });
      
      return notificationRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  /**
   * Mark a notification as read
   */
  export async function markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   */
  export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    // Note: This requires batch update - implement if needed
    console.log('Mark all as read for user:', userId);
  }
  
  /**
   * Convert Firestore timestamp to Date
   */
  export function convertTimestampToDate(timestamp: any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date();
  }
  
  /**
   * Subscribe to notifications for a specific user
   * Returns an unsubscribe function
   */
  export function subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            title: data.title,
            message: data.message,
            category: data.category,
            link: data.link,
            image: data.image,
            isRead: data.isRead,
            createdAt: convertTimestampToDate(data.createdAt),
          };
        });
        callback(notifications);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        callback([]);
      }
    );
  
    return unsubscribe;
  }
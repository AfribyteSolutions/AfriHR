import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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

const firebaseConfig = {
  // Transitional placeholders keep legacy pages import-safe during static builds.
  // They do not connect to the former Firebase project; migrated pages use Base44.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD0000000000000000000000000000000000",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "disabled.invalid",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "afrihr-disabled",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "afrihr-disabled.invalid",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Failed to set legacy auth persistence:", error);
  });
}

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

// ==================== NOTIFICATION FUNCTIONS ====================

const NOTIFICATIONS_COLLECTION = 'notifications';

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
 * FIX: Improved timestamp conversion to handle null values during local optimistic updates
 */
export function convertTimestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  // If it's null (common during serverTimestamp() pending phase), return current date
  return new Date();
}

/**
 * FIX: Added SnapshotOptions to ensure data is retrieved correctly even when 
 * server timestamps are still pending.
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
      // Use "estimate" for server timestamps that haven't synced yet
      const notifications: Notification[] = snapshot.docs.map((doc) => {
        const data = doc.data({ serverTimestamps: 'estimate' }); 
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

export { app, auth, db, storage };
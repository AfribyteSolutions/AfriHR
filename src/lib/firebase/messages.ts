import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch,
  doc,
  or,
  and,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  receiverId: string;
  receiverName: string;
  receiverPhoto: string | null;
  message: string;
  timestamp: Date;
  companyId: string;
  isRead: boolean;
}

export interface CreateMessageData {
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  receiverId: string;
  receiverName: string;
  receiverPhoto: string | null;
  message: string;
  companyId: string;
}

export interface Conversation {
  userId: string;
  userName: string;
  userPhoto: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

const MESSAGES_COLLECTION = 'messages';

function convertTimestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp ? new Date(timestamp) : new Date();
}

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessageData): Promise<string> {
  try {
    const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      senderId: data.senderId,
      senderName: data.senderName,
      senderPhoto: data.senderPhoto || null,
      receiverId: data.receiverId,
      receiverName: data.receiverName,
      receiverPhoto: data.receiverPhoto || null,
      message: data.message,
      timestamp: serverTimestamp(),
      companyId: data.companyId,
      isRead: false,
    });

    return messageRef.id;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

/**
 * Subscribe to messages between two users
 */
export function subscribeToMessages(
  userId1: string,
  userId2: string,
  companyId: string,
  callback: (messages: Message[]) => void
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    and(
      where('companyId', '==', companyId),
      or(
        and(
          where('senderId', '==', userId1),
          where('receiverId', '==', userId2)
        ),
        and(
          where('senderId', '==', userId2),
          where('receiverId', '==', userId1)
        )
      )
    ),
    orderBy('timestamp', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data({ serverTimestamps: 'estimate' });
        return {
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhoto: data.senderPhoto,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          receiverPhoto: data.receiverPhoto,
          message: data.message,
          timestamp: convertTimestampToDate(data.timestamp),
          companyId: data.companyId,
          isRead: data.isRead,
        };
      });
      callback(messages);
    },
    (error) => {
      console.error('Error fetching messages:', error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to unread message counts grouped by sender (no orderBy = no composite index needed)
 */
export function subscribeToUnreadCounts(
  userId: string,
  companyId: string,
  callback: (unreadCounts: Record<string, number>) => void
): () => void {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('companyId', '==', companyId),
    where('receiverId', '==', userId),
    where('isRead', '==', false)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const senderId = data.senderId as string;
        counts[senderId] = (counts[senderId] || 0) + 1;
      });
      callback(counts);
    },
    (error) => {
      console.error('Error subscribing to unread counts:', error);
      callback({});
    }
  );

  return unsubscribe;
}

/**
 * Mark all unread messages from a specific sender as read
 */
export async function markMessagesAsRead(
  currentUserId: string,
  otherUserId: string,
  companyId: string
): Promise<void> {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('companyId', '==', companyId),
      where('receiverId', '==', currentUserId),
      where('senderId', '==', otherUserId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, MESSAGES_COLLECTION, docSnap.id), { isRead: true });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

/**
 * Get conversations for a user (list of people they've chatted with)
 */
export async function getConversations(
  userId: string,
  companyId: string
): Promise<Conversation[]> {
  try {
    // Query messages where user is sender or receiver
    const sentQuery = query(
      collection(db, MESSAGES_COLLECTION),
      where('companyId', '==', companyId),
      where('senderId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const receivedQuery = query(
      collection(db, MESSAGES_COLLECTION),
      where('companyId', '==', companyId),
      where('receiverId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery)
    ]);

    // Map to track unique conversations
    const conversationMap = new Map<string, Conversation>();

    // Process sent messages
    sentSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const otherUserId = data.receiverId;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: data.receiverName,
          userPhoto: data.receiverPhoto,
          lastMessage: data.message,
          lastMessageTime: convertTimestampToDate(data.timestamp),
          unreadCount: 0,
        });
      }
    });

    // Process received messages
    receivedSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const otherUserId = data.senderId;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: data.senderName,
          userPhoto: data.senderPhoto,
          lastMessage: data.message,
          lastMessageTime: convertTimestampToDate(data.timestamp),
          unreadCount: data.isRead ? 0 : 1,
        });
      } else {
        const existing = conversationMap.get(otherUserId)!;
        const msgTime = convertTimestampToDate(data.timestamp);

        // Update if this message is more recent
        if (msgTime > existing.lastMessageTime) {
          existing.lastMessage = data.message;
          existing.lastMessageTime = msgTime;
        }

        // Count unread messages
        if (!data.isRead) {
          existing.unreadCount++;
        }
      }
    });

    // Convert map to array and sort by last message time
    return Array.from(conversationMap.values()).sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

/**
 * Subscribe to conversation list (real-time updates)
 */
export function subscribeToConversations(
  userId: string,
  companyId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  // Subscribe to sent messages
  const sentQuery = query(
    collection(db, MESSAGES_COLLECTION),
    where('companyId', '==', companyId),
    where('senderId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  // Subscribe to received messages
  const receivedQuery = query(
    collection(db, MESSAGES_COLLECTION),
    where('companyId', '==', companyId),
    where('receiverId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  let sentMessages: any[] = [];
  let receivedMessages: any[] = [];

  const processConversations = () => {
    const conversationMap = new Map<string, Conversation>();

    // Process sent messages
    sentMessages.forEach((data) => {
      const otherUserId = data.receiverId;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: data.receiverName,
          userPhoto: data.receiverPhoto,
          lastMessage: data.message,
          lastMessageTime: convertTimestampToDate(data.timestamp),
          unreadCount: 0,
        });
      }
    });

    // Process received messages
    receivedMessages.forEach((data) => {
      const otherUserId = data.senderId;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: data.senderName,
          userPhoto: data.senderPhoto,
          lastMessage: data.message,
          lastMessageTime: convertTimestampToDate(data.timestamp),
          unreadCount: data.isRead ? 0 : 1,
        });
      } else {
        const existing = conversationMap.get(otherUserId)!;
        const msgTime = convertTimestampToDate(data.timestamp);

        if (msgTime > existing.lastMessageTime) {
          existing.lastMessage = data.message;
          existing.lastMessageTime = msgTime;
        }

        if (!data.isRead) {
          existing.unreadCount++;
        }
      }
    });

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );

    callback(conversations);
  };

  const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
    sentMessages = snapshot.docs.map(doc => doc.data({ serverTimestamps: 'estimate' }));
    processConversations();
  });

  const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
    receivedMessages = snapshot.docs.map(doc => doc.data({ serverTimestamps: 'estimate' }));
    processConversations();
  });

  // Return cleanup function that unsubscribes both listeners
  return () => {
    unsubscribeSent();
    unsubscribeReceived();
  };
}

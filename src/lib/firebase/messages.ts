import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  where,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  message: string;
  timestamp: Date;
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

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string | null>;
  lastMessage: string;
  lastMessageTime: Date;
  lastSenderId: string;
  companyId: string;
  unreadCounts: Record<string, number>;
}

export interface Conversation {
  userId: string;
  userName: string;
  userPhoto: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

const CHAT_ROOMS_COLLECTION = 'chatRooms';
const MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Generate a deterministic room ID from two user IDs.
 * Sorting ensures both users get the same room ID regardless of who initiates.
 */
export function getRoomId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

function convertTimestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp ? new Date(timestamp) : new Date();
}

/**
 * Create a new message in a chat room
 */
export async function createMessage(data: CreateMessageData): Promise<string> {
  try {
    const roomId = getRoomId(data.senderId, data.receiverId);
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    const messagesRef = collection(roomRef, MESSAGES_SUBCOLLECTION);

    console.log('[Chat] Creating message in room:', roomId);
    console.log('[Chat] Sender:', data.senderId, '→ Receiver:', data.receiverId);

    // 1. Add the message to the subcollection
    const messageRef = await addDoc(messagesRef, {
      senderId: data.senderId,
      senderName: data.senderName,
      senderPhoto: data.senderPhoto || null,
      message: data.message,
      timestamp: serverTimestamp(),
      isRead: false,
    });

    console.log('[Chat] Message added:', messageRef.id);

    // 2. Create or update room metadata
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      // First message - create the room document
      console.log('[Chat] Creating new room:', roomId);
      await setDoc(roomRef, {
        participants: [data.senderId, data.receiverId].sort(),
        participantNames: {
          [data.senderId]: data.senderName,
          [data.receiverId]: data.receiverName,
        },
        participantPhotos: {
          [data.senderId]: data.senderPhoto || null,
          [data.receiverId]: data.receiverPhoto || null,
        },
        lastMessage: data.message,
        lastMessageTime: serverTimestamp(),
        lastSenderId: data.senderId,
        companyId: data.companyId,
        unreadCounts: {
          [data.senderId]: 0,
          [data.receiverId]: 1,
        },
      });
    } else {
      // Room exists - use updateDoc for proper nested field updates
      console.log('[Chat] Updating existing room:', roomId);
      await updateDoc(roomRef, {
        lastMessage: data.message,
        lastMessageTime: serverTimestamp(),
        lastSenderId: data.senderId,
        [`participantNames.${data.senderId}`]: data.senderName,
        [`participantNames.${data.receiverId}`]: data.receiverName,
        [`participantPhotos.${data.senderId}`]: data.senderPhoto || null,
        [`participantPhotos.${data.receiverId}`]: data.receiverPhoto || null,
        [`unreadCounts.${data.receiverId}`]: increment(1),
      });
    }

    return messageRef.id;
  } catch (error) {
    console.error('[Chat] Error creating message:', error);
    throw error;
  }
}

/**
 * Subscribe to messages in a chat room between two users (real-time)
 */
/**
 * Subscribe to a single Firestore room and call onMessages with the result.
 */
function subscribeToRoom(
  roomId: string,
  onMessages: (roomId: string, messages: Message[]) => void
): () => void {
  const messagesRef = collection(db, CHAT_ROOMS_COLLECTION, roomId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((d) => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return {
          id: d.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhoto: data.senderPhoto,
          message: data.message,
          timestamp: convertTimestampToDate(data.timestamp),
          isRead: data.isRead,
        };
      });
      onMessages(roomId, messages);
    },
    (error) => {
      console.error('[Chat] Subscription error for room', roomId, error);
      onMessages(roomId, []);
    }
  );
}

/**
 * Subscribe to messages between two users (real-time).
 *
 * Supports alternative UIDs to handle legacy rooms created with employee doc.ids
 * instead of Firebase Auth UIDs. All unique room combinations are subscribed to
 * and their messages are merged and deduplicated.
 *
 * @param userId1       Current user's Firebase Auth UID
 * @param userId2       Other user's resolved Auth UID (best guess)
 * @param altUserId1    Current user's employee doc.id if different from Auth UID
 * @param altUserId2    Other user's employee doc.id if different from resolved Auth UID
 */
export function subscribeToMessages(
  userId1: string,
  userId2: string,
  _companyId: string,
  callback: (messages: Message[]) => void,
  altUserId1?: string | null,
  altUserId2?: string | null
): () => void {
  // Build unique room IDs from all UID combinations (use array to avoid Set iteration issues)
  const roomIdSet: Record<string, true> = {};
  roomIdSet[getRoomId(userId1, userId2)] = true;
  if (altUserId1 && altUserId1 !== userId1) roomIdSet[getRoomId(altUserId1, userId2)] = true;
  if (altUserId2 && altUserId2 !== userId2) roomIdSet[getRoomId(userId1, altUserId2)] = true;
  if (altUserId1 && altUserId1 !== userId1 && altUserId2 && altUserId2 !== userId2) {
    roomIdSet[getRoomId(altUserId1, altUserId2)] = true;
  }
  const roomIds = Object.keys(roomIdSet);

  console.log('[Chat] Subscribing to rooms:', roomIds);

  // Per-room message buckets, keyed by room ID
  const buckets: Record<string, Message[]> = {};
  roomIds.forEach((id) => { buckets[id] = []; });

  const notify = () => {
    // Merge all buckets, deduplicate by message ID, sort by timestamp
    const all: Message[] = [];
    const seen: Record<string, true> = {};
    Object.values(buckets).forEach((msgs) => {
      msgs.forEach((m) => {
        if (!seen[m.id]) {
          seen[m.id] = true;
          all.push(m);
        }
      });
    });
    all.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    callback(all);
  };

  const unsubscribers = roomIds.map((rId) =>
    subscribeToRoom(rId, (roomId, messages) => {
      buckets[roomId] = messages;
      notify();
    })
  );

  return () => unsubscribers.forEach((u) => u());
}

/**
 * Subscribe to all chat rooms for a user (real-time conversation list).
 * Uses only array-contains filter (no companyId compound) to avoid composite index requirement.
 */
export function subscribeToConversations(
  userId: string,
  companyId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const q = query(
    collection(db, CHAT_ROOMS_COLLECTION),
    where('participants', 'array-contains', userId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const conversations: Conversation[] = snapshot.docs
        .map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' });
          // Client-side companyId filter (avoids need for composite index)
          if (data.companyId !== companyId) return null;
          const otherUserId = (data.participants as string[]).find((p: string) => p !== userId);
          if (!otherUserId) return null;

          return {
            userId: otherUserId,
            userName: data.participantNames?.[otherUserId] || 'Unknown',
            userPhoto: data.participantPhotos?.[otherUserId] || null,
            lastMessage: data.lastMessage || '',
            lastMessageTime: convertTimestampToDate(data.lastMessageTime),
            unreadCount: data.unreadCounts?.[userId] || 0,
          };
        })
        .filter((c): c is Conversation => c !== null)
        .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

      callback(conversations);
    },
    (error) => {
      console.error('[Chat] Conversations subscription error:', error);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to total unread count across all conversations
 */
export function subscribeToUnreadCounts(
  currentUserId: string,
  companyId: string,
  callback: (counts: Record<string, number>) => void
): () => void {
  const q = query(
    collection(db, CHAT_ROOMS_COLLECTION),
    where('participants', 'array-contains', currentUserId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const counts: Record<string, number> = {};

      snapshot.docs.forEach((d) => {
        const data = d.data();
        // Client-side companyId filter
        if (data.companyId !== companyId) return;
        const otherUserId = (data.participants as string[]).find((p: string) => p !== currentUserId);
        if (otherUserId) {
          const unread = data.unreadCounts?.[currentUserId] || 0;
          if (unread > 0) {
            counts[otherUserId] = unread;
          }
        }
      });

      callback(counts);
    },
    (error) => {
      console.error('[Chat] Unread counts subscription error:', error);
      callback({});
    }
  );

  return unsubscribe;
}

/**
 * Mark all messages in a room as read for the current user
 */
export async function markMessagesAsRead(
  currentUserId: string,
  otherUserId: string,
  _companyId: string
): Promise<void> {
  try {
    const roomId = getRoomId(currentUserId, otherUserId);
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);

    // Check if room exists before updating
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;

    // Reset unread count for current user using updateDoc (proper dot notation)
    await updateDoc(roomRef, {
      [`unreadCounts.${currentUserId}`]: 0,
    });

    // Also mark individual messages as read
    const messagesRef = collection(roomRef, MESSAGES_SUBCOLLECTION);
    const q = query(
      messagesRef,
      where('senderId', '==', otherUserId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => {
      batch.update(doc(db, CHAT_ROOMS_COLLECTION, roomId, MESSAGES_SUBCOLLECTION, document.id), {
        isRead: true,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('[Chat] Error marking messages as read:', error);
  }
}

/**
 * Get the last message between two users
 */
export async function getLastMessage(
  userId1: string,
  userId2: string,
  _companyId: string
): Promise<Message | null> {
  try {
    const roomId = getRoomId(userId1, userId2);
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return null;

    const data = roomSnap.data();
    if (!data.lastMessage) return null;

    return {
      id: roomId,
      senderId: data.lastSenderId || '',
      senderName: data.participantNames?.[data.lastSenderId] || 'Unknown',
      senderPhoto: data.participantPhotos?.[data.lastSenderId] || null,
      message: data.lastMessage,
      timestamp: convertTimestampToDate(data.lastMessageTime),
      isRead: true,
    };
  } catch (error) {
    console.error('[Chat] Error fetching last message:', error);
    return null;
  }
}

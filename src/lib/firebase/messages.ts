// lib/firebase/messages.ts
// Base44-native messaging (no Firebase).

import { base44 } from "@/lib/base44";

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

function convertTimestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
}

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessageData): Promise<string> {
  try {
    const result = await (base44.entities as any).Message.create({
      sender_id: data.senderId,
      sender_name: data.senderName,
      sender_photo: data.senderPhoto || null,
      receiver_id: data.receiverId,
      receiver_name: data.receiverName,
      receiver_photo: data.receiverPhoto || null,
      message: data.message,
      tenant_id: data.companyId,
      is_read: false,
    });
    return result?.id || "";
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
}

/**
 * Subscribe to messages between two users (polling-based)
 */
export function subscribeToMessages(
  userId1: string,
  userId2: string,
  companyId: string,
  callback: (messages: Message[]) => void
): () => void {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    try {
      const results = await (base44.entities as any).Message.filter(
        { tenant_id: companyId },
        "-created_date"
      );
      if (cancelled) return;

      const messages: Message[] = (results || [])
        .filter(
          (r: any) =>
            (r.sender_id === userId1 && r.receiver_id === userId2) ||
            (r.sender_id === userId2 && r.receiver_id === userId1)
        )
        .map((r: any) => ({
          id: r.id,
          senderId: r.sender_id,
          senderName: r.sender_name,
          senderPhoto: r.sender_photo,
          receiverId: r.receiver_id,
          receiverName: r.receiver_name,
          receiverPhoto: r.receiver_photo,
          message: r.message,
          timestamp: convertTimestampToDate(r.created_date),
          companyId: r.tenant_id,
          isRead: r.is_read,
        }))
        .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());

      callback(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      callback([]);
    }
  };

  poll();
  const interval = setInterval(poll, 5000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

/**
 * Subscribe to unread message counts grouped by sender
 */
export function subscribeToUnreadCounts(
  userId: string,
  companyId: string,
  callback: (unreadCounts: Record<string, number>) => void
): () => void {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    try {
      const results = await (base44.entities as any).Message.filter({
        tenant_id: companyId,
        receiver_id: userId,
        is_read: false,
      });
      if (cancelled) return;

      const counts: Record<string, number> = {};
      (results || []).forEach((r: any) => {
        const senderId = r.sender_id as string;
        counts[senderId] = (counts[senderId] || 0) + 1;
      });
      callback(counts);
    } catch (error) {
      console.error("Error subscribing to unread counts:", error);
      callback({});
    }
  };

  poll();
  const interval = setInterval(poll, 10000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
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
    const results = await (base44.entities as any).Message.filter({
      tenant_id: companyId,
      receiver_id: currentUserId,
      sender_id: otherUserId,
      is_read: false,
    });

    if (!results || results.length === 0) return;

    await Promise.all(
      results.map((m: any) =>
        (base44.entities as any).Message.update(m.id, { is_read: true })
      )
    );
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

/**
 * Fetch the most recent message timestamp per conversation partner.
 */
export async function fetchLastMessageTimes(
  userId: string,
  companyId: string
): Promise<Record<string, number>> {
  try {
    const results = await (base44.entities as any).Message.filter({
      tenant_id: companyId,
    });
    const times: Record<string, number> = {};

    (results || []).forEach((r: any) => {
      const otherId = r.sender_id === userId ? r.receiver_id : r.sender_id === userId ? r.receiver_id : null;
      if (!otherId) return;
      const ts = convertTimestampToDate(r.created_date).getTime();
      if (!times[otherId] || ts > times[otherId]) times[otherId] = ts;
    });

    return times;
  } catch (error) {
    console.error("Error fetching last message times:", error);
    return {};
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
    const results = await (base44.entities as any).Message.filter(
      { tenant_id: companyId },
      "-created_date"
    );

    const conversationMap = new Map<string, Conversation>();

    (results || []).forEach((r: any) => {
      const isSender = r.sender_id === userId;
      const otherUserId = isSender ? r.receiver_id : r.receiver_id === userId ? r.sender_id : null;
      if (!otherUserId) return;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: isSender ? r.receiver_name : r.sender_name,
          userPhoto: isSender ? r.receiver_photo : r.sender_photo,
          lastMessage: r.message,
          lastMessageTime: convertTimestampToDate(r.created_date),
          unreadCount: 0,
        });
      }

      if (!isSender && !r.is_read) {
        const conv = conversationMap.get(otherUserId)!;
        conv.unreadCount++;
      }
    });

    return Array.from(conversationMap.values());
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

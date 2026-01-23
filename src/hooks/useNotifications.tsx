// hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { Notification, subscribeToNotifications } from '@/lib/firebase';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export function useNotifications(userId: string | null | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useNotifications hook - userId:', userId);

    if (!userId) {
      console.log('❌ No userId provided to useNotifications');
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 Subscribing to notifications for user:', userId);
      
      const unsubscribe = subscribeToNotifications(userId, (data) => {
        console.log('✅ Notifications received from Firestore:', data);
        setNotifications(data);
        setLoading(false);
      });

      return () => {
        console.log('🔌 Unsubscribing from notifications');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error in useNotifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
  };
}
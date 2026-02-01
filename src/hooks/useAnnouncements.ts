// hooks/useAnnouncements.ts

import { useEffect, useState } from 'react';
import { subscribeToAnnouncements } from '@/lib/firebase/announcements';
import { Announcement } from '@/types/announcement';

interface UseAnnouncementsReturn {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

export function useAnnouncements(): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Subscribing to announcements');
      
      const unsubscribe = subscribeToAnnouncements((data) => {
        console.log('✅ Announcements received from Firestore:', data);
        setAnnouncements(data);
        setLoading(false);
      });

      return () => {
        console.log('🔌 Unsubscribing from announcements');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error in useAnnouncements:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  return {
    announcements,
    loading,
    error,
  };
}
import { useEffect, useState } from 'react';
import { subscribeToAnnouncements } from '@/lib/firebase/announcements';
import { Announcement } from '@/types/announcement';
import { useAuthUserContext } from '@/context/UserAuthContext';

interface UseAnnouncementsReturn {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

export function useAnnouncements(): UseAnnouncementsReturn {
  const { user, loading: authLoading } = useAuthUserContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. If the auth state is still loading, wait.
    if (authLoading) return;

    // 2. If we have no user profile or no companyId, stop loading and return empty.
    if (!user?.companyId) {
      console.warn("useAnnouncements: No companyId found for user profile.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 3. Establish the real-time subscription
    const unsubscribe = subscribeToAnnouncements(
      user.companyId,
      (data) => {
        setAnnouncements(data);
        setLoading(false);
      },
      (err) => {
        // This catches the Index error we saw earlier
        setError(err.message || "Failed to fetch announcements");
        setLoading(false);
      }
    );

    // 4. Cleanup subscription on unmount or when companyId changes
    return () => unsubscribe();
  }, [user?.companyId, authLoading]);

  return {
    announcements,
    loading,
    error,
  };
}
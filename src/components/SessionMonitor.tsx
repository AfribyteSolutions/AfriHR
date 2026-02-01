"use client";

import { useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { onAuthStateChanged } from 'firebase/auth';

interface SessionMonitorProps {
  inactivityTimeout?: number; // in milliseconds, default 30 minutes
}

const SessionMonitor: React.FC<SessionMonitorProps> = ({ 
  inactivityTimeout = 30 * 60 * 1000 // 30 minutes default
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasShownWarningRef = useRef<boolean>(false);
  const isAuthenticatedRef = useRef<boolean>(false);

  const clearSession = async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();
      
      // Clear all cookies by calling logout API
      await fetch('/api/auth/log-out', { method: 'POST' });
      
      // Clear local/session storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('🔒 Session cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const handleLogout = async (reason: 'inactivity' | 'tab-close' = 'inactivity') => {
    // Only logout if user is actually authenticated
    if (!isAuthenticatedRef.current) {
      return;
    }

    await clearSession();
    
    const message = reason === 'inactivity' 
      ? 'You have been logged out due to inactivity'
      : 'Session ended';
    
    toast.info(message);
    
    // Redirect to login
    window.location.href = '/auth/signin-basic';
  };

  const resetInactivityTimer = () => {
    // Only reset timer if user is authenticated
    if (!isAuthenticatedRef.current) {
      return;
    }

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Update last activity
    lastActivityRef.current = Date.now();
    hasShownWarningRef.current = false;

    // Update lastActivity cookie (client-accessible for visibility check)
    document.cookie = `lastActivity=${Date.now()}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

    // Set warning at 5 minutes before timeout
    const warningTime = inactivityTimeout - (5 * 60 * 1000); // 5 minutes before
    
    if (warningTime > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        if (!hasShownWarningRef.current && isAuthenticatedRef.current) {
          toast.warning('You will be logged out in 5 minutes due to inactivity', {
            duration: 10000,
          });
          hasShownWarningRef.current = true;
        }
      }, warningTime);
    }

    // Set new timeout for logout
    timeoutRef.current = setTimeout(() => {
      handleLogout('inactivity');
    }, inactivityTimeout);
  };

  useEffect(() => {
    // Monitor Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      isAuthenticatedRef.current = !!user;
      
      if (user) {
        console.log('👤 User authenticated, starting session monitor');
        resetInactivityTimer();
      } else {
        console.log('👤 User not authenticated, stopping session monitor');
        // Clear timers if user is not authenticated
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
          warningTimeoutRef.current = null;
        }
      }
    });

    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners for user activity (throttled to avoid excessive updates)
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledReset = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetInactivityTimer();
          throttleTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (!isAuthenticatedRef.current) {
        return;
      }

      if (document.hidden) {
        // Tab is hidden/inactive
        console.log('📱 Tab hidden');
      } else {
        // Tab is visible again, check if session is still valid
        const lastActivityCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('lastActivity='));
        
        if (!lastActivityCookie) {
          // No lastActivity cookie found - session might have expired
          console.warn('⚠️ No lastActivity cookie found');
          return;
        }

        const lastActivity = parseInt(lastActivityCookie.split('=')[1] || '0');
        const timeSinceActivity = Date.now() - lastActivity;
        
        console.log(`⏰ Time since last activity: ${Math.floor(timeSinceActivity / 1000 / 60)} minutes`);
        
        if (timeSinceActivity > inactivityTimeout) {
          console.log('⏰ Session expired during inactivity');
          handleLogout('inactivity');
        } else {
          resetInactivityTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledReset);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inactivityTimeout]);

  // This component doesn't render anything
  return null;
};

export default SessionMonitor;
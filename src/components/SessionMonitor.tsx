"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

interface SessionMonitorProps {
  inactivityTimeout?: number; // in milliseconds, default 30 minutes
}

const SessionMonitor: React.FC<SessionMonitorProps> = ({ 
  inactivityTimeout = 30 * 60 * 1000 // 30 minutes default
}) => {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasShownWarningRef = useRef<boolean>(false);

  const clearSession = async () => {
    try {
      // Sign out from Firebase
      await auth.signOut();
      
      // Clear all cookies by calling logout API
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Clear local/session storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('🔒 Session cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const handleLogout = async (reason: 'inactivity' | 'tab-close' = 'inactivity') => {
    await clearSession();
    
    const message = reason === 'inactivity' 
      ? 'You have been logged out due to inactivity'
      : 'Session ended';
    
    toast.info(message);
    
    // Redirect to login
    window.location.href = '/auth/signin-basic';
  };

  const resetInactivityTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity
    lastActivityRef.current = Date.now();
    hasShownWarningRef.current = false;

    // Update lastActivity cookie
    document.cookie = `lastActivity=${Date.now()}; path=/; SameSite=Lax`;

    // Set warning at 5 minutes before timeout
    const warningTime = inactivityTimeout - (5 * 60 * 1000); // 5 minutes before
    
    const warningTimeout = setTimeout(() => {
      if (!hasShownWarningRef.current) {
        toast.warning('You will be logged out in 5 minutes due to inactivity', {
          duration: 10000,
        });
        hasShownWarningRef.current = true;
      }
    }, warningTime);

    // Set new timeout for logout
    timeoutRef.current = setTimeout(() => {
      handleLogout('inactivity');
    }, inactivityTimeout);
  };

  useEffect(() => {
    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    // Initialize timer
    resetInactivityTimer();

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden/inactive
        console.log('📱 Tab hidden');
      } else {
        // Tab is visible again, check if session is still valid
        const lastActivity = parseInt(document.cookie
          .split('; ')
          .find(row => row.startsWith('lastActivity='))
          ?.split('=')[1] || '0');
        
        const timeSinceActivity = Date.now() - lastActivity;
        
        if (timeSinceActivity > inactivityTimeout) {
          handleLogout('inactivity');
        } else {
          resetInactivityTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload (tab close/refresh)
    const handleBeforeUnload = () => {
      // Check if "Remember Me" is enabled
      const rememberMe = document.cookie.includes('rememberMe=true');
      
      if (!rememberMe) {
        // If not "Remember Me", we'll clear session on next load
        sessionStorage.setItem('shouldClearSession', 'true');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Check on mount if we should clear session
    const shouldClear = sessionStorage.getItem('shouldClearSession');
    if (shouldClear === 'true') {
      sessionStorage.removeItem('shouldClearSession');
      handleLogout('tab-close');
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [inactivityTimeout]);

  // This component doesn't render anything
  return null;
};

export default SessionMonitor;
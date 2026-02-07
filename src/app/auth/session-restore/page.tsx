"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SessionRestorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double-run in React Strict Mode
    if (hasRun.current) {
      console.log('⏭️ Skipping duplicate effect run (React Strict Mode)');
      return;
    }
    hasRun.current = true;

    const restoreSession = async () => {
      try {
        const sessionToken = searchParams.get('token');
        console.log('🔄 Session restore page loaded');
        console.log('🔑 Session token:', sessionToken ? 'Present' : 'Missing');
        console.log('🌐 Current URL:', window.location.href);

        if (!sessionToken) {
          console.error('❌ No session token in URL');
          setStatus('error');
          toast.error('No session token provided');
          setTimeout(() => router.push('/auth/signin-basic'), 2000);
          return;
        }

        console.log('📡 Fetching session data from server...');

        // 1. Get session data from the server using the one-time token
        const response = await fetch(`/api/auth/create-session-token?token=${sessionToken}`);
        console.log('📡 Session data response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Failed to get session data:', errorData);
          throw new Error(errorData.error || 'Failed to restore session');
        }

        const { data } = await response.json();
        console.log('✅ Session data retrieved:', { role: data.role, userId: data.userId, subdomain: data.subdomain });

        // 2. Set cookies on this subdomain via the set-session API
        console.log('🍪 Setting cookies on subdomain...');
        const setCookieResponse = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: data.token,
            role: data.role,
            userId: data.userId,
            email: data.email,
            subdomain: data.subdomain,
            rememberMe: data.rememberMe,
          }),
        });

        console.log('🍪 Set cookie response status:', setCookieResponse.status);

        if (!setCookieResponse.ok) {
          const errorData = await setCookieResponse.json();
          console.error('❌ Failed to set cookies:', errorData);
          throw new Error(errorData.error || 'Failed to set session cookies');
        }

        const cookieResult = await setCookieResponse.json();
        console.log('✅ Cookies set successfully:', cookieResult);

        // 3. Restore Firebase client auth using custom token
        console.log('🔥 Restoring Firebase auth...');
        try {
          const customTokenResponse = await fetch('/api/auth/create-custom-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.userId,
            }),
          });

          if (customTokenResponse.ok) {
            const { customToken } = await customTokenResponse.json();
            await signInWithCustomToken(auth, customToken);
            console.log('✅ Firebase auth restored successfully');
          } else {
            console.warn('⚠️ Could not restore Firebase auth, but session cookies are set');
          }
        } catch (firebaseError) {
          console.warn('⚠️ Firebase auth restoration failed, but session cookies are set:', firebaseError);
          // Don't throw - cookies are set, so user can still access protected routes
        }

        setStatus('success');
        toast.success('Session restored successfully!');

        // 4. Build and navigate to dashboard based on role
        let dashboardPath = '';
        switch (data.role) {
          case 'admin':
          case 'manager':
            dashboardPath = '/dashboard/hrm-dashboard';
            break;
          case 'employee':
            dashboardPath = '/dashboard/employee-dashboard';
            break;
          case 'super-admin':
            dashboardPath = '/super-admin/dashboard';
            break;
          default:
            dashboardPath = '/dashboard';
        }

        console.log('🔄 Redirecting to dashboard:', dashboardPath);
        console.log('🌐 Will navigate to:', window.location.origin + dashboardPath);

        // Use window.location.href for a hard redirect to ensure cookies are recognized
        setTimeout(() => {
          window.location.href = dashboardPath;
        }, 500);

      } catch (error: any) {
        console.error('❌ Session restore error:', error);
        console.error('❌ Error details:', error.message, error.stack);
        setStatus('error');
        toast.error(error.message || 'Failed to restore session');
        setTimeout(() => router.push('/auth/signin-basic'), 2000);
      }
    };

    restoreSession();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Restoring your session...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-gray-600">Session restored! Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <p className="text-gray-600">Session restore failed. Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}

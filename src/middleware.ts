import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that should be accessible without authentication
const publicRoutes = [
  '/auth/signin-basic',
  '/auth/signup-basic',
  '/auth/signup-advance',
  '/auth/reset-password-basic',
  '/auth/forgot-password',
  '/auth/session-restore',
  '/onboarding',
  '/pricing',
  '/checkout',
  '/about',
  '/contact',
];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for API routes, Next.js internals, and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow root path (landing page)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Allow public routes without authentication
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Auth is handled client-side via the Base44 SDK AuthProvider.
  // The AuthProvider redirects unauthenticated users to /auth/signin-basic.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

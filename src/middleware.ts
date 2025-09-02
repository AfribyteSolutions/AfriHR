// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomain } from '@/lib/getSubdomain';

const protectedRoutes = new Map<RegExp, string[]>([
  [/^\/super-admin/, ['super-admin']],
  [/^\/dashboard\/hrm-dashboard/, ['admin', 'manager', 'super-admin']],
  [/^\/dashboard\/employee-dashboard/, ['employee', 'manager', 'admin', 'super-admin']],
  [/^\/dashboard\/payroll/, ['admin', 'manager', 'super-admin']],
  [/^\/dashboard\/company/, ['admin', 'super-admin']],
  // Add the root route as protected
  [/^\/$/, ['employee', 'manager', 'admin', 'super-admin']]
]);

// Routes that should be accessible without authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/signup-basic',
  '/auth/signup-advance', 
  '/auth/reset-password-basic',
  '/auth/forgot-password',
  '/onboarding',
  '/pricing',
  '/about',
  '/contact'
];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Skip middleware for API routes, Next.js internals, and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const hostname = req.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  console.log("🔧 Middleware: hostname =", hostname, "subdomain =", subdomain, "isLocalhost =", isLocalhost);

  const res = NextResponse.next();

  // Set subdomain cookie
  const existingSubdomain = req.cookies.get('subdomain')?.value;
  if (existingSubdomain !== subdomain) {
    res.cookies.set("subdomain", subdomain || "the-media-consult", {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.afrihrm.com' : undefined,
      maxAge: 60 * 60 * 24 * 7
    });
  }

  // ✅ Allow access to localhost in development
  if (isLocalhost && process.env.NODE_ENV === "development") {
    return res;
  }

  // ✅ Allow public routes without authentication
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return res;
  }

  // ✅ Check if user is authenticated
  const authToken = req.cookies.get('authToken')?.value || 
                   req.cookies.get('session')?.value || 
                   req.cookies.get('token')?.value;
  const userRole = req.cookies.get('role')?.value || req.cookies.get('userRole')?.value;

  // ✅ Redirect unauthenticated users to sign-in
  if (!authToken && !userRole) {
    console.log("🚫 No auth token found, redirecting to sign-in");
    const signInUrl = new URL('/auth/signin', req.url);
    if (pathname !== '/') {
      signInUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(signInUrl);
  }

  // ✅ Check protected routes
  let requiredRoles: string[] | undefined;
  protectedRoutes.forEach((roles, pattern) => {
    if (pattern.test(pathname)) {
      requiredRoles = roles;
    }
  });

  if (requiredRoles && userRole && !requiredRoles.includes(userRole)) {
    console.log("🚫 Insufficient permissions, redirecting to sign-in");
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('redirect', pathname);
    signInUrl.searchParams.set('error', 'insufficient_permissions');
    return NextResponse.redirect(signInUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
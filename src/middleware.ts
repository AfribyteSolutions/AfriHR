import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomain } from '@/lib/getSubdomain';

// Pre-compiled route protections
const protectedRoutes = new Map<RegExp, string[]>([
  [/^\/super-admin/, ['super-admin']],
  [/^\/dashboard\/hrm-dashboard/, ['admin', 'manager', 'super-admin']],
  [/^\/dashboard\/employee-dashboard/, ['employee', 'manager', 'admin', 'super-admin']],
  [/^\/dashboard\/payroll/, ['admin', 'manager', 'super-admin']],
  [/^\/dashboard\/company/, ['admin', 'super-admin']]
]);

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ✅ Skip API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const hostname = req.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);
  const res = NextResponse.next();

  // ✅ Only set cookie if changed
  const existingSubdomain = req.cookies.get('subdomain')?.value;
  if (existingSubdomain !== subdomain) {
    res.cookies.set("subdomain", subdomain || "the-media-consult", {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
  }

  // ✅ If in development, skip auth checks completely
  if (process.env.NODE_ENV === "development") {
    return res;
  }

  // ✅ Check protected routes only in production
  let requiredRoles: string[] | undefined;
  protectedRoutes.forEach((roles, pattern) => {
    if (pattern.test(pathname)) {
      requiredRoles = roles;
    }
  });

  if (requiredRoles) {
    const userRole = req.cookies.get('role')?.value || req.cookies.get('userRole')?.value;

    if (!userRole || !requiredRoles.includes(userRole)) {
      const signUpUrl = new URL('/auth/signup-basic', req.url); // 👈 force redirect to signup
      signUpUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signUpUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/dashboard/hrm-dashboard/:path*',
    '/dashboard/employee-dashboard/:path*',
    '/dashboard/payroll/:path*',
    '/dashboard/company/:path*',
    '/dashboard/:path*'
  ]
};

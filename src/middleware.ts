// ===== 5. UPDATED MIDDLEWARE (if needed) =====
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomain } from '@/lib/getSubdomain';

const protectedRoutes = new Map<RegExp, string[]>([
  [/^\/super-admin/, ['super-admin']],
  [/^\/dashboard\/hrm-dashboard/, ['admin', 'manager', 'super-admin']],
  [/^\/dashboard\/employee-dashboard/, ['employee', 'manager', 'admin', 'super-admin']],
  [/^\/dashboard\/payroll/, ['admin', 'manager', 'super-admin']],
  [/^\/dashboard\/company/, ['admin', 'super-admin']]
]);

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  if (pathname.startsWith('/api') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const hostname = req.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);
  const res = NextResponse.next();

  console.log("🔧 Middleware: hostname =", hostname, "subdomain =", subdomain);

  // Set subdomain cookie
  const existingSubdomain = req.cookies.get('subdomain')?.value;
  if (existingSubdomain !== subdomain) {
    res.cookies.set("subdomain", subdomain || "the-media-consult", {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // ✅ Set domain for cookie sharing across subdomains
      domain: process.env.NODE_ENV === 'production' ? '.afrihrm.com' : undefined,
      maxAge: 60 * 60 * 24 * 7
    });
  }

  if (process.env.NODE_ENV === "development") {
    return res;
  }

  // Protected routes check
  let requiredRoles: string[] | undefined;
  protectedRoutes.forEach((roles, pattern) => {
    if (pattern.test(pathname)) {
      requiredRoles = roles;
    }
  });

  if (requiredRoles) {
    const userRole = req.cookies.get('role')?.value || req.cookies.get('userRole')?.value;
    if (!userRole || !requiredRoles.includes(userRole)) {
      // ✅ Maintain subdomain in redirect
      const signUpUrl = new URL('/auth/signup-basic', req.url);
      signUpUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signUpUrl);
    }
  }

  return res;
}
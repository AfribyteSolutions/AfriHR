import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();

    // Determine cookie domain for cross-subdomain auth
    const cookieDomain = process.env.NODE_ENV === 'production' ? '.afrihrm.com' : 'localhost';

    // List of all cookies to clear
    const cookiesToClear = [
      'authToken',
      'token',
      'session',
      'role',
      'userRole',
      'userId',
      'userEmail',
      'subdomain',
      'lastActivity',
      'rememberMe'
    ];

    // Delete all session cookies with domain to clear across subdomains
    const clearCookieOptions = {
      domain: cookieDomain,
      path: '/',
      maxAge: 0,
    };

    cookiesToClear.forEach(cookieName => {
      cookieStore.set(cookieName, '', clearCookieOptions);
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
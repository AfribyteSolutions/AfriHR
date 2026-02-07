import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();

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

    // Delete all session cookies
    cookiesToClear.forEach(cookieName => {
      cookieStore.delete(cookieName);
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
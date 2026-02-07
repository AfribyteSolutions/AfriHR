import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, role, userId, email, subdomain, rememberMe } = body;

    if (!token || !role || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine session duration based on rememberMe
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 1; // 30 days or 1 day

    const cookieStore = cookies();

    // Set cookies with proper options
    // No domain attribute - cookies are subdomain-specific for security
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: maxAge,
    };

    // Set authentication cookies (standardized to single names)
    cookieStore.set('authToken', token, cookieOptions);
    cookieStore.set('role', role, cookieOptions);
    
    // Set additional info cookies
    cookieStore.set('userId', userId, cookieOptions);
    cookieStore.set('userEmail', email, cookieOptions);
    
    // Set subdomain cookie (not httpOnly so client can read it)
    cookieStore.set('subdomain', subdomain, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    });

    // Set lastActivity timestamp for session management
    cookieStore.set('lastActivity', Date.now().toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Session created successfully' 
    });

  } catch (error) {
    console.error('Error setting session:', error);
    return NextResponse.json(
      { error: 'Failed to set session' },
      { status: 500 }
    );
  }
}
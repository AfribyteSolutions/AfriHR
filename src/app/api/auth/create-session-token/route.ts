import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In-memory store for one-time session tokens
const sessionTokens = new Map<string, {
  token: string;
  role: string;
  userId: string;
  email: string;
  subdomain: string;
  rememberMe: boolean;
  expiresAt: number;
}>();

// FIX: Using .forEach instead of for...of to fix the TypeScript 'IterableIterator' error (ts2802)
setInterval(() => {
  const now = Date.now();
  sessionTokens.forEach((value, key) => {
    if (value.expiresAt < now) {
      sessionTokens.delete(key);
    }
  });
}, 60000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, role, userId, email, subdomain, rememberMe } = body;

    console.log('🔐 POST create session token request');

    if (!token || !role || !userId || !subdomain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a one-time session token
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (2 * 60 * 1000); // 2 minutes expiration to exchange this token

    sessionTokens.set(sessionToken, {
      token,
      role,
      userId,
      email,
      subdomain,
      rememberMe: rememberMe || false,
      expiresAt,
    });

    console.log('✅ Session token stored in memory. Total:', sessionTokens.size);

    return NextResponse.json({
      success: true,
      sessionToken,
    });

  } catch (error) {
    console.error('❌ Error creating session token:', error);
    return NextResponse.json({ error: 'Failed to create session token' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('token');

    if (!sessionToken) {
      return NextResponse.json({ error: 'Missing session token' }, { status: 400 });
    }

    const sessionData = sessionTokens.get(sessionToken);

    if (!sessionData || sessionData.expiresAt < Date.now()) {
      if (sessionData) sessionTokens.delete(sessionToken);
      return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
    }

    // Delete the one-time token after use (security best practice)
    sessionTokens.delete(sessionToken);

    // --- FIX: SETTING COOKIES FOR MIDDLEWARE ---
    // We create the response and then attach the cookies that 'middleware.ts' expects.
    const response = NextResponse.json({
      success: true,
      data: sessionData,
    });

    const cookieOptions = {
      httpOnly: false, // Set to false so client-side scripts can also access if needed
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      // If rememberMe is true, keep cookies for 30 days, otherwise 24 hours
      maxAge: sessionData.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    };

    // These names MUST match exactly what you have in middleware.ts
    response.cookies.set("authToken", sessionData.token, cookieOptions);
    response.cookies.set("role", sessionData.role, cookieOptions);
    response.cookies.set("userId", sessionData.userId, cookieOptions);
    response.cookies.set("userEmail", sessionData.email, cookieOptions);
    response.cookies.set("subdomain", sessionData.subdomain, cookieOptions);
    response.cookies.set("lastActivity", Date.now().toString(), cookieOptions);

    console.log('✅ Cookies set and session token consumed for user:', sessionData.userId);

    return response;

  } catch (error) {
    console.error('❌ Error retrieving session token:', error);
    return NextResponse.json({ error: 'Failed to retrieve session token' }, { status: 500 });
  }
}
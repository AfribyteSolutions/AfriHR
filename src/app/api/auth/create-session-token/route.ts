import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In-memory store for one-time session tokens (use Redis in production)
const sessionTokens = new Map<string, {
  token: string;
  role: string;
  userId: string;
  email: string;
  subdomain: string;
  rememberMe: boolean;
  expiresAt: number;
}>();

// Clean up expired tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionTokens.entries()) {
    if (value.expiresAt < now) {
      sessionTokens.delete(key);
    }
  }
}, 60000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, role, userId, email, subdomain, rememberMe } = body;

    console.log('🔐 POST create session token request');
    console.log('👤 User:', userId);
    console.log('🏢 Subdomain:', subdomain);
    console.log('👔 Role:', role);

    if (!token || !role || !userId || !subdomain) {
      console.error('❌ Missing required fields:', { token: !!token, role: !!role, userId: !!userId, subdomain: !!subdomain });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a one-time session token
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (2 * 60 * 1000); // 2 minutes expiration

    console.log('🔑 Generated session token:', sessionToken.substring(0, 10) + '...');
    console.log('⏱️ Expires at:', new Date(expiresAt).toISOString());

    // Store the session data
    sessionTokens.set(sessionToken, {
      token,
      role,
      userId,
      email,
      subdomain,
      rememberMe: rememberMe || false,
      expiresAt,
    });

    console.log('✅ Session token stored. Total tokens:', sessionTokens.size);

    return NextResponse.json({
      success: true,
      sessionToken,
    });

  } catch (error) {
    console.error('❌ Error creating session token:', error);
    return NextResponse.json(
      { error: 'Failed to create session token' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('token');

    console.log('🔍 GET session token request');
    console.log('🔑 Token received:', sessionToken ? 'Yes' : 'No');
    console.log('📦 Total tokens in store:', sessionTokens.size);

    if (!sessionToken) {
      console.error('❌ Missing session token in request');
      return NextResponse.json(
        { error: 'Missing session token' },
        { status: 400 }
      );
    }

    const sessionData = sessionTokens.get(sessionToken);

    if (!sessionData) {
      console.error('❌ Session token not found in store');
      console.log('🔑 Looking for:', sessionToken);
      console.log('📦 Available tokens:', Array.from(sessionTokens.keys()).map(k => k.substring(0, 10) + '...'));
      return NextResponse.json(
        { error: 'Invalid or expired session token' },
        { status: 401 }
      );
    }

    const now = Date.now();
    const timeRemaining = sessionData.expiresAt - now;
    console.log('⏱️ Token expires in:', Math.floor(timeRemaining / 1000), 'seconds');

    if (sessionData.expiresAt < now) {
      console.error('❌ Session token has expired');
      sessionTokens.delete(sessionToken);
      return NextResponse.json(
        { error: 'Session token expired' },
        { status: 401 }
      );
    }

    // Delete the one-time token after use
    sessionTokens.delete(sessionToken);
    console.log('✅ Session token consumed and deleted');
    console.log('✅ Returning session data for user:', sessionData.userId);

    return NextResponse.json({
      success: true,
      data: {
        token: sessionData.token,
        role: sessionData.role,
        userId: sessionData.userId,
        email: sessionData.email,
        subdomain: sessionData.subdomain,
        rememberMe: sessionData.rememberMe,
      },
    });

  } catch (error) {
    console.error('❌ Error retrieving session token:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session token' },
      { status: 500 }
    );
  }
}

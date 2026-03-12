import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { db } from '@/lib/firebase-admin';

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
    const expiresAt = Date.now() + (2 * 60 * 1000); // 2 minutes

    // Store in Firestore instead of in-memory (survives HMR and module reloads)
    await db.collection('sessionTokens').doc(sessionToken).set({
      token,
      role,
      userId,
      email,
      subdomain,
      rememberMe: rememberMe || false,
      expiresAt,
      createdAt: Date.now(),
    });

    console.log('✅ Session token stored in Firestore for user:', userId);

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

    // Retrieve from Firestore
    const docRef = db.collection('sessionTokens').doc(sessionToken);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
    }

    const sessionData = docSnap.data()!;

    // Check expiration
    if (sessionData.expiresAt < Date.now()) {
      await docRef.delete();
      return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
    }

    // Delete the one-time token after use (security best practice)
    await docRef.delete();

    // Create the response with cookies
    const response = NextResponse.json({
      success: true,
      data: sessionData,
    });

    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
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

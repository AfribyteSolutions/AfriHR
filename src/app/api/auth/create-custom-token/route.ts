import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log('🔐 Creating custom token for user:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Create a custom token for the user
    const customToken = await auth.createCustomToken(userId);
    console.log('✅ Custom token created successfully');

    return NextResponse.json({
      success: true,
      customToken,
    });

  } catch (error: any) {
    console.error('❌ Error creating custom token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create custom token' },
      { status: 500 }
    );
  }
}

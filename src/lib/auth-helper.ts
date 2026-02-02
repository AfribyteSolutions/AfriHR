import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';

export interface AuthenticatedUser {
  uid: string;
  email: string | undefined;
  role: string;
  companyId?: string;
}

/**
 * Verifies the auth token from cookies and returns the authenticated user
 * @param request NextRequest object
 * @returns AuthenticatedUser or null if not authenticated
 */
export async function verifyAuthToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authToken = request.cookies.get('authToken')?.value;
    const role = request.cookies.get('role')?.value;

    if (!authToken || !role) {
      return null;
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(authToken);

    if (!decodedToken) {
      return null;
    }

    // Get user's company ID from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: role,
      companyId: userData?.companyId,
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

/**
 * Middleware helper to protect API routes
 * Returns unauthorized response if user is not authenticated
 * @param request NextRequest object
 * @param requiredRoles Optional array of roles that are allowed to access the route
 * @returns AuthenticatedUser or NextResponse with 401 error
 */
export async function requireAuth(
  request: NextRequest,
  requiredRoles?: string[]
): Promise<AuthenticatedUser | NextResponse> {
  const user = await verifyAuthToken(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing auth token' },
      { status: 401 }
    );
  }

  // Check if user has required role
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Validates that the subdomain matches the user's company
 * @param request NextRequest object
 * @param user AuthenticatedUser object
 * @returns boolean indicating if subdomain is valid
 */
export async function validateSubdomain(
  request: NextRequest,
  user: AuthenticatedUser
): Promise<boolean> {
  try {
    const subdomain = request.cookies.get('subdomain')?.value;

    if (!subdomain || !user.companyId) {
      return false;
    }

    // Get company data to verify subdomain
    const companyDoc = await db.collection('companies').doc(user.companyId).get();
    const companyData = companyDoc.data();

    // Check if subdomain matches company's subdomain
    return companyData?.subdomain === subdomain;
  } catch (error) {
    console.error('Error validating subdomain:', error);
    return false;
  }
}

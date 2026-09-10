import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export const HR_ROLES = ["super-admin", "admin", "manager", "employee"] as const;
export type HrRole = (typeof HR_ROLES)[number];

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: HrRole;
  companyId?: string;
  permissions: Record<string, boolean>;
  managerType?: "branch" | "department" | null;
  branchName?: string | null;
  departmentName?: string | null;
}

const unauthorized = (message = "Authentication required") =>
  NextResponse.json({ success: false, error: message }, { status: 401 });

const forbidden = (message = "Insufficient permissions") =>
  NextResponse.json({ success: false, error: message }, { status: 403 });

function tokenFrom(request: NextRequest): string | null {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  return request.cookies.get("authToken")?.value || null;
}

export async function verifyAuthToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = tokenFrom(request);
    if (!token) return null;

    const decoded = await admin.auth().verifyIdToken(token, true);
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists) return null;

    const data = userDoc.data() || {};
    const role = data.role as HrRole;
    if (!HR_ROLES.includes(role)) return null;
    if (data.status === "inactive" || data.status === "offboarded" || data.accessRevokedAt) return null;

    return {
      uid: decoded.uid,
      email: decoded.email,
      role,
      companyId: data.companyId,
      permissions: data.permissions || {},
      managerType: data.managerType || null,
      branchName: data.branchName || null,
      departmentName: data.departmentName || null,
    };
  } catch (error) {
    console.error("Authentication failed:", error);
    return null;
  }
}

export async function requireAuth(
  request: NextRequest,
  requiredRoles?: HrRole[]
): Promise<AuthenticatedUser | NextResponse> {
  const user = await verifyAuthToken(request);
  if (!user) return unauthorized();
  if (requiredRoles && !requiredRoles.includes(user.role)) return forbidden();
  return user;
}

export function isAuthError(value: AuthenticatedUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export async function requireTenant(
  request: NextRequest,
  requiredRoles?: HrRole[]
): Promise<AuthenticatedUser | NextResponse> {
  const result = await requireAuth(request, requiredRoles);
  if (isAuthError(result)) return result;
  if (result.role !== "super-admin" && !result.companyId) return forbidden("No company is assigned to this account");
  return result;
}

export function tenantIdFor(user: AuthenticatedUser, requestedCompanyId?: string | null): string | null {
  if (user.role === "super-admin") return requestedCompanyId || user.companyId || null;
  if (requestedCompanyId && requestedCompanyId !== user.companyId) return null;
  return user.companyId || null;
}

export function can(user: AuthenticatedUser, permission: string): boolean {
  return user.role === "super-admin" || user.role === "admin" || user.permissions[permission] === true;
}

export function canManageHr(user: AuthenticatedUser): boolean {
  return user.role === "super-admin" || user.role === "admin" || user.role === "manager" || can(user, "manageHr");
}

export async function assertRecordTenant(
  collection: string,
  id: string,
  companyId: string
): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists || doc.data()?.companyId !== companyId) return null;
  return doc;
}

export async function writeAudit(input: {
  companyId: string;
  actor: AuthenticatedUser;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}) {
  await db.collection("auditLogs").add({
    companyId: input.companyId,
    actorId: input.actor.uid,
    actorEmail: input.actor.email || null,
    actorRole: input.actor.role,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata || {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

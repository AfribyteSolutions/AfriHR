// Base44-native compatibility auth for legacy Next.js API routes.
// Security rule: never trust role/tenant/user identity from cookies alone.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@base44/sdk";
import { BASE44_APP_ID } from "@/lib/base44";
import { getServerClient, setServerAuthToken } from "@/lib/base44-server";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: string;
  appRole: string;
  companyId?: string;
  tenant_id?: string;
  permissions: string[];
}

const ROLE_ALIASES: Record<string, string> = {
  "super-admin": "platform_admin",
  admin: "tenant_admin",
};

function normalizedRole(user: any): string {
  const appRole = String(user?.app_role || user?._app_role || "").trim();
  if (appRole) return appRole;
  const role = String(user?.role || "employee").trim();
  return ROLE_ALIASES[role] || role;
}

export function isAuthError(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export async function verifyAuthToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = bearer || request.cookies.get("authToken")?.value || request.cookies.get("token")?.value;
    if (!token) return null;

    const client = createClient({ appId: BASE44_APP_ID, token });
    const user = await client.auth.me();
    if (!user?.id || user.disabled) return null;

    setServerAuthToken(token);
    const tenantId = String(user.tenant_id || "").trim() || undefined;
    const appRole = normalizedRole(user);
    return {
      uid: user.id,
      email: user.email || undefined,
      role: appRole,
      appRole,
      companyId: tenantId,
      tenant_id: tenantId,
      permissions: Array.isArray(user.permissions) ? user.permissions.map(String) : [],
    };
  } catch (error) {
    console.warn("Base44 session validation failed", error);
    return null;
  }
}

export async function requireAuth(request: NextRequest, requiredRoles?: string[]): Promise<AuthenticatedUser | NextResponse> {
  const user = await verifyAuthToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (requiredRoles?.length) {
    const allowed = new Set(requiredRoles.map((r) => ROLE_ALIASES[r] || r));
    if (!allowed.has(user.appRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

export async function requireTenant(request: NextRequest, requiredRoles?: string[]): Promise<AuthenticatedUser | NextResponse> {
  const actor = await requireAuth(request, requiredRoles);
  if (isAuthError(actor)) return actor;
  if (!actor.tenant_id && actor.appRole !== "platform_admin") {
    return NextResponse.json({ error: "Tenant context required" }, { status: 403 });
  }
  return actor;
}

export function tenantIdFor(actor: AuthenticatedUser, requestedTenantId?: string | null): string | null {
  const requested = String(requestedTenantId || "").trim();
  if (actor.appRole === "platform_admin") return requested || actor.tenant_id || null;
  if (!actor.tenant_id) return null;
  if (requested && requested !== actor.tenant_id) return null;
  return actor.tenant_id;
}

export function canManageHr(actor: AuthenticatedUser): boolean {
  return ["platform_admin", "tenant_admin", "hr_manager", "payroll_manager"].includes(actor.appRole)
    || actor.permissions.includes("hr.manage")
    || actor.permissions.includes("payroll.manage");
}

export async function assertRecordTenant(collection: string, id: string, tenantId: string): Promise<any | null> {
  if (!id || !tenantId) return null;
  const { db } = await import("@/lib/firebase-admin");
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() || {};
  const recordTenant = String(data.tenant_id || data.companyId || "");
  return recordTenant === tenantId ? doc : null;
}

export async function writeAudit(args: {
  companyId: string;
  actor: AuthenticatedUser;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { companyId, action, resourceType, resourceId, metadata = {} } = args;
  const result = await getServerClient().functions.invoke("legacy-audit", {
    tenant_id: companyId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
  const data: any = (result as any)?.data ?? result;
  if (data?.success === false) throw new Error(data.error || "Audit write failed");
}

export async function validateSubdomain(request: NextRequest, user: AuthenticatedUser): Promise<boolean> {
  const subdomain = request.cookies.get("subdomain")?.value;
  return Boolean(subdomain && user.tenant_id);
}

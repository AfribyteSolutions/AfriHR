import { createClientFromRequest } from "npm:@base44/sdk";

const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (["suspended", "offboarded"].includes(String(user.employment_status || ""))) {
      return Response.json({ success: false, error: "Account disabled" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const platformAdmin = user.role === "admin" || user.app_role === "platform_admin";
    const ownTenant = clean(user.tenant_id, 100);
    const requestedTenant = clean(body.tenant_id, 100);
    const tenantId = platformAdmin ? (requestedTenant || ownTenant) : ownTenant;
    if (!tenantId) return Response.json({ success: false, error: "Tenant required" }, { status: 400 });
    if (!platformAdmin && requestedTenant && requestedTenant !== ownTenant) {
      return Response.json({ success: false, error: "Cross-tenant audit denied" }, { status: 403 });
    }

    const action = clean(body.action, 160);
    const resourceType = clean(body.resource_type, 100);
    const resourceId = clean(body.resource_id, 160);
    if (!action || !resourceType || !resourceId) {
      return Response.json({ success: false, error: "Audit action, resource type and resource id are required" }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.AuditLog.create({
      tenant_id: tenantId,
      actor_user_id: user.id,
      actor_email: user.email,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      request_id: crypto.randomUUID(),
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
      occurred_at: new Date().toISOString(),
    });

    return Response.json({ success: true, id: record.id });
  } catch (error) {
    console.error("legacy-audit", error);
    return Response.json({ success: false, error: "Audit write failed" }, { status: 500 });
  }
});

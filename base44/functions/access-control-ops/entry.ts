import { createClientFromRequest } from "npm:@base44/sdk";

const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (value: unknown, max = 200) => typeof value === "string" ? value.trim().slice(0, max) : "";
const PERMISSIONS = [
  "employees.view", "employees.manage", "recruitment.view", "recruitment.manage",
  "organization.view", "organization.manage", "leave.view", "leave.review",
  "time.view", "time.review", "workforce.view", "workforce.manage",
  "payroll.view", "payroll.manage", "performance.view", "performance.manage",
  "learning.view", "learning.manage", "relations.view", "relations.manage",
  "documents.view", "documents.manage", "reports.view",
  "offboarding.view", "offboarding.manage", "access.manage"
];
const ALLOWED = new Set(PERMISSIONS);
const BASE_ROLES = new Set(["tenant_admin", "hr_manager", "recruiter", "payroll_manager", "finance_manager", "manager", "employee"]);
const TEMPLATES = [
  { key: "tenant_admin", name: "Tenant Administrator", base_role: "tenant_admin", description: "Full tenant administration", permissions: PERMISSIONS },
  { key: "hr_manager", name: "HR Manager", base_role: "hr_manager", description: "End-to-end people operations without access administration", permissions: PERMISSIONS.filter((p) => p !== "access.manage" && p !== "payroll.manage") },
  { key: "recruiter", name: "Recruiter", base_role: "recruiter", description: "Recruitment and candidate-to-employee handoff", permissions: ["recruitment.view", "recruitment.manage", "employees.view"] },
  { key: "payroll_manager", name: "Payroll Manager", base_role: "payroll_manager", description: "Payroll preparation and finalization", permissions: ["employees.view", "payroll.view", "payroll.manage", "reports.view", "workforce.view"] },
  { key: "finance_manager", name: "Finance Manager", base_role: "finance_manager", description: "Payroll oversight and workforce finance", permissions: ["employees.view", "payroll.view", "reports.view", "workforce.view", "workforce.manage"] },
  { key: "manager", name: "People Manager", base_role: "manager", description: "Team leave, time and performance review", permissions: ["employees.view", "leave.view", "leave.review", "time.view", "time.review", "performance.view", "performance.manage", "learning.view"] },
  { key: "employee", name: "Employee", base_role: "employee", description: "Employee self-service only", permissions: [] }
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const requestId = crypto.randomUUID();
  try {
    const actor = await base44.auth.me();
    if (!actor) return json({ success: false, error: "Unauthorized" }, 401);
    if (["suspended", "offboarded"].includes(actor.employment_status)) return json({ success: false, error: "Account disabled" }, 403);
    const isPlatform = actor.app_role === "platform_admin";
    const isTenantAdmin = actor.app_role === "tenant_admin";
    const actorPermissions = new Set(Array.isArray(actor.permissions) ? actor.permissions : []);
    if (!isPlatform && !isTenantAdmin && !actorPermissions.has("access.manage")) {
      return json({ success: false, error: "Access administration permission required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const tenantId = isPlatform ? clean(body.tenant_id) || clean(actor.tenant_id) : clean(actor.tenant_id);
    if (!tenantId) return json({ success: false, error: "Tenant required" }, 400);
    if (!isPlatform && body.tenant_id && body.tenant_id !== tenantId) return json({ success: false, error: "Cross-tenant access denied" }, 403);
    const operation = clean(body.operation, 50);

    const audit = (action: string, type: string, id: string, metadata: Record<string, unknown> = {}) =>
      base44.asServiceRole.entities.AuditLog.create({
        tenant_id: tenantId, actor_user_id: actor.id, actor_email: actor.email,
        action, resource_type: type, resource_id: id, request_id: requestId,
        metadata, occurred_at: new Date().toISOString()
      });

    const ensureTemplates = async () => {
      const existing = await base44.asServiceRole.entities.AccessRole.filter({ tenant_id: tenantId }, "name", 100);
      const keys = new Set(existing.map((role: any) => role.key));
      for (const template of TEMPLATES) {
        if (!keys.has(template.key)) {
          await base44.asServiceRole.entities.AccessRole.create({
            tenant_id: tenantId, ...template, is_system: true, status: "active"
          });
        }
      }
      return base44.asServiceRole.entities.AccessRole.filter({ tenant_id: tenantId }, "name", 100);
    };

    if (operation === "list") {
      const [roles, users] = await Promise.all([
        ensureTemplates(),
        base44.asServiceRole.entities.User.filter({ tenant_id: tenantId }, "full_name", 500)
      ]);
      return json({
        success: true,
        data: {
          permission_catalog: PERMISSIONS,
          roles,
          users: users.map((user: any) => ({
            id: user.id, full_name: user.full_name || "", email: user.email || "",
            app_role: user.app_role || "employee", role_key: user.role_key || user.app_role || "employee",
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            employment_status: user.employment_status || "invited"
          }))
        }
      });
    }

    if (operation === "create_role") {
      const name = clean(body.name, 100);
      const baseRole = clean(body.base_role, 50);
      const permissions = [...new Set((Array.isArray(body.permissions) ? body.permissions : []).map((p: unknown) => clean(p, 80)).filter((p: string) => ALLOWED.has(p)))];
      if (!name || !BASE_ROLES.has(baseRole)) return json({ success: false, error: "Valid role name and base role required" }, 400);
      if (baseRole === "tenant_admin") return json({ success: false, error: "Custom roles cannot inherit tenant administrator access" }, 400);
      const key = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40)}_${crypto.randomUUID().slice(0, 6)}`;
      const role = await base44.asServiceRole.entities.AccessRole.create({
        tenant_id: tenantId, key, name, description: clean(body.description, 500),
        base_role: baseRole, permissions, is_system: false, status: "active"
      });
      await audit("access_role.created", "AccessRole", role.id, { key, base_role: baseRole, permissions });
      return json({ success: true, data: role }, 201);
    }

    if (operation === "update_role") {
      const roleId = clean(body.role_id);
      const role = await base44.asServiceRole.entities.AccessRole.get(roleId);
      if (!role || role.tenant_id !== tenantId) return json({ success: false, error: "Role not found" }, 404);
      if (role.is_system) return json({ success: false, error: "System role templates cannot be modified" }, 409);
      const permissions = [...new Set((Array.isArray(body.permissions) ? body.permissions : []).map((p: unknown) => clean(p, 80)).filter((p: string) => ALLOWED.has(p)))];
      const updated = await base44.asServiceRole.entities.AccessRole.update(roleId, {
        name: clean(body.name, 100) || role.name,
        description: clean(body.description, 500),
        permissions,
        status: body.status === "archived" ? "archived" : "active"
      });
      await audit("access_role.updated", "AccessRole", roleId, { permissions, status: updated.status });
      return json({ success: true, data: updated });
    }

    if (operation === "assign_role") {
      const targetId = clean(body.user_id);
      const roleId = clean(body.role_id);
      const [target, role] = await Promise.all([
        base44.asServiceRole.entities.User.get(targetId),
        base44.asServiceRole.entities.AccessRole.get(roleId)
      ]);
      if (!target || target.tenant_id !== tenantId || !role || role.tenant_id !== tenantId || role.status !== "active") {
        return json({ success: false, error: "User or role not found" }, 404);
      }
      if (target.app_role === "platform_admin") return json({ success: false, error: "Platform administrators cannot be changed here" }, 409);
      if (target.id === actor.id && role.base_role !== "tenant_admin") return json({ success: false, error: "You cannot remove your own tenant administrator access" }, 409);
      if (target.app_role === "tenant_admin" && role.base_role !== "tenant_admin") {
        const admins = await base44.asServiceRole.entities.User.filter({ tenant_id: tenantId, app_role: "tenant_admin" }, "created_date", 10);
        if (admins.length <= 1) return json({ success: false, error: "At least one tenant administrator is required" }, 409);
      }
      await base44.asServiceRole.entities.User.update(targetId, {
        app_role: role.base_role, role_key: role.key, permissions: role.permissions
      });
      await audit("user.role_assigned", "User", targetId, { role_key: role.key, base_role: role.base_role, permissions: role.permissions });
      return json({ success: true });
    }

    return json({ success: false, error: "Unsupported operation" }, 400);
  } catch (error) {
    console.error("access-control-ops", requestId, error);
    return json({ success: false, error: "Access control operation failed", request_id: requestId }, 500);
  }
});

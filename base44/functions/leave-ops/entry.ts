import { createClientFromRequest } from "npm:@base44/sdk";

const HR_ROLES = new Set(["platform_admin", "tenant_admin", "hr_manager"]);
const MANAGER_ROLES = new Set([...HR_ROLES, "manager"]);
const LEAVE_TYPES = new Set(["annual", "sick", "maternity", "paternity", "bereavement", "unpaid", "other"]);
const clean = (v: unknown, max = 500) => typeof v === "string" ? v.trim().slice(0, max) : "";
const json = (body: unknown, status = 200) => Response.json(body, { status });

function inclusiveDays(start: string, end: string) {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || b < a) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const requestId = crypto.randomUUID();
  try {
    const user = await base44.auth.me();
    if (!user) return json({ success: false, error: "Unauthorized" }, 401);
    if (["suspended", "offboarded"].includes(user.employment_status)) return json({ success: false, error: "Account disabled" }, 403);
    const body = await req.json().catch(() => ({}));
    const platformAdmin = user.role === "admin" || user.app_role === "platform_admin";
    const tenantId = platformAdmin ? clean(body.tenant_id, 100) || clean(user.tenant_id, 100) : clean(user.tenant_id, 100);
    if (!tenantId) return json({ success: false, error: "Tenant required" }, 400);
    if (!platformAdmin && body.tenant_id && body.tenant_id !== tenantId) return json({ success: false, error: "Cross-tenant access denied" }, 403);
    const appRole = clean(user.app_role, 50) || "employee";
    const employees = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenantId }, "-created_date", 250);
    const self = employees.find((e: any) => e.user_id === user.id) || employees.find((e: any) => String(e.email).toLowerCase() === String(user.email).toLowerCase());
    const operation = clean(body.operation, 50);

    const audit = (action: string, id: string, metadata: Record<string, unknown> = {}) =>
      base44.asServiceRole.entities.AuditLog.create({
        tenant_id: tenantId, actor_user_id: user.id, actor_email: user.email,
        action, resource_type: "LeaveRequest", resource_id: id, request_id: requestId,
        metadata, occurred_at: new Date().toISOString()
      });

    if (operation === "list") {
      let records = await base44.asServiceRole.entities.LeaveRequest.filter({ tenant_id: tenantId }, "-created_date", 250);
      if (appRole === "employee") records = self ? records.filter((r: any) => r.employee_id === self.id) : [];
      if (appRole === "manager" && self) {
        const managed = new Set(employees.filter((e: any) => e.manager_id === self.id).map((e: any) => e.id));
        records = records.filter((r: any) => managed.has(r.employee_id) || r.employee_id === self.id);
      }
      const byId = Object.fromEntries(employees.map((e: any) => [e.id, e]));
      return json({ success: true, data: records.map((r: any) => ({ ...r, employee: byId[r.employee_id] || null })) });
    }

    if (operation === "submit") {
      const requestedEmployeeId = clean(body.employee_id, 100);
      const employeeId = HR_ROLES.has(appRole) || platformAdmin ? requestedEmployeeId || self?.id : self?.id;
      if (!employeeId) return json({ success: false, error: "No employee profile is linked to this user" }, 409);
      const employee = employees.find((e: any) => e.id === employeeId);
      if (!employee) return json({ success: false, error: "Employee not found" }, 404);
      const start = clean(body.start_date, 10);
      const end = clean(body.end_date, 10);
      const type = clean(body.leave_type, 50);
      const days = inclusiveDays(start, end);
      if (!LEAVE_TYPES.has(type) || !days) return json({ success: false, error: "Valid leave type and date range required" }, 400);
      const overlaps = await base44.asServiceRole.entities.LeaveRequest.filter({ tenant_id: tenantId, employee_id: employeeId }, "-created_date", 100);
      if (overlaps.some((r: any) => ["pending", "approved"].includes(r.status) && r.start_date <= end && r.end_date >= start)) {
        return json({ success: false, error: "This request overlaps an existing pending or approved leave" }, 409);
      }
      const record = await base44.asServiceRole.entities.LeaveRequest.create({
        tenant_id: tenantId, employee_id: employeeId, leave_type: type,
        start_date: start, end_date: end, days, reason: clean(body.reason, 1000), status: "pending"
      });
      await audit("leave.submitted", record.id, { employee_id: employeeId, days, leave_type: type });
      return json({ success: true, data: record }, 201);
    }

    if (operation === "decide") {
      if (!MANAGER_ROLES.has(appRole) && !platformAdmin) return json({ success: false, error: "Forbidden" }, 403);
      const id = clean(body.leave_request_id, 100);
      const decision = clean(body.decision, 20);
      if (!["approved", "rejected"].includes(decision)) return json({ success: false, error: "Decision must be approved or rejected" }, 400);
      const record = await base44.asServiceRole.entities.LeaveRequest.get(id);
      if (!record || record.tenant_id !== tenantId) return json({ success: false, error: "Leave request not found" }, 404);
      if (record.status !== "pending") return json({ success: false, error: "Only pending requests can be reviewed" }, 409);
      if (appRole === "manager") {
        if (!self) return json({ success: false, error: "Manager employee profile missing" }, 409);
        const employee = employees.find((e: any) => e.id === record.employee_id);
        if (!employee || employee.manager_id !== self.id) return json({ success: false, error: "You can only review requests from direct reports" }, 403);
      }
      const updated = await base44.asServiceRole.entities.LeaveRequest.update(id, {
        status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_note: clean(body.review_note, 1000)
      });
      await audit(`leave.${decision}`, id, { employee_id: record.employee_id });
      return json({ success: true, data: updated });
    }

    if (operation === "cancel") {
      const id = clean(body.leave_request_id, 100);
      const record = await base44.asServiceRole.entities.LeaveRequest.get(id);
      if (!record || record.tenant_id !== tenantId) return json({ success: false, error: "Leave request not found" }, 404);
      const mayCancel = platformAdmin || HR_ROLES.has(appRole) || (self && record.employee_id === self.id);
      if (!mayCancel) return json({ success: false, error: "Forbidden" }, 403);
      if (record.status !== "pending") return json({ success: false, error: "Only pending requests can be cancelled" }, 409);
      const updated = await base44.asServiceRole.entities.LeaveRequest.update(id, { status: "cancelled" });
      await audit("leave.cancelled", id, { employee_id: record.employee_id });
      return json({ success: true, data: updated });
    }

    return json({ success: false, error: "Unsupported operation" }, 400);
  } catch (error) {
    console.error("leave-ops", requestId, error);
    return json({ success: false, error: "Internal server error", request_id: requestId }, 500);
  }
});

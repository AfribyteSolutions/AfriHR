import { createClientFromRequest } from "npm:@base44/sdk";

const HR = new Set(["platform_admin", "tenant_admin", "hr_manager"]);
const REVIEWERS = new Set([...HR, "manager"]);
const clean = (v: unknown, max = 2000) => typeof v === "string" ? v.trim().slice(0, max) : "";
const json = (body: unknown, status = 200) => Response.json(body, { status });

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
    const role = clean(user.app_role, 50) || "employee";
    const permissions = new Set(Array.isArray(user.permissions) ? user.permissions : []);
    const canViewAll = platformAdmin || HR.has(role) || permissions.has("performance.view") || permissions.has("performance.manage");
    const canManage = platformAdmin || HR.has(role) || permissions.has("performance.manage");
    const employees = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenantId }, "-created_date", 500);
    const self = employees.find((e: any) => e.user_id === user.id) || employees.find((e: any) => String(e.email).toLowerCase() === String(user.email).toLowerCase());
    const byId = Object.fromEntries(employees.map((e: any) => [e.id, e]));
    const operation = clean(body.operation, 50);
    const audit = (action: string, id: string, metadata: Record<string, unknown> = {}) =>
      base44.asServiceRole.entities.AuditLog.create({
        tenant_id: tenantId, actor_user_id: user.id, actor_email: user.email,
        action, resource_type: "PerformanceReview", resource_id: id, request_id: requestId,
        metadata, occurred_at: new Date().toISOString()
      });

    const canReviewEmployee = (employeeId: string) => {
      if (canManage) return true;
      return role === "manager" && !!self && byId[employeeId]?.manager_id === self.id;
    };

    if (operation === "list") {
      let records = await base44.asServiceRole.entities.PerformanceReview.filter({ tenant_id: tenantId }, "-created_date", 250);
      if (!canViewAll) {
        if (role === "manager" && self) {
          const managed = new Set(employees.filter((e: any) => e.manager_id === self.id).map((e: any) => e.id));
          records = records.filter((r: any) => managed.has(r.employee_id) || r.employee_id === self.id);
        } else records = self ? records.filter((r: any) => r.employee_id === self.id) : [];
      }
      return json({ success: true, data: records.map((r: any) => ({
        ...r, employee: byId[r.employee_id] || null, reviewer: byId[r.reviewer_id] || null,
        can_submit: r.status === "draft" && canReviewEmployee(r.employee_id),
        can_acknowledge: r.status === "submitted" && !!self && r.employee_id === self.id,
        can_close: r.status === "acknowledged" && canManage
      })) });
    }

    if (operation === "create") {
      if (!canManage && role !== "manager") return json({ success: false, error: "Performance management permission required" }, 403);
      const employeeId = clean(body.employee_id, 100);
      if (!byId[employeeId]) return json({ success: false, error: "Employee not found" }, 404);
      if (!canReviewEmployee(employeeId)) return json({ success: false, error: "You can only review direct reports" }, 403);
      const start = clean(body.period_start, 10), end = clean(body.period_end, 10);
      if (!start || !end || end < start) return json({ success: false, error: "Valid review period required" }, 400);
      const reviewerId = role === "manager" ? self?.id : clean(body.reviewer_id, 100) || self?.id || user.id;
      if (!reviewerId) return json({ success: false, error: "Reviewer employee profile required" }, 409);
      const record = await base44.asServiceRole.entities.PerformanceReview.create({
        tenant_id: tenantId, employee_id: employeeId, reviewer_id: reviewerId,
        period_start: start, period_end: end, goals: Array.isArray(body.goals) ? body.goals.map((g: unknown) => clean(g, 500)).filter(Boolean).slice(0, 20) : [],
        rating: Number(body.rating) || undefined, feedback: clean(body.feedback), status: "draft"
      });
      await audit("performance.created", record.id, { employee_id: employeeId });
      return json({ success: true, data: record }, 201);
    }

    const id = clean(body.review_id, 100);
    const record = id ? await base44.asServiceRole.entities.PerformanceReview.get(id) : null;
    if (!record || record.tenant_id !== tenantId) return json({ success: false, error: "Review not found" }, 404);

    if (operation === "update") {
      if (record.status !== "draft") return json({ success: false, error: "Only draft reviews can be edited" }, 409);
      if (!canReviewEmployee(record.employee_id)) return json({ success: false, error: "Forbidden" }, 403);
      const rating = Number(body.rating);
      const updated = await base44.asServiceRole.entities.PerformanceReview.update(id, {
        goals: Array.isArray(body.goals) ? body.goals.map((g: unknown) => clean(g, 500)).filter(Boolean).slice(0, 20) : record.goals,
        rating: rating >= 1 && rating <= 5 ? rating : record.rating,
        feedback: body.feedback === undefined ? record.feedback : clean(body.feedback)
      });
      await audit("performance.updated", id);
      return json({ success: true, data: updated });
    }

    if (operation === "submit") {
      if (record.status !== "draft") return json({ success: false, error: "Only draft reviews can be submitted" }, 409);
      if (!canReviewEmployee(record.employee_id)) return json({ success: false, error: "Forbidden" }, 403);
      if (!(Number(record.rating) >= 1 && Number(record.rating) <= 5) || !clean(record.feedback)) return json({ success: false, error: "Rating and feedback are required" }, 400);
      const updated = await base44.asServiceRole.entities.PerformanceReview.update(id, { status: "submitted", submitted_at: new Date().toISOString() });
      await audit("performance.submitted", id, { employee_id: record.employee_id });
      return json({ success: true, data: updated });
    }

    if (operation === "acknowledge") {
      if (record.status !== "submitted") return json({ success: false, error: "Only submitted reviews can be acknowledged" }, 409);
      if (!self || record.employee_id !== self.id) return json({ success: false, error: "Only the reviewed employee can acknowledge" }, 403);
      const updated = await base44.asServiceRole.entities.PerformanceReview.update(id, { status: "acknowledged", acknowledged_at: new Date().toISOString() });
      await audit("performance.acknowledged", id);
      return json({ success: true, data: updated });
    }

    if (operation === "close") {
      if (!canManage) return json({ success: false, error: "Performance management permission required" }, 403);
      if (record.status !== "acknowledged") return json({ success: false, error: "Only acknowledged reviews can be closed" }, 409);
      const updated = await base44.asServiceRole.entities.PerformanceReview.update(id, { status: "closed", closed_at: new Date().toISOString() });
      await audit("performance.closed", id);
      return json({ success: true, data: updated });
    }

    return json({ success: false, error: "Unsupported operation" }, 400);
  } catch (error) {
    console.error("performance-ops", requestId, error);
    return json({ success: false, error: "Internal server error", request_id: requestId }, 500);
  }
});

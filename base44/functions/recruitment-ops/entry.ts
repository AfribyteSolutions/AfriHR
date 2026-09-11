import { createClientFromRequest } from "npm:@base44/sdk";

const HR_ROLES = new Set(["platform_admin", "tenant_admin", "hr_manager", "recruiter"]);
const STAGES = ["applied", "screening", "interview", "assessment", "offer", "hired", "rejected", "withdrawn"];
const TRANSITIONS: Record<string, string[]> = {
  applied: ["screening", "rejected", "withdrawn"],
  screening: ["interview", "rejected", "withdrawn"],
  interview: ["assessment", "offer", "rejected", "withdrawn"],
  assessment: ["interview", "offer", "rejected", "withdrawn"],
  offer: ["hired", "rejected", "withdrawn"],
  hired: [], rejected: [], withdrawn: []
};

const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const today = () => new Date().toISOString().slice(0, 10);

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const requestId = crypto.randomUUID();
  try {
    const user = await base44.auth.me();
    if (!user) return json({ success: false, error: "Unauthorized", request_id: requestId }, 401);
    if (["suspended", "offboarded"].includes(user.employment_status)) return json({ success: false, error: "Account disabled", request_id: requestId }, 403);

    const userTenant = clean(user.tenant_id, 100);
    const appRole = clean(user.app_role, 50);
    const platformAdmin = user.role === "admin" || appRole === "platform_admin";
    if (!platformAdmin && (!userTenant || !HR_ROLES.has(appRole))) {
      return json({ success: false, error: "Insufficient permissions", request_id: requestId }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const operation = clean(body.operation, 50);
    const requestedTenant = clean(body.tenant_id, 100);
    const tenantId = platformAdmin ? requestedTenant || userTenant : userTenant;
    if (!tenantId) return json({ success: false, error: "A tenant is required", request_id: requestId }, 400);
    if (!platformAdmin && requestedTenant && requestedTenant !== userTenant) {
      return json({ success: false, error: "Cross-tenant access denied", request_id: requestId }, 403);
    }

    const audit = async (action: string, type: string, id: string, metadata: Record<string, unknown> = {}) =>
      base44.asServiceRole.entities.AuditLog.create({
        tenant_id: tenantId, actor_user_id: user.id, actor_email: user.email,
        action, resource_type: type, resource_id: id, request_id: requestId,
        metadata, occurred_at: new Date().toISOString()
      });

    if (operation === "list_candidates") {
      const records = await base44.asServiceRole.entities.Candidate.filter(
        { tenant_id: tenantId }, "-created_date",
        Math.min(Math.max(Number(body.limit) || 100, 1), 250),
        Math.max(Number(body.skip) || 0, 0)
      );
      return json({ success: true, data: records, request_id: requestId });
    }

    if (operation === "create_candidate") {
      const fullName = clean(body.full_name, 160);
      const email = clean(body.email, 254).toLowerCase();
      if (!fullName || !email.includes("@")) return json({ success: false, error: "A valid name and email are required", request_id: requestId }, 400);
      const jobOpeningId = clean(body.job_opening_id, 100);
      const existing = await base44.asServiceRole.entities.Candidate.filter(
        { tenant_id: tenantId, email, job_opening_id: jobOpeningId }, "-created_date", 1
      );
      if (existing.length) return json({ success: true, data: existing[0], duplicate: true, request_id: requestId });

      const candidate = await base44.asServiceRole.entities.Candidate.create({
        tenant_id: tenantId, job_opening_id: jobOpeningId, full_name: fullName, email,
        phone: clean(body.phone, 50), position: clean(body.position, 160),
        department: clean(body.department, 160), source: clean(body.source, 100) || "internal",
        stage: "applied", resume_file_uri: clean(body.resume_file_uri, 2000),
        photo_file_uri: clean(body.photo_file_uri, 2000), notes: clean(body.notes, 4000),
        assigned_to: clean(body.assigned_to, 100)
      });
      await audit("candidate.created", "Candidate", candidate.id, { source: candidate.source || null });
      return json({ success: true, data: candidate, request_id: requestId }, 201);
    }

    if (operation === "update_candidate") {
      const id = clean(body.candidate_id, 100);
      const candidate = await base44.asServiceRole.entities.Candidate.get(id);
      if (!candidate || candidate.tenant_id !== tenantId) return json({ success: false, error: "Candidate not found", request_id: requestId }, 404);
      const updates: Record<string, string> = {};
      if (body.notes !== undefined) updates.notes = clean(body.notes, 4000);
      if (body.assigned_to !== undefined) updates.assigned_to = clean(body.assigned_to, 100);
      const updated = await base44.asServiceRole.entities.Candidate.update(id, updates);
      await audit("candidate.updated", "Candidate", id, { fields: Object.keys(updates) });
      return json({ success: true, data: updated, request_id: requestId });
    }

    if (operation === "change_stage") {
      const id = clean(body.candidate_id, 100);
      const next = clean(body.stage, 30);
      if (!id || !STAGES.includes(next)) return json({ success: false, error: "Valid candidate_id and stage are required", request_id: requestId }, 400);
      const candidate = await base44.asServiceRole.entities.Candidate.get(id);
      if (!candidate || candidate.tenant_id !== tenantId) return json({ success: false, error: "Candidate not found", request_id: requestId }, 404);
      if (candidate.stage === next) return json({ success: true, data: candidate, unchanged: true, request_id: requestId });
      if (next === "hired") return json({ success: false, error: "Use hire_candidate to complete hiring", request_id: requestId }, 409);
      if (!(TRANSITIONS[candidate.stage] || []).includes(next)) {
        return json({ success: false, error: `Invalid stage transition: ${candidate.stage} -> ${next}`, request_id: requestId }, 409);
      }
      const updated = await base44.asServiceRole.entities.Candidate.update(id, { stage: next });
      await audit("candidate.stage_changed", "Candidate", id, { from: candidate.stage, to: next });
      return json({ success: true, data: updated, request_id: requestId });
    }

    if (operation === "hire_candidate") {
      const id = clean(body.candidate_id, 100);
      const candidate = await base44.asServiceRole.entities.Candidate.get(id);
      if (!candidate || candidate.tenant_id !== tenantId) return json({ success: false, error: "Candidate not found", request_id: requestId }, 404);

      if (candidate.hired_employee_id) {
        const employee = await base44.asServiceRole.entities.Employee.get(candidate.hired_employee_id);
        return json({ success: true, data: employee, duplicate: true, request_id: requestId });
      }
      if (candidate.stage !== "offer") return json({ success: false, error: "Candidate must be in offer stage before hiring", request_id: requestId }, 409);

      const duplicateEmployees = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenantId, email: candidate.email }, "-created_date", 1);
      const employee = duplicateEmployees[0] || await base44.asServiceRole.entities.Employee.create({
        tenant_id: tenantId,
        employee_number: `AFH-${Date.now().toString(36).toUpperCase()}`,
        full_name: candidate.full_name, email: candidate.email,
        department: candidate.department || "", job_title: candidate.position || "",
        hire_date: clean(body.hire_date, 10) || today(),
        lifecycle_stage: "preboarding", employment_status: "invited"
      });

      const existingOnboarding = await base44.asServiceRole.entities.Onboarding.filter({ tenant_id: tenantId, employee_id: employee.id }, "-created_date", 1);
      if (!existingOnboarding.length) {
        await base44.asServiceRole.entities.Onboarding.create({
          tenant_id: tenantId, employee_id: employee.id, candidate_id: candidate.id,
          status: "not_started", start_date: clean(body.hire_date, 10) || today(),
          tasks: [
            { key: "documents", title: "Collect employment documents", owner: "hr", status: "pending" },
            { key: "equipment", title: "Prepare equipment and access", owner: "manager", status: "pending" },
            { key: "orientation", title: "Schedule orientation", owner: "hr", status: "pending" }
          ]
        });
      }

      await base44.asServiceRole.entities.Candidate.update(id, { stage: "hired", hired_employee_id: employee.id });
      await audit("candidate.hired", "Candidate", id, { employee_id: employee.id, reused_employee: duplicateEmployees.length > 0 });
      return json({ success: true, data: employee, duplicate: duplicateEmployees.length > 0, request_id: requestId });
    }

    return json({ success: false, error: "Unsupported operation", request_id: requestId }, 400);
  } catch (error) {
    console.error("recruitment-ops", requestId, error);
    return json({ success: false, error: "Internal server error", request_id: requestId }, 500);
  }
});

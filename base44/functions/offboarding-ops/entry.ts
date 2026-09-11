import { createClientFromRequest } from "npm:@base44/sdk";

const HR = new Set(["platform_admin", "tenant_admin", "hr_manager"]);
const TYPES = new Set(["resignation", "termination", "retirement", "contract_end", "other"]);
const clean = (v: unknown, max = 2000) => typeof v === "string" ? v.trim().slice(0, max) : "";
const json = (body: unknown, status = 200) => Response.json(body, { status });
const defaultTasks = () => [
  { id: "knowledge-handover", label: "Knowledge handover completed", required: true, completed: false },
  { id: "assets", label: "Company assets returned", required: true, completed: false },
  { id: "access", label: "System access removal confirmed", required: true, completed: false },
  { id: "finance", label: "Final payroll and benefits cleared", required: true, completed: false },
  { id: "documents", label: "Final documents issued", required: true, completed: false },
  { id: "exit-interview", label: "Exit interview completed", required: false, completed: false }
];

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
    const isHr = platformAdmin || HR.has(role);
    const employees = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenantId }, "-created_date", 500);
    const self = employees.find((e: any) => e.user_id === user.id) || employees.find((e: any) => String(e.email).toLowerCase() === String(user.email).toLowerCase());
    const byId = Object.fromEntries(employees.map((e: any) => [e.id, e]));
    const operation = clean(body.operation, 50);
    const audit = (action: string, id: string, metadata: Record<string, unknown> = {}) =>
      base44.asServiceRole.entities.AuditLog.create({
        tenant_id: tenantId, actor_user_id: user.id, actor_email: user.email,
        action, resource_type: "Offboarding", resource_id: id, request_id: requestId,
        metadata, occurred_at: new Date().toISOString()
      });

    if (operation === "list") {
      let records = await base44.asServiceRole.entities.Offboarding.filter({ tenant_id: tenantId }, "-created_date", 250);
      if (!isHr) records = self ? records.filter((r: any) => r.employee_id === self.id) : [];
      return json({ success: true, data: records.map((r: any) => ({
        ...r, final_document_uri: undefined, employee: byId[r.employee_id] || null,
        can_manage: isHr && !["completed", "cancelled"].includes(r.status),
        can_complete: isHr && r.status === "ready_to_complete",
        can_download: !!r.final_document_uri && (isHr || (!!self && self.id === r.employee_id))
      })) });
    }

    if (operation === "initiate") {
      if (!isHr) return json({ success: false, error: "HR access required" }, 403);
      const employeeId = clean(body.employee_id, 100);
      const employee = byId[employeeId];
      const type = clean(body.offboarding_type, 50);
      const lastDate = clean(body.last_working_date, 10);
      if (!employee) return json({ success: false, error: "Employee not found" }, 404);
      if (!TYPES.has(type) || !lastDate) return json({ success: false, error: "Type and last working date required" }, 400);
      if (employee.lifecycle_stage === "offboarded") return json({ success: false, error: "Employee is already offboarded" }, 409);
      const existing = await base44.asServiceRole.entities.Offboarding.filter({ tenant_id: tenantId, employee_id: employeeId }, "-created_date", 20);
      const active = existing.find((r: any) => !["completed", "cancelled"].includes(r.status));
      if (active) return json({ success: true, data: active, idempotent: true });
      const record = await base44.asServiceRole.entities.Offboarding.create({
        tenant_id: tenantId, employee_id: employeeId, offboarding_type: type,
        reason: clean(body.reason), last_working_date: lastDate, status: "initiated",
        previous_lifecycle_stage: employee.lifecycle_stage || "active",
        previous_employment_status: employee.employment_status || "active",
        tasks: defaultTasks(), initiated_by: user.id
      });
      await base44.asServiceRole.entities.Employee.update(employeeId, { lifecycle_stage: "offboarding" });
      await audit("offboarding.initiated", record.id, { employee_id: employeeId, type, last_working_date: lastDate });
      return json({ success: true, data: record }, 201);
    }

    const id = clean(body.offboarding_id, 100);
    const record = id ? await base44.asServiceRole.entities.Offboarding.get(id) : null;
    if (!record || record.tenant_id !== tenantId) return json({ success: false, error: "Offboarding record not found" }, 404);

    if (operation === "download_final_document") {
      const ownsRecord = !!self && self.id === record.employee_id;
      if (!isHr && !ownsRecord) return json({ success: false, error: "Forbidden" }, 403);
      if (!record.final_document_uri) return json({ success: false, error: "No final document uploaded" }, 404);
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: record.final_document_uri, expires_in: 300 });
      await audit("offboarding.final_document_downloaded", id, { employee_id: record.employee_id });
      return json({ success: true, data: { signed_url: signed.signed_url, expires_in: 300 } });
    }

    if (!isHr) return json({ success: false, error: "HR access required" }, 403);
    if (["completed", "cancelled"].includes(record.status)) {
      return json({ success: false, error: "This offboarding record is locked" }, 409);
    }

    if (operation === "update_task") {
      const taskId = clean(body.task_id, 100);
      const tasks = Array.isArray(record.tasks) ? record.tasks : [];
      if (!tasks.some((t: any) => t.id === taskId)) return json({ success: false, error: "Task not found" }, 404);
      const updatedTasks = tasks.map((t: any) => t.id === taskId ? {
        ...t, completed: Boolean(body.completed),
        completed_by: body.completed ? user.id : undefined,
        completed_at: body.completed ? new Date().toISOString() : undefined
      } : t);
      const requiredDone = updatedTasks.filter((t: any) => t.required).every((t: any) => t.completed);
      const status = requiredDone ? "ready_to_complete" : updatedTasks.some((t: any) => t.completed) ? "in_progress" : "initiated";
      const updated = await base44.asServiceRole.entities.Offboarding.update(id, { tasks: updatedTasks, status });
      await audit("offboarding.task_updated", id, { task_id: taskId, completed: Boolean(body.completed) });
      return json({ success: true, data: updated });
    }

    if (operation === "save_details") {
      const updated = await base44.asServiceRole.entities.Offboarding.update(id, {
        exit_interview_notes: body.exit_interview_notes === undefined ? record.exit_interview_notes : clean(body.exit_interview_notes, 5000),
        final_document_uri: body.final_document_uri === undefined ? record.final_document_uri : clean(body.final_document_uri, 2000)
      });
      await audit("offboarding.details_updated", id, { final_document_added: !!body.final_document_uri });
      return json({ success: true, data: { ...updated, final_document_uri: undefined } });
    }

    if (operation === "cancel") {
      const employee = byId[record.employee_id];
      if (employee) await base44.asServiceRole.entities.Employee.update(employee.id, {
        lifecycle_stage: record.previous_lifecycle_stage || "active",
        employment_status: record.previous_employment_status || "active"
      });
      const updated = await base44.asServiceRole.entities.Offboarding.update(id, { status: "cancelled", cancelled_at: new Date().toISOString() });
      await audit("offboarding.cancelled", id, { employee_id: record.employee_id });
      return json({ success: true, data: updated });
    }

    if (operation === "complete") {
      const requiredDone = Array.isArray(record.tasks) && record.tasks.filter((t: any) => t.required).every((t: any) => t.completed);
      if (!requiredDone || record.status !== "ready_to_complete") return json({ success: false, error: "All required clearance tasks must be complete" }, 409);
      const employee = byId[record.employee_id];
      if (!employee) return json({ success: false, error: "Employee not found" }, 404);
      const expected = clean(employee.employee_number, 100) || clean(employee.email, 255);
      if (clean(body.confirmation, 255) !== expected) return json({ success: false, error: `Enter ${expected} to confirm irreversible completion` }, 400);
      const employmentStatus = record.offboarding_type === "resignation" ? "resigned" : "terminated";
      let linkedUser: any = null;
      if (employee.user_id) linkedUser = await base44.asServiceRole.entities.User.get(employee.user_id).catch(() => null);
      if (!linkedUser && employee.email) {
        const matches = await base44.asServiceRole.entities.User.filter({ email: employee.email }, "-created_date", 5);
        linkedUser = matches.find((candidate: any) => candidate.tenant_id === tenantId) || null;
      }
      if (linkedUser?.app_role === "platform_admin") return json({ success: false, error: "Platform administrators cannot be disabled through tenant offboarding" }, 409);

      let userDisabled = false;
      let employeeUpdated = false;
      try {
        if (linkedUser) {
          await base44.asServiceRole.entities.User.update(linkedUser.id, { employment_status: "offboarded" });
          userDisabled = true;
        }
        await base44.asServiceRole.entities.Employee.update(employee.id, { lifecycle_stage: "offboarded", employment_status: employmentStatus });
        employeeUpdated = true;
        const updated = await base44.asServiceRole.entities.Offboarding.update(id, {
          status: "completed", completed_by: user.id, completed_at: new Date().toISOString()
        });
        await audit("offboarding.completed", id, {
          employee_id: employee.id, employment_status: employmentStatus,
          linked_user_id: linkedUser?.id || null, access_disabled: userDisabled
        });
        return json({ success: true, data: updated, access_disabled: userDisabled });
      } catch (completionError) {
        if (employeeUpdated) await base44.asServiceRole.entities.Employee.update(employee.id, {
          lifecycle_stage: employee.lifecycle_stage, employment_status: employee.employment_status
        }).catch(() => undefined);
        if (userDisabled && linkedUser) await base44.asServiceRole.entities.User.update(linkedUser.id, {
          employment_status: linkedUser.employment_status || "active"
        }).catch(() => undefined);
        throw completionError;
      }
    }

    return json({ success: false, error: "Unsupported operation" }, 400);
  } catch (error) {
    console.error("offboarding-ops", requestId, error);
    return json({ success: false, error: "Internal server error", request_id: requestId }, 500);
  }
});

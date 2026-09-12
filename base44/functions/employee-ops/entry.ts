import { createClientFromRequest } from "npm:@base44/sdk";

const ADMIN_ROLES = new Set(["platform_admin", "tenant_admin", "hr_manager"]);
const json = (body: unknown, status = 200) => Response.json(body, { status });
const clean = (v: unknown, max = 200) => typeof v === "string" ? v.trim().slice(0, max) : "";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const requestId = crypto.randomUUID();
  try {
    const user = await base44.auth.me();
    if (!user) return json({ success: false, error: "Unauthorized" }, 401);
    if (["suspended", "offboarded"].includes(user.employment_status)) return json({ success: false, error: "Account disabled" }, 403);
    const platformAdmin = user.role === "admin" || user.app_role === "platform_admin";
    const permissions = new Set(Array.isArray(user.permissions) ? user.permissions : []);
    const canView = platformAdmin || ADMIN_ROLES.has(user.app_role) || permissions.has("employees.view") || permissions.has("employees.manage");
    const canManage = platformAdmin || ADMIN_ROLES.has(user.app_role) || permissions.has("employees.manage");
    if (!canView) return json({ success: false, error: "Employee access required" }, 403);
    const body = await req.json().catch(() => ({}));
    const tenantId = platformAdmin ? clean(body.tenant_id) || clean(user.tenant_id) : clean(user.tenant_id);
    if (!tenantId) return json({ success: false, error: "Tenant required" }, 400);
    if (!platformAdmin && body.tenant_id && body.tenant_id !== tenantId) return json({ success: false, error: "Cross-tenant access denied" }, 403);
    const operation = clean(body.operation, 50);
    const writeOperations = new Set(["create_employee", "update_employee", "update_onboarding_task"]);
    if (writeOperations.has(operation) && !canManage) return json({ success: false, error: "Employee management permission required" }, 403);

    const audit = (action: string, type: string, id: string, metadata: Record<string, unknown> = {}) =>
      base44.asServiceRole.entities.AuditLog.create({
        tenant_id: tenantId, actor_user_id: user.id, actor_email: user.email,
        action, resource_type: type, resource_id: id, request_id: requestId,
        metadata, occurred_at: new Date().toISOString()
      });

    if (operation === "list_employees") {
      const employees = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenantId }, "-created_date", 250);
      return json({ success: true, data: employees });
    }

    if (operation === "update_employee") {
      const employeeId = clean(body.employee_id);
      const employee = await base44.asServiceRole.entities.Employee.get(employeeId);
      if (!employee || employee.tenant_id !== tenantId) return json({ success: false, error: "Employee not found" }, 404);
      const fields = ["full_name", "email", "phone", "date_of_birth", "gender", "nationality", "address", "city", "country", "location", "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship", "employment_type", "department", "job_title", "manager_id", "hire_date"];
      const patch: Record<string, string> = {};
      for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) patch[field] = clean(body[field], field === "email" ? 254 : 500);
      }
      if (!Object.keys(patch).length) return json({ success: false, error: "No valid fields supplied" }, 400);
      if (patch.email && !patch.email.includes("@")) return json({ success: false, error: "Valid email required" }, 400);
      if (patch.employment_type && !["permanent", "fixed_term", "part_time", "contractor", "intern", "casual"].includes(patch.employment_type)) {
        return json({ success: false, error: "Invalid employment type" }, 400);
      }
      const updated = await base44.asServiceRole.entities.Employee.update(employeeId, patch);
      await audit("employee.updated", "Employee", employeeId, { fields: Object.keys(patch) });
      return json({ success: true, data: updated });
    }

    if (operation === "list_onboarding") {
      const records = await base44.asServiceRole.entities.Onboarding.filter({ tenant_id: tenantId }, "-created_date", 250);
      const employees = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenantId }, "-created_date", 250);
      const byId = Object.fromEntries(employees.map((e: any) => [e.id, e]));
      return json({ success: true, data: records.map((r: any) => ({ ...r, employee: byId[r.employee_id] || null })) });
    }

    if (operation === "create_employee") {
      const email = clean(body.email, 254).toLowerCase();
      const fullName = clean(body.full_name, 160);
      if (!email.includes("@") || !fullName) return json({ success: false, error: "Valid name and email required" }, 400);
      const existing = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenantId, email }, "-created_date", 1);
      if (existing.length) return json({ success: true, data: existing[0], duplicate: true });
      const employee = await base44.asServiceRole.entities.Employee.create({
        tenant_id: tenantId, employee_number: `AFH-${Date.now().toString(36).toUpperCase()}`,
        full_name: fullName, email, phone: clean(body.phone, 50), department: clean(body.department),
        job_title: clean(body.job_title), manager_id: clean(body.manager_id),
        hire_date: clean(body.hire_date, 10) || new Date().toISOString().slice(0, 10),
        contract_file_uri: clean(body.contract_file_uri, 2000),
        lifecycle_stage: "preboarding", employment_status: "invited"
      });
      const onboarding = await base44.asServiceRole.entities.Onboarding.create({
        tenant_id: tenantId, employee_id: employee.id, candidate_id: "",
        status: "not_started", start_date: employee.hire_date,
        tasks: [
          { key: "documents", title: "Collect employment documents", owner: "hr", status: "pending" },
          { key: "equipment", title: "Prepare equipment and access", owner: "manager", status: "pending" },
          { key: "orientation", title: "Schedule orientation", owner: "hr", status: "pending" }
        ]
      });
      await audit("employee.created", "Employee", employee.id, { onboarding_id: onboarding.id });
      return json({ success: true, data: employee }, 201);
    }

    if (operation === "update_onboarding_task") {
      const id = clean(body.onboarding_id);
      const key = clean(body.task_key, 100);
      const record = await base44.asServiceRole.entities.Onboarding.get(id);
      if (!record || record.tenant_id !== tenantId) return json({ success: false, error: "Onboarding not found" }, 404);
      const tasks = Array.isArray(record.tasks) ? record.tasks.map((task: any) =>
        task.key === key ? { ...task, status: body.completed ? "completed" : "pending", completed_at: body.completed ? new Date().toISOString() : null } : task
      ) : [];
      if (!tasks.some((t: any) => t.key === key)) return json({ success: false, error: "Task not found" }, 404);
      const completed = tasks.length > 0 && tasks.every((t: any) => t.status === "completed");
      const started = tasks.some((t: any) => t.status === "completed");
      const status = completed ? "completed" : started ? "in_progress" : "not_started";
      const updated = await base44.asServiceRole.entities.Onboarding.update(id, { tasks, status });
      if (completed) {
        await base44.asServiceRole.entities.Employee.update(record.employee_id, { lifecycle_stage: "active", employment_status: "active" });
      }
      await audit("onboarding.task_updated", "Onboarding", id, { task_key: key, completed: !!body.completed, status });
      return json({ success: true, data: updated });
    }

    return json({ success: false, error: "Unsupported operation" }, 400);
  } catch (error) {
    console.error("employee-ops", requestId, error);
    return json({ success: false, error: "Internal server error", request_id: requestId }, 500);
  }
});

import { createClientFromRequest } from "npm:@base44/sdk";

const HR = new Set(["platform_admin", "tenant_admin", "hr_manager"]);
const CATEGORIES = new Set(["contract", "id", "qualification", "policy", "tax", "medical", "other"]);
const clean = (v: unknown, max = 1000) => typeof v === "string" ? v.trim().slice(0, max) : "";
const json = (body: unknown, status = 200) => Response.json(body, { status });

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const requestId = crypto.randomUUID();
  try {
    const user = await base44.auth.me();
    if (!user) return json({ success: false, error: "Unauthorized" }, 401);
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
    const mayAccess = (employeeId: string) => isHr || (!!self && self.id === employeeId);
    const audit = (action: string, id: string, metadata: Record<string, unknown> = {}) =>
      base44.asServiceRole.entities.AuditLog.create({
        tenant_id: tenantId, actor_user_id: user.id, actor_email: user.email,
        action, resource_type: "EmployeeDocument", resource_id: id, request_id: requestId,
        metadata, occurred_at: new Date().toISOString()
      });

    if (operation === "list") {
      let records = await base44.asServiceRole.entities.EmployeeDocument.filter({ tenant_id: tenantId }, "-created_date", 250);
      if (!isHr) records = self ? records.filter((r: any) => r.employee_id === self.id) : [];
      return json({ success: true, data: records.map((r: any) => ({ ...r, file_uri: undefined, employee: byId[r.employee_id] || null })) });
    }

    if (operation === "register") {
      const requested = clean(body.employee_id, 100);
      const employeeId = isHr ? requested : self?.id;
      if (!employeeId || !byId[employeeId]) return json({ success: false, error: "Employee not found" }, 404);
      const category = clean(body.category, 50);
      const fileUri = clean(body.file_uri, 2000);
      const fileName = clean(body.file_name, 255);
      const size = Number(body.size_bytes) || 0;
      if (!CATEGORIES.has(category) || !fileUri || !fileName) return json({ success: false, error: "File, name and valid category required" }, 400);
      if (size > 10 * 1024 * 1024) return json({ success: false, error: "File must be 10 MB or smaller" }, 400);
      const record = await base44.asServiceRole.entities.EmployeeDocument.create({
        tenant_id: tenantId, employee_id: employeeId, file_uri: fileUri, file_name: fileName,
        category, mime_type: clean(body.mime_type, 150), size_bytes: size,
        expiry_date: clean(body.expiry_date, 10) || undefined, uploaded_by: user.id, status: "active"
      });
      await audit("document.registered", record.id, { employee_id: employeeId, category, file_name: fileName });
      return json({ success: true, data: { ...record, file_uri: undefined } }, 201);
    }

    const id = clean(body.document_id, 100);
    const record = id ? await base44.asServiceRole.entities.EmployeeDocument.get(id) : null;
    if (!record || record.tenant_id !== tenantId) return json({ success: false, error: "Document not found" }, 404);
    if (!mayAccess(record.employee_id)) return json({ success: false, error: "Forbidden" }, 403);

    if (operation === "download") {
      if (record.status === "archived" && !isHr) return json({ success: false, error: "Document is archived" }, 403);
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: record.file_uri, expires_in: 300 });
      await audit("document.downloaded", id, { employee_id: record.employee_id });
      return json({ success: true, data: { signed_url: signed.signed_url, expires_in: 300 } });
    }

    if (operation === "archive") {
      if (!isHr) return json({ success: false, error: "Forbidden" }, 403);
      if (record.status === "archived") return json({ success: true, data: record });
      const updated = await base44.asServiceRole.entities.EmployeeDocument.update(id, { status: "archived" });
      await audit("document.archived", id, { employee_id: record.employee_id });
      return json({ success: true, data: updated });
    }

    return json({ success: false, error: "Unsupported operation" }, 400);
  } catch (error) {
    console.error("document-ops", requestId, error);
    return json({ success: false, error: "Internal server error", request_id: requestId }, 500);
  }
});

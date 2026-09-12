import { createClientFromRequest } from "npm:@base44/sdk";

const clean = (v: unknown, max = 500) => typeof v === "string" ? v.trim().slice(0, max) : "";
const json = (body: unknown, status = 200) => Response.json(body, { status });
const AFRIBYTE_TENANT_ID = "6aa2eda8b1df8b8d6312c262";
const AFRIBYTE_OWNER_EMAIL = "herman.abiyah@gmail.com";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const requestId = crypto.randomUUID();
  try {
    const user = await base44.auth.me();
    if (!user) return json({ success: false, error: "Unauthorized" }, 401);
    if (["suspended", "offboarded"].includes(user.employment_status)) return json({ success: false, error: "Account disabled" }, 403);
    const body = await req.json().catch(() => ({}));
    const companyName = clean(body.company_name, 160);

    if (user.tenant_id) {
      const existing = await base44.asServiceRole.entities.Tenant.get(user.tenant_id).catch(() => null);
      return json({ success: true, data: existing, idempotent: true });
    }

    // One-time, authenticated owner recovery for the pre-existing Afribyte workspace.
    // The exact verified Base44 account is allowlisted; anonymous callers cannot claim it.
    if (user.email?.toLowerCase() === AFRIBYTE_OWNER_EMAIL) {
      const tenant = await base44.asServiceRole.entities.Tenant.get(AFRIBYTE_TENANT_ID);
      await base44.asServiceRole.entities.User.update(user.id, {
        tenant_id: tenant.id, app_role: "tenant_admin", employment_status: "active"
      });
      const existingEmployees = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenant.id, email: user.email }, "-created_date", 1);
      if (!existingEmployees.length) {
        await base44.asServiceRole.entities.Employee.create({
          tenant_id: tenant.id, user_id: user.id, employee_number: "OWNER-002",
          full_name: user.full_name || user.email, email: user.email, department: "Management",
          job_title: "Workspace Owner", hire_date: new Date().toISOString().slice(0, 10),
          lifecycle_stage: "active", employment_status: "active"
        });
      }
      await base44.asServiceRole.entities.AuditLog.create({
        tenant_id: tenant.id, actor_user_id: user.id, actor_email: user.email,
        action: "tenant.owner_recovered", resource_type: "Tenant", resource_id: tenant.id,
        request_id: requestId, metadata: { app_role: "tenant_admin" }, occurred_at: new Date().toISOString()
      });
      return json({ success: true, data: tenant, recovered: true });
    }

    if (!companyName) return json({ success: false, error: "Company name required" }, 400);

    const slugBase = companyName.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "company";
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`;
    const tenant = await base44.asServiceRole.entities.Tenant.create({
      name: companyName, slug, status: "trial", country: clean(body.country, 100),
      company_email: clean(body.company_email, 254) || user.email,
      industry: clean(body.industry, 120), company_size: Math.max(1, Number(body.company_size) || 1),
      address: clean(body.address, 500), primary_color: clean(body.primary_color, 20) || "#2563eb",
      default_currency: clean(body.default_currency, 10) || "XAF",
      default_locale: clean(body.default_locale, 5) === "fr" ? "fr" : "en",
      timezone: clean(body.timezone, 100) || "Africa/Douala"
    });

    await base44.asServiceRole.entities.User.update(user.id, {
      tenant_id: tenant.id, app_role: "tenant_admin", employment_status: "active"
    });

    const existingEmployees = await base44.asServiceRole.entities.Employee.filter({ tenant_id: tenant.id, email: user.email }, "-created_date", 1);
    if (!existingEmployees.length) {
      await base44.asServiceRole.entities.Employee.create({
        tenant_id: tenant.id, user_id: user.id, employee_number: "OWNER-001",
        full_name: clean(body.full_name, 160) || user.full_name || user.email,
        email: user.email, department: clean(body.department, 120) || "Management",
        job_title: clean(body.job_title, 120) || "Workspace Owner",
        hire_date: new Date().toISOString().slice(0, 10),
        lifecycle_stage: "active", employment_status: "active"
      });
    }

    await base44.asServiceRole.entities.AuditLog.create({
      tenant_id: tenant.id, actor_user_id: user.id, actor_email: user.email,
      action: "tenant.provisioned", resource_type: "Tenant", resource_id: tenant.id,
      request_id: requestId, metadata: { slug }, occurred_at: new Date().toISOString()
    });
    return json({ success: true, data: tenant }, 201);
  } catch (error) {
    console.error("tenant-provision", requestId, error);
    return json({ success: false, error: "Workspace provisioning failed", request_id: requestId }, 500);
  }
});

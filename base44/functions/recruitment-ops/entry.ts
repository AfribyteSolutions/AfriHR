// base44/functions/recruitment-ops/entry.ts
// Backend function for privileged HR operations: hiring, onboarding, offboarding.
// All operations enforce tenant isolation and are idempotent.

import { createClientFromRequest } from "npm:@base44/sdk";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // SECURITY: Resolve tenant_id ONLY from the authenticated user.
    // Never trust tenant_id from the request body — this prevents cross-tenant access.
    const tid = user.tenant_id;

    if (!tid) {
      return Response.json({ error: "No tenant context" }, { status: 403 });
    }

    switch (action) {
      case "hire":
        return await handleHire(base44, user, tid, body);
      case "start_offboarding":
        return await handleStartOffboarding(base44, user, tid, body);
      case "complete_offboarding":
        return await handleCompleteOffboarding(base44, user, tid, body);
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return Response.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

// ── HIRE (idempotent) ──
async function handleHire(base44: any, user: any, tid: string, body: any): Promise<Response> {
  const { candidate_id, job_opening_id, full_name, email, phone, department, job_title } = body;

  if (!candidate_id || !full_name || !email) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Idempotency: check if employee already exists for this candidate
  const existing = await base44.asServiceRole.entities.Employee.filter({
    tenant_id: tid,
    candidate_id,
  });

  if (existing && existing.length > 0) {
    // Already hired — return existing result safely
    return Response.json({
      success: true,
      message: "Candidate already hired",
      employee_id: existing[0].id,
      idempotent: true,
    });
  }

  // Create employee record
  const employee = await base44.asServiceRole.entities.Employee.create({
    tenant_id: tid,
    candidate_id,
    full_name,
    email,
    phone: phone || "",
    department: department || "General",
    job_title: job_title || "Employee",
    start_date: new Date().toISOString(),
    status: "preboarding",
  });

  // Mark candidate as hired
  await base44.asServiceRole.entities.Candidate.update(candidate_id, {
    stage: "hired",
    hired_employee_id: employee.id,
  });

  // Create onboarding record
  const onboarding = await base44.asServiceRole.entities.Onboarding.create({
    tenant_id: tid,
    employee_id: employee.id,
    candidate_id,
    status: "pending",
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 0,
  });

  // Create default onboarding tasks
  const defaultTasks = [
    { title: "Sign employment contract", assigned_to: user.id, assigned_to_name: user.full_name || "HR", order: 0 },
    { title: "Set up email and system accounts", assigned_to: user.id, assigned_to_name: user.full_name || "IT", order: 1 },
    { title: "Company orientation", assigned_to: user.id, assigned_to_name: user.full_name || "HR", order: 2 },
    { title: "Equipment setup", assigned_to: user.id, assigned_to_name: user.full_name || "IT", order: 3 },
  ];

  await base44.asServiceRole.entities.OnboardingTask.bulkCreate(
    defaultTasks.map((t) => ({
      tenant_id: tid,
      onboarding_id: onboarding.id,
      title: t.title,
      assigned_to: t.assigned_to,
      assigned_to_name: t.assigned_to_name,
      status: "pending",
      order: t.order,
    }))
  );

  // Audit log
  await base44.asServiceRole.entities.AuditLog.create({
    tenant_id: tid,
    user_id: user.id,
    user_name: user.full_name || "",
    action: "candidate_hired",
    entity_type: "Candidate",
    entity_id: candidate_id,
    details: `Hired ${full_name} as ${job_title || "Employee"} in ${department || "General"}`,
  });

  return Response.json({
    success: true,
    employee_id: employee.id,
    onboarding_id: onboarding.id,
  });
}

// ── START OFFBOARDING ──
async function handleStartOffboarding(base44: any, user: any, tid: string, body: any): Promise<Response> {
  const { employee_id, employee_name, reason, last_working_day } = body;

  if (!employee_id || !reason || !last_working_day) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check for existing active offboarding (idempotency)
  const existing = await base44.asServiceRole.entities.Offboarding.filter({
    tenant_id: tid,
    employee_id,
    status: "planned",
  });

  if (existing && existing.length > 0) {
    return Response.json({
      success: true,
      message: "Offboarding already started",
      offboarding_id: existing[0].id,
      idempotent: true,
    });
  }

  // Create offboarding record
  const offboarding = await base44.asServiceRole.entities.Offboarding.create({
    tenant_id: tid,
    employee_id,
    employee_name,
    status: "planned",
    reason,
    last_working_day,
    initiated_by: user.id,
    initiated_by_name: user.full_name || "",
    exit_interview_status: "pending",
  });

  // Create default offboarding tasks
  const defaultTasks = [
    { title: "Return company laptop/equipment", category: "asset_return", order: 0 },
    { title: "Return ID badge/access cards", category: "asset_return", order: 1 },
    { title: "Revoke system access (email, apps)", category: "access_removal", order: 2 },
    { title: "Knowledge transfer/handover", category: "handover", order: 3 },
    { title: "Exit interview", category: "other", order: 4 },
  ];

  await base44.asServiceRole.entities.OffboardingTask.bulkCreate(
    defaultTasks.map((t) => ({
      tenant_id: tid,
      offboarding_id: offboarding.id,
      title: t.title,
      category: t.category,
      assigned_to: user.id,
      assigned_to_name: user.full_name || "HR",
      status: "pending",
      order: t.order,
    }))
  );

  // Update employee status
  await base44.asServiceRole.entities.Employee.update(employee_id, {
    status: "offboarding",
  });

  // Audit log
  await base44.asServiceRole.entities.AuditLog.create({
    tenant_id: tid,
    user_id: user.id,
    user_name: user.full_name || "",
    action: "offboarding_started",
    entity_type: "Offboarding",
    entity_id: offboarding.id,
    details: `Started offboarding for ${employee_name}`,
  });

  return Response.json({
    success: true,
    offboarding_id: offboarding.id,
  });
}

// ── COMPLETE OFFBOARDING (idempotent) ──
async function handleCompleteOffboarding(base44: any, user: any, tid: string, body: any): Promise<Response> {
  const { offboarding_id, employee_id } = body;

  if (!offboarding_id || !employee_id) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if already completed (idempotency)
  const offboarding = await base44.asServiceRole.entities.Offboarding.get(offboarding_id);

  if (!offboarding) {
    return Response.json({ error: "Offboarding record not found" }, { status: 404 });
  }

  if (offboarding.status === "completed") {
    return Response.json({
      success: true,
      message: "Offboarding already completed",
      idempotent: true,
    });
  }

  // Complete offboarding
  await base44.asServiceRole.entities.Offboarding.update(offboarding_id, {
    status: "completed",
    completed_date: new Date().toISOString(),
  });

  // Terminate employee (never hard-delete)
  await base44.asServiceRole.entities.Employee.update(employee_id, {
    status: "terminated",
  });

  // Audit log
  await base44.asServiceRole.entities.AuditLog.create({
    tenant_id: tid,
    user_id: user.id,
    user_name: user.full_name || "",
    action: "offboarding_completed",
    entity_type: "Offboarding",
    entity_id: offboarding_id,
    details: `Offboarding completed, employee terminated`,
  });

  return Response.json({
    success: true,
  });
}

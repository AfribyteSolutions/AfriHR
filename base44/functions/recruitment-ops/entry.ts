import { createClientFromRequest } from "npm:@base44/sdk";

const HR_ROLES = new Set(["platform_admin", "tenant_admin", "hr_manager", "recruiter"]);
const STAGES = ["applied", "screening", "interview", "assessment", "offer", "hired", "rejected", "withdrawn"];
const TRANSITIONS: Record<string, string[]> = {
  applied: ["screening", "rejected", "withdrawn"],
  screening: ["interview", "rejected", "withdrawn"],
  interview: ["assessment", "offer", "rejected", "withdrawn"],
  assessment: ["interview", "offer", "rejected", "withdrawn"],
  offer: ["hired", "rejected", "withdrawn"],
  hired: [],
  rejected: [],
  withdrawn: []
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const requestId = crypto.randomUUID();

  try {
    const user = await base44.auth.me();
    if (!user) return json({ success: false, error: "Unauthorized", request_id: requestId }, 401);

    const tenantId = cleanString(user.tenant_id, 100);
    const appRole = cleanString(user.app_role, 50);
    const isPlatformAdmin = user.role === "admin" || appRole === "platform_admin";
    if (!isPlatformAdmin && (!tenantId || !HR_ROLES.has(appRole))) {
      return json({ success: false, error: "Insufficient permissions", request_id: requestId }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const operation = cleanString(body.operation, 50);
    const requestedTenantId = cleanString(body.tenant_id, 100);
    const effectiveTenantId = isPlatformAdmin ? (requestedTenantId || tenantId) : tenantId;
    if (!effectiveTenantId) {
      return json({ success: false, error: "A tenant is required", request_id: requestId }, 400);
    }
    if (!isPlatformAdmin && requestedTenantId && requestedTenantId !== tenantId) {
      return json({ success: false, error: "Cross-tenant access denied", request_id: requestId }, 403);
    }

    if (operation === "list_candidates") {
      const records = await base44.asServiceRole.entities.Candidate.filter(
        { tenant_id: effectiveTenantId },
        "-created_date",
        Math.min(Number(body.limit) || 100, 250),
        Math.max(Number(body.skip) || 0, 0)
      );
      return json({ success: true, data: records, request_id: requestId });
    }

    if (operation === "create_candidate") {
      const fullName = cleanString(body.full_name, 160);
      const email = cleanString(body.email, 254).toLowerCase();
      if (!fullName || !email || !email.includes("@")) {
        return json({ success: false, error: "A valid name and email are required", request_id: requestId }, 400);
      }

      const existing = await base44.asServiceRole.entities.Candidate.filter({
        tenant_id: effectiveTenantId,
        email,
        job_opening_id: cleanString(body.job_opening_id, 100)
      }, "-created_date", 1);

      if (existing.length) {
        return json({ success: true, data: existing[0], duplicate: true, request_id: requestId });
      }

      const candidate = await base44.asServiceRole.entities.Candidate.create({
        tenant_id: effectiveTenantId,
        job_opening_id: cleanString(body.job_opening_id, 100),
        full_name: fullName,
        email,
        phone: cleanString(body.phone, 50),
        source: cleanString(body.source, 100),
        stage: "applied",
        resume_url: cleanString(body.resume_url, 2000),
        notes: cleanString(body.notes, 4000),
        assigned_to: cleanString(body.assigned_to, 100)
      });

      await base44.asServiceRole.entities.AuditLog.create({
        tenant_id: effectiveTenantId,
        actor_user_id: user.id,
        actor_email: user.email,
        action: "candidate.created",
        resource_type: "Candidate",
        resource_id: candidate.id,
        request_id: requestId,
        metadata: { source: candidate.source || null },
        occurred_at: new Date().toISOString()
      });

      return json({ success: true, data: candidate, request_id: requestId }, 201);
    }

    if (operation === "change_stage") {
      const candidateId = cleanString(body.candidate_id, 100);
      const nextStage = cleanString(body.stage, 30);
      if (!candidateId || !STAGES.includes(nextStage)) {
        return json({ success: false, error: "Valid candidate_id and stage are required", request_id: requestId }, 400);
      }

      const candidate = await base44.asServiceRole.entities.Candidate.get(candidateId);
      if (!candidate || candidate.tenant_id !== effectiveTenantId) {
        return json({ success: false, error: "Candidate not found", request_id: requestId }, 404);
      }

      const allowed = TRANSITIONS[candidate.stage] || [];
      if (!allowed.includes(nextStage)) {
        return json({
          success: false,
          error: `Invalid stage transition: ${candidate.stage} -> ${nextStage}`,
          request_id: requestId
        }, 409);
      }

      const updated = await base44.asServiceRole.entities.Candidate.update(candidateId, { stage: nextStage });
      await base44.asServiceRole.entities.AuditLog.create({
        tenant_id: effectiveTenantId,
        actor_user_id: user.id,
        actor_email: user.email,
        action: "candidate.stage_changed",
        resource_type: "Candidate",
        resource_id: candidateId,
        request_id: requestId,
        metadata: { from: candidate.stage, to: nextStage },
        occurred_at: new Date().toISOString()
      });

      return json({ success: true, data: updated, request_id: requestId });
    }

    return json({ success: false, error: "Unsupported operation", request_id: requestId }, 400);
  } catch (error) {
    console.error("recruitment-ops", requestId, error);
    return json({ success: false, error: "Internal server error", request_id: requestId }, 500);
  }
});

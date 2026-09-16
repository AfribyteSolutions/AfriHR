import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

const dataOf = (x:any) => x?.data || x;

export default async function(req: Request) {
  const base44 = createClientFromRequest(req);
  const user:any = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const tenantId = body.tenant_id || user.tenant_id || user.data?.tenant_id;
  if (!tenantId) return Response.json({ error: 'No tenant context' }, { status: 400 });
  if (user.role !== 'admin' && user.tenant_id !== tenantId && user.data?.tenant_id !== tenantId) {
    return Response.json({ error: 'Tenant access denied' }, { status: 403 });
  }
  const S:any = base44.asServiceRole.entities;
  const tenant = dataOf(await S.Tenant.get(tenantId));
  const appRole = user.app_role || user.data?.app_role;
  if (body.operation && user.role !== 'admin' && !['platform_admin','tenant_admin'].includes(appRole || '')) {
    return Response.json({ error: 'Tenant administrator access required' }, { status: 403 });
  }
  if (body.operation === 'save_configuration') {
    const jurisdiction = String(body.jurisdiction_code || '').trim().toUpperCase();
    const status = String(body.compliance_status || 'in_review');
    if (!jurisdiction || jurisdiction.length > 12) return Response.json({ error: 'Valid jurisdiction_code required' }, { status: 400 });
    if (!['not_configured','in_review','configured','attention_required'].includes(status)) return Response.json({ error: 'verified status requires platform/legal verification' }, { status: 400 });
    await S.Tenant.update(tenantId, { jurisdiction_code: jurisdiction, compliance_status: status });
    return Response.json({ ok: true });
  }
  if (body.operation === 'save_ai_policy') {
    const rows = await S.AiUsagePolicy.filter({ tenant_id: tenantId }).catch(() => []);
    const existing = dataOf((rows.data || rows)[0] || null);
    const payload = {
      tenant_id: tenantId,
      enabled: body.enabled !== false,
      allow_aggregate_workforce_analytics: body.allow_aggregate_workforce_analytics !== false,
      allow_employee_personal_data: body.allow_employee_personal_data === true,
      allow_sensitive_hr_data: body.allow_sensitive_hr_data === true,
      allow_payroll_line_items: body.allow_payroll_line_items === true,
      allow_candidate_personal_data: body.allow_candidate_personal_data === true,
      require_human_review: body.require_human_review !== false,
      last_reviewed_at: new Date().toISOString(), last_reviewed_by: user.id,
    };
    if (payload.allow_sensitive_hr_data && !payload.allow_employee_personal_data) return Response.json({ error: 'Sensitive HR data requires employee personal data permission' }, { status: 400 });
    if (existing?.id) await S.AiUsagePolicy.update(existing.id, payload); else await S.AiUsagePolicy.create(payload);
    return Response.json({ ok: true });
  }
  if (body.operation === 'generate_external_org_key') {
    if (tenant.external_org_key) return Response.json({ external_org_key: tenant.external_org_key, idempotent: true });
    const externalOrgKey = `afribyte:${tenantId}:${crypto.randomUUID()}`;
    await S.Tenant.update(tenantId, { external_org_key: externalOrgKey });
    return Response.json({ external_org_key: externalOrgKey, generated: true });
  }
  const [rules, runs] = await Promise.all([
    S.StatutoryRuleSet.filter({ tenant_id: tenantId }).catch(() => []),
    S.PayrollRun.filter({ tenant_id: tenantId }, '-created_date', 50).catch(() => []),
  ]);
  const ruleList = (rules.data || rules).map(dataOf);
  const verifiedActive = ruleList.filter((r:any) => r.status === 'active' && r.verification_status === 'verified');
  const exportedPending = (runs.data || runs).map(dataOf).filter((r:any) => r.status === 'exported' && ['pending','failed'].includes(r.africount_sync_status || 'pending'));
  const checks = [
    { key: 'jurisdiction', label: 'Primary jurisdiction', ok: !!tenant.jurisdiction_code, detail: tenant.jurisdiction_code || tenant.country || 'Primary jurisdiction not configured', remediation: { type: 'navigate', target: '/company-settings', label: 'Configure jurisdiction' } },
    { key: 'external_org_key', label: 'Afribyte organization key', ok: !!tenant.external_org_key, detail: tenant.external_org_key || 'Cross-product organization key missing', remediation: { type: 'invoke', operation: 'generate_external_org_key', label: 'Generate org key' } },
    { key: 'verified_statutory_rules', label: 'Verified statutory rules', ok: verifiedActive.length > 0, detail: `${verifiedActive.length} verified active statutory rule set(s)`, remediation: { type: 'human_review', target: '/payroll/statutory', label: 'Review statutory rules' } },
    { key: 'tenant_compliance_status', label: 'Tenant compliance status', ok: ['configured','verified'].includes(tenant.compliance_status || ''), detail: tenant.compliance_status || 'not_configured', remediation: { type: 'human_review', target: '/company-settings', label: 'Review company compliance' } },
    { key: 'africount_reconciliation', label: 'Africount payroll reconciliation', ok: exportedPending.length === 0, detail: exportedPending.length ? `${exportedPending.length} exported payroll run(s) pending/failed reconciliation` : 'No unresolved exported payroll runs', remediation: { type: 'human_review', target: '/payroll/payroll', label: 'Review payroll exports' } },
  ];
  const blockers = checks.filter(c => !c.ok);
  return Response.json({ tenant_id: tenantId, product: 'afrihr', readiness: blockers.length ? 'attention_required' : 'configured', legally_verified: false, checks, blockers: blockers.map(b => b.key), note: 'Technical readiness only; not legal certification.' });
}

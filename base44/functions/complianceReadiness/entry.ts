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

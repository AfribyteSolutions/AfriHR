import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const dataOf = (x:any) => x?.data || x;
const now = () => new Date().toISOString();
function secret(name:string) { try { return (globalThis as any).Deno?.env?.get(name) || ''; } catch { return ''; } }

export default async function(req: Request) {
  const base44 = createClientFromRequest(req);
  const S:any = base44.asServiceRole.entities;
  const endpoint = secret('AFRIBYTE_GOVERNANCE_URL');
  const token = secret('AFRIBYTE_GOVERNANCE_PUBLISHER_TOKEN');
  const rows:any[] = [];
  for (const status of ['pending','retry','configuration_missing']) {
    const found = await S.GovernanceSnapshotOutbox.filter({ status }, 'created_date', 20).catch(() => []);
    rows.push(...(found.data || found).map(dataOf));
  }
  const unique = Array.from(new Map(rows.map((r:any)=>[r.id,r])).values()).slice(0,20) as any[];
  if (!endpoint || !token || !/^https:\/\//i.test(endpoint)) {
    for (const item of unique) await S.GovernanceSnapshotOutbox.update(item.id, { status: 'configuration_missing', last_error: 'Governance publisher secrets are not configured' }).catch(()=>null);
    return Response.json({ ok:false, configuration_missing:true, queued:unique.length });
  }
  let sent=0, failed=0, skipped=0;
  for (const item of unique) {
    if (item.next_retry_at && new Date(item.next_retry_at).getTime() > Date.now()) { skipped++; continue; }
    const attempts = Number(item.attempts || 0) + 1;
    try {
      const response = await fetch(endpoint, { method:'POST', headers:{ 'content-type':'application/json', 'x-afribyte-governance-token':token }, body:JSON.stringify(item.payload || {}) });
      const body = await response.json().catch(()=>({}));
      if (!response.ok || !body?.accepted) throw new Error(`Governance ingest ${response.status}: ${body?.error || 'not accepted'}`);
      await S.GovernanceSnapshotOutbox.update(item.id, { status:'sent', attempts, last_error:'', sent_at:now(), snapshot_id:body.snapshot_id || '' }); sent++;
    } catch (error:any) {
      const dead = attempts >= 6; const delayMinutes = Math.min(1440, Math.pow(2, Math.min(attempts,10))*5);
      await S.GovernanceSnapshotOutbox.update(item.id, { status:dead?'dead_letter':'retry', attempts, last_error:String(error?.message || error).slice(0,1000), next_retry_at:dead?null:new Date(Date.now()+delayMinutes*60000).toISOString() }).catch(()=>null); failed++;
    }
  }
  return Response.json({ ok:failed===0, processed:unique.length, sent, failed, skipped });
}

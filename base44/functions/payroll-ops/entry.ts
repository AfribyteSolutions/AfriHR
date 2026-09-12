import { createClientFromRequest } from "npm:@base44/sdk";

const PAYROLL_VIEW=new Set(["platform_admin","tenant_admin","payroll_manager","finance_manager"]);
const PAYROLL_MANAGE=new Set(["platform_admin","tenant_admin","payroll_manager"]);
const CURRENCIES=new Set(["XAF","XOF","NGN","GHS","KES","ZAR","UGX","RWF","TZS","ETB","MAD","EGP","DZD","AOA","BWP","MZN","NAD","ZMW","USD","EUR","GBP"]);
const clean=(v:unknown,max=2000)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(body:unknown,status=200)=>Response.json(body,{status});
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v);
const money=(v:unknown)=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:null};
const lines=(v:unknown,taxable=false)=>Array.isArray(v)?v.slice(0,30).map((x:any)=>({code:clean(x?.code,40),name:clean(x?.name,100),amount_minor:money(x?.amount_minor),...(taxable?{taxable:!!x?.taxable}:{})})).filter((x:any)=>x.code&&x.name&&x.amount_minor!==null):[];
const previousDay=(date:string)=>new Date(new Date(date+"T00:00:00Z").getTime()-86400000).toISOString().slice(0,10);
const statutoryRules=(value:unknown)=>Array.isArray(value)?value.slice(0,50).map((r:any)=>({
 code:clean(r?.code,40),name:clean(r?.name,100),calculation:clean(r?.calculation,20),
 base:["gross","taxable_gross"].includes(r?.base)?r.base:"gross",
 rate_basis_points:money(r?.rate_basis_points)||0,fixed_minor:money(r?.fixed_minor)||0,
 threshold_minor:money(r?.threshold_minor)||0,cap_minor:money(r?.cap_minor),
 brackets:Array.isArray(r?.brackets)?r.brackets.slice(0,30).filter((b:any)=>b?.up_to_minor===null||money(b?.up_to_minor)!==null).map((b:any)=>({up_to_minor:b.up_to_minor===null?null:money(b.up_to_minor),rate_basis_points:money(b.rate_basis_points)||0})).filter((b:any)=>b.rate_basis_points>0&&b.rate_basis_points<=10000).sort((a:any,bb:any)=>(a.up_to_minor??Number.MAX_SAFE_INTEGER)-(bb.up_to_minor??Number.MAX_SAFE_INTEGER)):[]
})).filter((r:any)=>r.code&&r.name&&((r.calculation==="percentage"&&r.rate_basis_points>0&&r.rate_basis_points<=10000)||(r.calculation==="fixed"&&r.fixed_minor>0)||(r.calculation==="progressive"&&r.brackets.length>0))):[];
const calculateRule=(rule:any,gross:number)=>{
 const taxable=Math.max(0,gross-(rule.threshold_minor||0));let amount=0;
 if(rule.calculation==="fixed")amount=rule.fixed_minor||0;
 if(rule.calculation==="percentage")amount=Math.round(taxable*(rule.rate_basis_points||0)/10000);
 if(rule.calculation==="progressive"){let lower=0;for(const b of rule.brackets){const upper=b.up_to_minor===null?taxable:Math.min(taxable,b.up_to_minor);if(upper>lower)amount+=Math.round((upper-lower)*b.rate_basis_points/10000);lower=upper;if(lower>=taxable)break}}
 if(rule.cap_minor!==null&&rule.cap_minor!==undefined)amount=Math.min(amount,rule.cap_minor);
 return Math.max(0,amount);
};

Deno.serve(async(req)=>{
 const base44=createClientFromRequest(req),requestId=crypto.randomUUID();
 try{
  const user=await base44.auth.me();
  if(!user)return json({success:false,error:"Unauthorized"},401);
  if(["suspended","offboarded"].includes(user.employment_status))return json({success:false,error:"Account disabled"},403);
  const body=await req.json().catch(()=>({})),platformAdmin=user.role==="admin"||user.app_role==="platform_admin";
  const tenantId=platformAdmin?clean(body.tenant_id,100)||clean(user.tenant_id,100):clean(user.tenant_id,100);
  if(!tenantId)return json({success:false,error:"Tenant required"},400);
  if(!platformAdmin&&body.tenant_id&&body.tenant_id!==tenantId)return json({success:false,error:"Cross-tenant access denied"},403);
  const role=clean(user.app_role,50)||"employee",permissions=new Set(Array.isArray(user.permissions)?user.permissions:[]);
  const canViewPayroll=platformAdmin||PAYROLL_VIEW.has(role)||permissions.has("payroll.view")||permissions.has("payroll.manage");
  const canManagePayroll=platformAdmin||PAYROLL_MANAGE.has(role)||permissions.has("payroll.manage");
  const isHr=canViewPayroll,operation=clean(body.operation,50);
  const employees=await base44.asServiceRole.entities.Employee.filter({tenant_id:tenantId},"-created_date",500);
  const self=employees.find((e:any)=>e.user_id===user.id)||employees.find((e:any)=>String(e.email).toLowerCase()===String(user.email).toLowerCase());
  const employeeById=Object.fromEntries(employees.map((e:any)=>[e.id,e]));
  const requireHr=()=>canManagePayroll?null:json({success:false,error:"Payroll management permission required"},403);
  const audit=(action:string,type:string,id:string,metadata:Record<string,unknown>={})=>base44.asServiceRole.entities.AuditLog.create({tenant_id:tenantId,actor_user_id:user.id,actor_email:user.email,action,resource_type:type,resource_id:id,request_id:requestId,metadata,occurred_at:new Date().toISOString()});

  if(operation==="list_statutory_rules"){
   if(!canViewPayroll)return json({success:false,error:"Payroll view permission required"},403);
   const records=await base44.asServiceRole.entities.StatutoryRuleSet.filter({tenant_id:tenantId},"-effective_from",200);
   return json({success:true,data:records});
  }
  if(operation==="save_statutory_rule"){
   const denied=requireHr();if(denied)return denied;
   const country=clean(body.country_code,2).toUpperCase(),currency=clean(body.currency,3).toUpperCase(),name=clean(body.name,100),version=clean(body.version,40),effectiveFrom=clean(body.effective_from,10),sourceUrl=clean(body.source_url,500),verifiedOn=clean(body.verified_on,10);
   const employeeRules=statutoryRules(body.employee_rules),employerRules=statutoryRules(body.employer_rules);
   if(!/^[A-Z]{2}$/.test(country)||!CURRENCIES.has(currency)||!name||!version||!dateOk(effectiveFrom)||!dateOk(verifiedOn)||!/^https:\/\//i.test(sourceUrl)||(employeeRules.length+employerRules.length===0))return json({success:false,error:"Country, currency, version, effective date, HTTPS source, verification date and at least one valid rule are required"},400);
   const duplicate=await base44.asServiceRole.entities.StatutoryRuleSet.filter({tenant_id:tenantId,country_code:country,currency,version},"-created_date",1);
   if(duplicate.length)return json({success:false,error:"This statutory rule version already exists"},409);
   const record=await base44.asServiceRole.entities.StatutoryRuleSet.create({tenant_id:tenantId,country_code:country,currency,name,version,effective_from:effectiveFrom,status:"draft",employee_rules:employeeRules,employer_rules:employerRules,source_url:sourceUrl,source_note:clean(body.source_note),verified_on:verifiedOn,created_by:user.id});
   await audit("statutory_rule.created","StatutoryRuleSet",record.id,{country,currency,version});return json({success:true,data:record},201);
  }
  if(operation==="activate_statutory_rule"){
   const denied=requireHr();if(denied)return denied;
   const id=clean(body.rule_set_id,100),record=await base44.asServiceRole.entities.StatutoryRuleSet.get(id).catch(()=>null);
   if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Statutory rule set not found"},404);
   if(record.status!=="draft")return json({success:false,error:"Only draft rule sets can be activated"},409);
   if(clean(body.confirmation,160)!==`${record.country_code}:${record.version}`)return json({success:false,error:"Confirmation does not match country and version"},400);
   const active=await base44.asServiceRole.entities.StatutoryRuleSet.filter({tenant_id:tenantId,country_code:record.country_code,currency:record.currency,status:"active"},"-effective_from",100);
   if(active.some((x:any)=>x.effective_from>=record.effective_from))return json({success:false,error:"New rule versions must start after the currently active version"},409);
   for(const oldRule of active)await base44.asServiceRole.entities.StatutoryRuleSet.update(oldRule.id,{status:"superseded",effective_to:previousDay(record.effective_from)});
   const updated=await base44.asServiceRole.entities.StatutoryRuleSet.update(id,{status:"active",activated_by:user.id,activated_at:new Date().toISOString()});
   await audit("statutory_rule.activated","StatutoryRuleSet",id,{country:record.country_code,currency:record.currency,version:record.version});return json({success:true,data:updated});
  }
  if(operation==="list_compensation"){
   let records=await base44.asServiceRole.entities.CompensationRecord.filter({tenant_id:tenantId},"-effective_from",500);
   if(!isHr)records=self?records.filter((x:any)=>x.employee_id===self.id):[];
   return json({success:true,data:records.map((x:any)=>({...x,employee:employeeById[x.employee_id]||null})),can_manage:isHr});
  }
  if(operation==="set_compensation"){
   const denied=requireHr();if(denied)return denied;
   const employeeId=clean(body.employee_id,100),currency=clean(body.currency,3).toUpperCase(),effectiveFrom=clean(body.effective_from,10),base=money(body.base_salary_minor);
   const frequency=clean(body.pay_frequency,20),allowances=lines(body.allowances,true),deductions=lines(body.deductions);
   if(!employeeById[employeeId])return json({success:false,error:"Employee not found"},404);
   if(!CURRENCIES.has(currency)||base===null||!dateOk(effectiveFrom)||!["monthly","biweekly","weekly","daily","hourly"].includes(frequency))return json({success:false,error:"Valid employee, currency, integer amount, frequency and effective date required"},400);
   const active=await base44.asServiceRole.entities.CompensationRecord.filter({tenant_id:tenantId,employee_id:employeeId,status:"active"},"-effective_from",100);
   for(const old of active)await base44.asServiceRole.entities.CompensationRecord.update(old.id,{status:"superseded",effective_to:previousDay(effectiveFrom)});
   const record=await base44.asServiceRole.entities.CompensationRecord.create({tenant_id:tenantId,employee_id:employeeId,currency,base_salary_minor:base,pay_frequency:frequency,allowances,deductions,effective_from:effectiveFrom,status:"active",created_by:user.id});
   await audit("compensation.created","CompensationRecord",record.id,{employee_id:employeeId,currency,effective_from:effectiveFrom});
   return json({success:true,data:record},201);
  }
  if(operation==="list_runs"){
   if(!isHr)return json({success:true,data:[]});
   const runs=await base44.asServiceRole.entities.PayrollRun.filter({tenant_id:tenantId},"-period_end",200);
   return json({success:true,data:runs});
  }
  if(operation==="list_my_payslips"){
   if(!self)return json({success:false,error:"No employee profile linked to this account"},409);
   const items=await base44.asServiceRole.entities.PayrollItem.filter({tenant_id:tenantId,employee_id:self.id},"-created_date",200);
   return json({success:true,data:items.filter((x:any)=>x.status==="finalized")});
  }
  if(operation==="create_run"){
   const denied=requireHr();if(denied)return denied;
   const start=clean(body.period_start,10),end=clean(body.period_end,10),payDate=clean(body.pay_date,10),currency=clean(body.currency,3).toUpperCase(),country=clean(body.country_code,2).toUpperCase(),key=clean(body.idempotency_key,120);
   if(!dateOk(start)||!dateOk(end)||!dateOk(payDate)||start>end||!CURRENCIES.has(currency)||!/^[A-Z]{2}$/.test(country)||!key)return json({success:false,error:"Valid period, pay date, country, currency and idempotency key required"},400);
   const duplicate=await base44.asServiceRole.entities.PayrollRun.filter({tenant_id:tenantId,idempotency_key:key},"-created_date",1);
   if(duplicate.length)return json({success:true,data:duplicate[0],idempotent:true});
   const all=await base44.asServiceRole.entities.PayrollRun.filter({tenant_id:tenantId,currency},"-period_end",200);
   if(all.some((r:any)=>r.status!=="voided"&&start<=r.period_end&&end>=r.period_start))return json({success:false,error:"This payroll period overlaps an existing run"},409);
   const run=await base44.asServiceRole.entities.PayrollRun.create({tenant_id:tenantId,period_start:start,period_end:end,pay_date:payDate,currency,country_code:country,status:"draft",gross_minor:0,deductions_minor:0,statutory_deductions_minor:0,employer_contributions_minor:0,net_minor:0,employee_count:0,idempotency_key:key});
   await audit("payroll.run_created","PayrollRun",run.id,{start,end,currency,country});
   return json({success:true,data:run},201);
  }

  const runId=clean(body.run_id,100);
  const run=runId?await base44.asServiceRole.entities.PayrollRun.get(runId).catch(()=>null):null;
  if(["calculate_run","approve_run","finalize_run","export_run","list_items"].includes(operation)&&(!run||run.tenant_id!==tenantId))return json({success:false,error:"Payroll run not found"},404);

  if(operation==="calculate_run"){
   const denied=requireHr();if(denied)return denied;
   if(!["draft","calculated"].includes(run.status))return json({success:false,error:"Only draft or calculated runs can be calculated"},409);
   const compensation=await base44.asServiceRole.entities.CompensationRecord.filter({tenant_id:tenantId,currency:run.currency},"-effective_from",500);
   const ruleSets=await base44.asServiceRole.entities.StatutoryRuleSet.filter({tenant_id:tenantId,country_code:run.country_code,currency:run.currency,status:"active"},"-effective_from",100);
   const ruleSet=ruleSets.find((x:any)=>x.effective_from<=run.period_end&&(!x.effective_to||x.effective_to>=run.period_start));
   if(!ruleSet)return json({success:false,error:"No active statutory rule set covers this payroll period"},409);
   const employeeStatutory=statutoryRules(ruleSet.employee_rules),employerStatutory=statutoryRules(ruleSet.employer_rules);
   const eligible=employees.filter((e:any)=>!["offboarded","terminated","inactive"].includes(String(e.status||e.employment_status||"").toLowerCase()));
   for(const employee of eligible){
    const comp=compensation.find((c:any)=>c.employee_id===employee.id&&c.effective_from<=run.period_end&&(!c.effective_to||c.effective_to>=run.period_start));
    if(!comp)continue;
    const calculationKey=`${run.id}:${employee.id}`;
    const existing=await base44.asServiceRole.entities.PayrollItem.filter({tenant_id:tenantId,calculation_key:calculationKey},"-created_date",1);
    if(existing.length)continue;
    const allowances=lines(comp.allowances,true),deductions=lines(comp.deductions),base=money(comp.base_salary_minor)||0;
    const allowanceTotal=allowances.reduce((s:number,x:any)=>s+x.amount_minor,0),deductionTotal=deductions.reduce((s:number,x:any)=>s+x.amount_minor,0),gross=base+allowanceTotal;
    const statutory_deductions=employeeStatutory.map((r:any)=>({code:r.code,name:r.name,amount_minor:calculateRule(r,gross)})),employer_contributions=employerStatutory.map((r:any)=>({code:r.code,name:r.name,amount_minor:calculateRule(r,gross)}));
    const statutoryTotal=statutory_deductions.reduce((s:number,x:any)=>s+x.amount_minor,0),employerTotal=employer_contributions.reduce((s:number,x:any)=>s+x.amount_minor,0);
    if(deductionTotal+statutoryTotal>gross)return json({success:false,error:`Deductions exceed gross pay for ${employee.full_name||employee.id}`},409);
    await base44.asServiceRole.entities.PayrollItem.create({tenant_id:tenantId,payroll_run_id:run.id,employee_id:employee.id,employee_name:employee.full_name||[employee.first_name,employee.last_name].filter(Boolean).join(" "),employee_number:employee.employee_number||"",currency:run.currency,base_minor:base,allowances,deductions,statutory_deductions,employer_contributions,gross_minor:gross,deductions_total_minor:deductionTotal,statutory_deductions_total_minor:statutoryTotal,employer_contributions_total_minor:employerTotal,net_minor:gross-deductionTotal-statutoryTotal,compensation_record_id:comp.id,statutory_rule_set_id:ruleSet.id,calculation_key:calculationKey,status:"calculated",snapshot:{period_start:run.period_start,period_end:run.period_end,pay_date:run.pay_date,pay_frequency:comp.pay_frequency,effective_from:comp.effective_from,country_code:run.country_code,statutory_rule:{id:ruleSet.id,name:ruleSet.name,version:ruleSet.version,effective_from:ruleSet.effective_from,source_url:ruleSet.source_url,verified_on:ruleSet.verified_on}}});
   }
   const items=await base44.asServiceRole.entities.PayrollItem.filter({tenant_id:tenantId,payroll_run_id:run.id},"employee_name",500);
   const totals=items.reduce((a:any,x:any)=>({gross_minor:a.gross_minor+(money(x.gross_minor)||0),deductions_minor:a.deductions_minor+(money(x.deductions_total_minor)||0),statutory_deductions_minor:a.statutory_deductions_minor+(money(x.statutory_deductions_total_minor)||0),employer_contributions_minor:a.employer_contributions_minor+(money(x.employer_contributions_total_minor)||0),net_minor:a.net_minor+(money(x.net_minor)||0)}),{gross_minor:0,deductions_minor:0,statutory_deductions_minor:0,employer_contributions_minor:0,net_minor:0});
   const updated=await base44.asServiceRole.entities.PayrollRun.update(run.id,{status:"calculated",...totals,statutory_rule_set_id:ruleSet.id,employee_count:items.length});
   await audit("payroll.calculated","PayrollRun",run.id,{employee_count:items.length,...totals});
   return json({success:true,data:updated,items});
  }
  if(operation==="approve_run"){
   const denied=requireHr();if(denied)return denied;
   if(run.status!=="calculated")return json({success:false,error:"Only a calculated run can be approved"},409);
   const updated=await base44.asServiceRole.entities.PayrollRun.update(run.id,{status:"approved",approved_by:user.id,approved_at:new Date().toISOString()});
   await audit("payroll.approved","PayrollRun",run.id);return json({success:true,data:updated});
  }
  if(operation==="finalize_run"){
   const denied=requireHr();if(denied)return denied;
   if(run.status!=="approved")return json({success:false,error:"Only an approved run can be finalized"},409);
   if(clean(body.confirmation,30)!==`${run.period_start}:${run.period_end}`)return json({success:false,error:"Confirmation does not match payroll period"},400);
   const items=await base44.asServiceRole.entities.PayrollItem.filter({tenant_id:tenantId,payroll_run_id:run.id},"employee_name",500);
   for(const item of items)if(item.status!=="finalized")await base44.asServiceRole.entities.PayrollItem.update(item.id,{status:"finalized"});
   const updated=await base44.asServiceRole.entities.PayrollRun.update(run.id,{status:"finalized",finalized_by:user.id,finalized_at:new Date().toISOString()});
   await audit("payroll.finalized","PayrollRun",run.id,{employee_count:items.length});return json({success:true,data:updated});
  }
  if(operation==="list_items"){
   let items=await base44.asServiceRole.entities.PayrollItem.filter({tenant_id:tenantId,payroll_run_id:run.id},"employee_name",500);
   if(!isHr)items=self?items.filter((x:any)=>x.employee_id===self.id&&x.status==="finalized"):[];
   return json({success:true,data:items});
  }
  if(operation==="export_run"){
   const denied=requireHr();if(denied)return denied;
   if(!["finalized","exported"].includes(run.status))return json({success:false,error:"Finalize the run before export"},409);
   const payload={schema_version:"1.0",target:"Africount-ready",source_system:"AfriHR",source_id:run.id,tenant_id:tenantId,idempotency_key:`afrihr-payroll-${run.id}`,currency:run.currency,period:{start:run.period_start,end:run.period_end,pay_date:run.pay_date},totals:{gross_minor:run.gross_minor,deductions_minor:run.deductions_minor,statutory_deductions_minor:run.statutory_deductions_minor,employer_contributions_minor:run.employer_contributions_minor,net_minor:run.net_minor},journal_lines:[{side:"debit",account_key:"payroll_expense",amount_minor:run.gross_minor},{side:"credit",account_key:"payroll_deductions_payable",amount_minor:run.deductions_minor},{side:"credit",account_key:"statutory_employee_payable",amount_minor:run.statutory_deductions_minor},{side:"credit",account_key:"payroll_payable",amount_minor:run.net_minor},{side:"debit",account_key:"employer_contributions_expense",amount_minor:run.employer_contributions_minor},{side:"credit",account_key:"statutory_employer_payable",amount_minor:run.employer_contributions_minor}]};
   if(run.status==="exported")return json({success:true,data:payload,reference:run.export_reference,idempotent:true});
   const reference=`AFRIHR-${run.id}`,updated=await base44.asServiceRole.entities.PayrollRun.update(run.id,{status:"exported",export_reference:reference,exported_at:new Date().toISOString()});
   await audit("payroll.exported","PayrollRun",run.id,{reference,target:"Africount-ready"});return json({success:true,data:payload,run:updated,reference});
  }
  return json({success:false,error:"Unsupported operation"},400);
 }catch(error){console.error("payroll-ops",requestId,error);return json({success:false,error:"Internal server error",request_id:requestId},500)}
});
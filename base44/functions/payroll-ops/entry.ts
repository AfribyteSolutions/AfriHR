import { createClientFromRequest } from "npm:@base44/sdk";

const HR=new Set(["platform_admin","tenant_admin","hr_manager"]);
const CURRENCIES=new Set(["XAF","XOF","NGN","GHS","KES","ZAR","UGX","RWF","TZS","ETB","MAD","EGP","DZD","AOA","BWP","MZN","NAD","ZMW","USD","EUR","GBP"]);
const clean=(v:unknown,max=2000)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(body:unknown,status=200)=>Response.json(body,{status});
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v);
const money=(v:unknown)=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=0?n:null};
const lines=(v:unknown,taxable=false)=>Array.isArray(v)?v.slice(0,30).map((x:any)=>({code:clean(x?.code,40),name:clean(x?.name,100),amount_minor:money(x?.amount_minor),...(taxable?{taxable:!!x?.taxable}:{})})).filter((x:any)=>x.code&&x.name&&x.amount_minor!==null):[];
const previousDay=(date:string)=>new Date(new Date(date+"T00:00:00Z").getTime()-86400000).toISOString().slice(0,10);

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
  const role=clean(user.app_role,50)||"employee",isHr=platformAdmin||HR.has(role),operation=clean(body.operation,50);
  const employees=await base44.asServiceRole.entities.Employee.filter({tenant_id:tenantId},"-created_date",500);
  const self=employees.find((e:any)=>e.user_id===user.id)||employees.find((e:any)=>String(e.email).toLowerCase()===String(user.email).toLowerCase());
  const employeeById=Object.fromEntries(employees.map((e:any)=>[e.id,e]));
  const requireHr=()=>isHr?null:json({success:false,error:"HR access required"},403);
  const audit=(action:string,type:string,id:string,metadata:Record<string,unknown>={})=>base44.asServiceRole.entities.AuditLog.create({tenant_id:tenantId,actor_user_id:user.id,actor_email:user.email,action,resource_type:type,resource_id:id,request_id:requestId,metadata,occurred_at:new Date().toISOString()});

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
   const start=clean(body.period_start,10),end=clean(body.period_end,10),payDate=clean(body.pay_date,10),currency=clean(body.currency,3).toUpperCase(),key=clean(body.idempotency_key,120);
   if(!dateOk(start)||!dateOk(end)||!dateOk(payDate)||start>end||!CURRENCIES.has(currency)||!key)return json({success:false,error:"Valid period, pay date, currency and idempotency key required"},400);
   const duplicate=await base44.asServiceRole.entities.PayrollRun.filter({tenant_id:tenantId,idempotency_key:key},"-created_date",1);
   if(duplicate.length)return json({success:true,data:duplicate[0],idempotent:true});
   const all=await base44.asServiceRole.entities.PayrollRun.filter({tenant_id:tenantId,currency},"-period_end",200);
   if(all.some((r:any)=>r.status!=="voided"&&start<=r.period_end&&end>=r.period_start))return json({success:false,error:"This payroll period overlaps an existing run"},409);
   const run=await base44.asServiceRole.entities.PayrollRun.create({tenant_id:tenantId,period_start:start,period_end:end,pay_date:payDate,currency,status:"draft",gross_minor:0,deductions_minor:0,net_minor:0,employee_count:0,idempotency_key:key});
   await audit("payroll.run_created","PayrollRun",run.id,{start,end,currency});
   return json({success:true,data:run},201);
  }

  const runId=clean(body.run_id,100);
  const run=runId?await base44.asServiceRole.entities.PayrollRun.get(runId).catch(()=>null):null;
  if(["calculate_run","approve_run","finalize_run","export_run","list_items"].includes(operation)&&(!run||run.tenant_id!==tenantId))return json({success:false,error:"Payroll run not found"},404);

  if(operation==="calculate_run"){
   const denied=requireHr();if(denied)return denied;
   if(!["draft","calculated"].includes(run.status))return json({success:false,error:"Only draft or calculated runs can be calculated"},409);
   const compensation=await base44.asServiceRole.entities.CompensationRecord.filter({tenant_id:tenantId,currency:run.currency},"-effective_from",500);
   const eligible=employees.filter((e:any)=>!["offboarded","terminated","inactive"].includes(String(e.status||e.employment_status||"").toLowerCase()));
   for(const employee of eligible){
    const comp=compensation.find((c:any)=>c.employee_id===employee.id&&c.effective_from<=run.period_end&&(!c.effective_to||c.effective_to>=run.period_start));
    if(!comp)continue;
    const calculationKey=`${run.id}:${employee.id}`;
    const existing=await base44.asServiceRole.entities.PayrollItem.filter({tenant_id:tenantId,calculation_key:calculationKey},"-created_date",1);
    if(existing.length)continue;
    const allowances=lines(comp.allowances,true),deductions=lines(comp.deductions),base=money(comp.base_salary_minor)||0;
    const allowanceTotal=allowances.reduce((s:number,x:any)=>s+x.amount_minor,0),deductionTotal=deductions.reduce((s:number,x:any)=>s+x.amount_minor,0),gross=base+allowanceTotal;
    if(deductionTotal>gross)return json({success:false,error:`Deductions exceed gross pay for ${employee.full_name||employee.id}`},409);
    await base44.asServiceRole.entities.PayrollItem.create({tenant_id:tenantId,payroll_run_id:run.id,employee_id:employee.id,employee_name:employee.full_name||[employee.first_name,employee.last_name].filter(Boolean).join(" "),employee_number:employee.employee_number||"",currency:run.currency,base_minor:base,allowances,deductions,gross_minor:gross,deductions_total_minor:deductionTotal,net_minor:gross-deductionTotal,compensation_record_id:comp.id,calculation_key:calculationKey,status:"calculated",snapshot:{period_start:run.period_start,period_end:run.period_end,pay_date:run.pay_date,pay_frequency:comp.pay_frequency,effective_from:comp.effective_from}});
   }
   const items=await base44.asServiceRole.entities.PayrollItem.filter({tenant_id:tenantId,payroll_run_id:run.id},"employee_name",500);
   const totals=items.reduce((a:any,x:any)=>({gross_minor:a.gross_minor+(money(x.gross_minor)||0),deductions_minor:a.deductions_minor+(money(x.deductions_total_minor)||0),net_minor:a.net_minor+(money(x.net_minor)||0)}),{gross_minor:0,deductions_minor:0,net_minor:0});
   const updated=await base44.asServiceRole.entities.PayrollRun.update(run.id,{status:"calculated",...totals,employee_count:items.length});
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
   const payload={schema_version:"1.0",target:"Africount-ready",source_system:"AfriHR",source_id:run.id,tenant_id:tenantId,idempotency_key:`afrihr-payroll-${run.id}`,currency:run.currency,period:{start:run.period_start,end:run.period_end,pay_date:run.pay_date},totals:{gross_minor:run.gross_minor,deductions_minor:run.deductions_minor,net_minor:run.net_minor},journal_lines:[{side:"debit",account_key:"payroll_expense",amount_minor:run.gross_minor},{side:"credit",account_key:"payroll_deductions_payable",amount_minor:run.deductions_minor},{side:"credit",account_key:"payroll_payable",amount_minor:run.net_minor}]};
   if(run.status==="exported")return json({success:true,data:payload,reference:run.export_reference,idempotent:true});
   const reference=`AFRIHR-${run.id}`,updated=await base44.asServiceRole.entities.PayrollRun.update(run.id,{status:"exported",export_reference:reference,exported_at:new Date().toISOString()});
   await audit("payroll.exported","PayrollRun",run.id,{reference,target:"Africount-ready"});return json({success:true,data:payload,run:updated,reference});
  }
  return json({success:false,error:"Unsupported operation"},400);
 }catch(error){console.error("payroll-ops",requestId,error);return json({success:false,error:"Internal server error",request_id:requestId},500)}
});
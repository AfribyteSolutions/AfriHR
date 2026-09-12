import {createClientFromRequest} from "npm:@base44/sdk";
const HR=new Set(["platform_admin","tenant_admin","hr_manager"]);
const FINANCE=new Set(["platform_admin","tenant_admin","hr_manager","payroll_manager","finance_manager"]);
const clean=(v:unknown,max=2000)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(body:unknown,status=200)=>Response.json(body,{status});
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v);
const timeOk=(v:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v);

Deno.serve(async(req)=>{
 const base44=createClientFromRequest(req),requestId=crypto.randomUUID();
 try{
  const user=await base44.auth.me(); if(!user)return json({success:false,error:"Unauthorized"},401);
  if(["suspended","offboarded"].includes(user.employment_status))return json({success:false,error:"Account disabled"},403);
  const body=await req.json().catch(()=>({})),platform=user.role==="admin"||user.app_role==="platform_admin";
  const tenantId=platform?clean(body.tenant_id,100)||clean(user.tenant_id,100):clean(user.tenant_id,100);
  if(!tenantId)return json({success:false,error:"Tenant required"},400);
  if(!platform&&body.tenant_id&&body.tenant_id!==tenantId)return json({success:false,error:"Cross-tenant access denied"},403);
  const role=clean(user.app_role,50)||"employee",isHr=platform||HR.has(role),isFinance=platform||FINANCE.has(role);
  const employees=await base44.asServiceRole.entities.Employee.filter({tenant_id:tenantId},"full_name",500);
  const self=employees.find((e:any)=>e.user_id===user.id)||employees.find((e:any)=>String(e.email).toLowerCase()===String(user.email).toLowerCase());
  const byId=Object.fromEntries(employees.map((e:any)=>[e.id,e]));
  const managed=new Set(self?employees.filter((e:any)=>e.manager_id===self.id).map((e:any)=>e.id):[]);
  const canReviewEmployee=(id:string)=>isHr||(role==="manager"&&managed.has(id));
  const operation=clean(body.operation,50);
  const audit=(action:string,type:string,id:string,metadata:Record<string,unknown>={})=>base44.asServiceRole.entities.AuditLog.create({tenant_id:tenantId,actor_user_id:user.id,actor_email:user.email,action,resource_type:type,resource_id:id,request_id:requestId,metadata,occurred_at:new Date().toISOString()});

  if(operation==="list"){
   const [allSchedules,allOvertime,allLoans,departments]=await Promise.all([
    base44.asServiceRole.entities.WorkSchedule.filter({tenant_id:tenantId},"-effective_from",500),
    base44.asServiceRole.entities.OvertimeRequest.filter({tenant_id:tenantId},"-work_date",500),
    base44.asServiceRole.entities.EmployeeLoan.filter({tenant_id:tenantId},"-requested_at",500),
    base44.asServiceRole.entities.Department.filter({tenant_id:tenantId},"name",500)
   ]);
   const schedules=isHr?allSchedules:allSchedules.filter((s:any)=>!s.employee_id||s.employee_id===self?.id);
   const overtime=allOvertime.filter((x:any)=>isHr||x.employee_id===self?.id||(role==="manager"&&managed.has(x.employee_id)));
   const loans=allLoans.filter((x:any)=>isFinance||x.employee_id===self?.id);
   return json({success:true,data:{schedules,overtime:overtime.map((x:any)=>({...x,employee:byId[x.employee_id]||null})),loans:loans.map((x:any)=>({...x,employee:byId[x.employee_id]||null})),employees:employees.map((e:any)=>({id:e.id,full_name:e.full_name,manager_id:e.manager_id})),departments},permissions:{manage_schedules:isHr,review_overtime:isHr||role==="manager",review_loans:isFinance},self_employee_id:self?.id||""});
  }
  if(operation==="save_schedule"){
   if(!isHr)return json({success:false,error:"HR access required"},403);
   const id=clean(body.id,100),name=clean(body.name,120),timezone=clean(body.timezone,80),start=clean(body.start_time,5),end=clean(body.end_time,5),from=clean(body.effective_from,10);
   const days=Array.isArray(body.days)?body.days.filter((x:any)=>["mon","tue","wed","thu","fri","sat","sun"].includes(x)):[],breakMinutes=Number(body.break_minutes||0);
   if(!name||!timezone||!timeOk(start)||!timeOk(end)||start>=end||!dateOk(from)||!days.length||!Number.isInteger(breakMinutes)||breakMinutes<0||breakMinutes>240)return json({success:false,error:"Complete schedule details are required"},400);
   const employeeId=clean(body.employee_id,100),departmentId=clean(body.department_id,100),to=clean(body.effective_to,10);
   if(employeeId&&!byId[employeeId])return json({success:false,error:"Employee not found"},404);
   if(to&&(!dateOk(to)||to<from))return json({success:false,error:"Effective end date is invalid"},400);
   const values={name,department_id:departmentId,employee_id:employeeId,timezone,days,start_time:start,end_time:end,break_minutes:breakMinutes,effective_from:from,effective_to:to,status:body.status==="inactive"?"inactive":"active"};
   let record;
   if(id){record=await base44.asServiceRole.entities.WorkSchedule.get(id).catch(()=>null);if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Schedule not found"},404);record=await base44.asServiceRole.entities.WorkSchedule.update(id,values)}
   else record=await base44.asServiceRole.entities.WorkSchedule.create({tenant_id:tenantId,...values});
   await audit(id?"schedule.updated":"schedule.created","WorkSchedule",record.id,{employee_id:employeeId,department_id:departmentId});return json({success:true,data:record},id?200:201);
  }
  if(operation==="request_overtime"){
   if(!self)return json({success:false,error:"No employee profile linked to this account"},409);
   const workDate=clean(body.work_date,10),minutes=Number(body.minutes),reason=clean(body.reason),key=clean(body.idempotency_key,120);
   if(!dateOk(workDate)||!Number.isInteger(minutes)||minutes<15||minutes>720||!reason||!key)return json({success:false,error:"Date, 15-720 minutes, reason and idempotency key are required"},400);
   const duplicate=await base44.asServiceRole.entities.OvertimeRequest.filter({tenant_id:tenantId,idempotency_key:key},"-created_date",1);if(duplicate.length)return json({success:true,data:duplicate[0],idempotent:true});
   const record=await base44.asServiceRole.entities.OvertimeRequest.create({tenant_id:tenantId,employee_id:self.id,work_date:workDate,minutes,reason,status:"pending",idempotency_key:key});
   await audit("overtime.requested","OvertimeRequest",record.id,{employee_id:self.id,minutes});return json({success:true,data:record},201);
  }
  if(operation==="decide_overtime"){
   const id=clean(body.id,100),decision=clean(body.decision,20),record=await base44.asServiceRole.entities.OvertimeRequest.get(id).catch(()=>null);
   if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Overtime request not found"},404);
   if(!canReviewEmployee(record.employee_id))return json({success:false,error:"You cannot review this employee"},403);
   if(record.status!=="pending"||!["approved","rejected"].includes(decision))return json({success:false,error:"Only pending requests can be approved or rejected"},409);
   const updated=await base44.asServiceRole.entities.OvertimeRequest.update(id,{status:decision,reviewed_by:user.id,reviewed_at:new Date().toISOString(),review_note:clean(body.review_note)});
   await audit(`overtime.${decision}`,"OvertimeRequest",id,{employee_id:record.employee_id});return json({success:true,data:updated});
  }
  if(operation==="request_loan"){
   if(!self)return json({success:false,error:"No employee profile linked to this account"},409);
   const amount=Number(body.amount_minor),months=Number(body.term_months),currency=clean(body.currency,3).toUpperCase(),type=clean(body.loan_type,30),reason=clean(body.reason),key=clean(body.idempotency_key,120);
   if(!Number.isInteger(amount)||amount<1||!Number.isInteger(months)||months<1||months>60||!/^[A-Z]{3}$/.test(currency)||!["salary_advance","personal","emergency","equipment","other"].includes(type)||!reason||!key)return json({success:false,error:"Valid amount, currency, 1-60 month term, type and reason are required"},400);
   const duplicate=await base44.asServiceRole.entities.EmployeeLoan.filter({tenant_id:tenantId,idempotency_key:key},"-created_date",1);if(duplicate.length)return json({success:true,data:duplicate[0],idempotent:true});
   const record=await base44.asServiceRole.entities.EmployeeLoan.create({tenant_id:tenantId,employee_id:self.id,loan_type:type,amount_minor:amount,currency,term_months:months,reason,requested_at:new Date().toISOString(),status:"pending",idempotency_key:key});
   await audit("loan.requested","EmployeeLoan",record.id,{employee_id:self.id,amount_minor:amount,currency});return json({success:true,data:record},201);
  }
  if(operation==="decide_loan"){
   if(!isFinance)return json({success:false,error:"Payroll or finance access required"},403);
   const id=clean(body.id,100),decision=clean(body.decision,20),record=await base44.asServiceRole.entities.EmployeeLoan.get(id).catch(()=>null);
   if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Loan request not found"},404);
   if(record.status!=="pending"||!["approved","rejected"].includes(decision))return json({success:false,error:"Only pending loans can be approved or rejected"},409);
   let values:any={status:decision,reviewed_by:user.id,reviewed_at:new Date().toISOString(),review_note:clean(body.review_note)};
   if(decision==="approved"){const approved=Number(body.approved_amount_minor||record.amount_minor),monthly=Number(body.monthly_deduction_minor||Math.ceil(approved/record.term_months)),first=clean(body.first_deduction_date,10);if(!Number.isInteger(approved)||approved<1||approved>record.amount_minor||!Number.isInteger(monthly)||monthly<1||!dateOk(first))return json({success:false,error:"Approved amount, monthly deduction and first deduction date are required"},400);values={...values,status:"active",approved_amount_minor:approved,monthly_deduction_minor:monthly,outstanding_minor:approved,first_deduction_date:first}}
   const updated=await base44.asServiceRole.entities.EmployeeLoan.update(id,values);await audit(`loan.${decision}`,"EmployeeLoan",id,{employee_id:record.employee_id,approved_amount_minor:values.approved_amount_minor||0});return json({success:true,data:updated});
  }
  if(operation==="set_schedule_status"){
   if(!isHr)return json({success:false,error:"HR access required"},403);const id=clean(body.id,100),record=await base44.asServiceRole.entities.WorkSchedule.get(id).catch(()=>null);if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Schedule not found"},404);const updated=await base44.asServiceRole.entities.WorkSchedule.update(id,{status:body.status==="active"?"active":"inactive"});await audit("schedule.status_changed","WorkSchedule",id,{status:updated.status});return json({success:true,data:updated});
  }
  return json({success:false,error:"Unsupported operation"},400);
 }catch(error){console.error("workforce-admin-ops",requestId,error);return json({success:false,error:"Internal server error",request_id:requestId},500)}
});
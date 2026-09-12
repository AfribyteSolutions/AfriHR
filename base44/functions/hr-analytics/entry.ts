import {createClientFromRequest} from "npm:@base44/sdk";
const REPORT_ROLES=new Set(["platform_admin","tenant_admin","hr_manager","recruiter","payroll_manager","finance_manager"]);
const PAYROLL_ROLES=new Set(["platform_admin","tenant_admin","payroll_manager","finance_manager"]);
const clean=(v:unknown,max=100)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(b:unknown,s=200)=>Response.json(b,{status:s});
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v);
const countBy=(rows:any[],field:string)=>rows.reduce((a:any,r:any)=>{const k=clean(r[field],120)||"Unassigned";a[k]=(a[k]||0)+1;return a},{});
const sum=(rows:any[],field:string)=>rows.reduce((n:number,r:any)=>n+Number(r[field]||0),0);
Deno.serve(async(req)=>{
 const base44=createClientFromRequest(req),requestId=crypto.randomUUID();
 try{
  const user=await base44.auth.me();if(!user)return json({success:false,error:"Unauthorized"},401);
  if(["suspended","offboarded"].includes(user.employment_status))return json({success:false,error:"Account disabled"},403);
  const body=await req.json().catch(()=>({})),platform=user.role==="admin"||user.app_role==="platform_admin",role=platform?"platform_admin":clean(user.app_role,50);
  if(!REPORT_ROLES.has(role))return json({success:false,error:"Reporting access required"},403);
  const tenantId=platform?clean(body.tenant_id)||clean(user.tenant_id):clean(user.tenant_id);if(!tenantId)return json({success:false,error:"Tenant required"},400);
  if(!platform&&body.tenant_id&&body.tenant_id!==tenantId)return json({success:false,error:"Cross-tenant access denied"},403);
  const today=new Date().toISOString().slice(0,10),defaultFrom=new Date(Date.now()-90*86400000).toISOString().slice(0,10),from=clean(body.from,10)||defaultFrom,to=clean(body.to,10)||today;
  if(!dateOk(from)||!dateOk(to)||from>to)return json({success:false,error:"Invalid reporting period"},400);
  const get=(name:string,sort:string,limit=1000)=>(base44.asServiceRole.entities as any)[name].filter({tenant_id:tenantId},sort,limit);
  const [employees,candidates,jobs,leaves,attendance,overtime,courses,enrollments,actions,offboarding,payrollRuns]=await Promise.all([
   get("Employee","-created_date"),get("Candidate","-created_date"),get("JobOpening","-created_date"),get("LeaveRequest","-start_date"),get("AttendanceRecord","-work_date"),get("OvertimeRequest","-work_date"),get("TrainingCourse","-start_date"),get("TrainingEnrollment","-enrolled_at"),get("EmployeeAction","-effective_date"),get("Offboarding","-last_working_date"),PAYROLL_ROLES.has(role)?get("PayrollRun","-period_end",500):Promise.resolve([])
  ]);
  const within=(v:string)=>v>=from&&v<=to,periodLeaves=leaves.filter((x:any)=>x.start_date<=to&&x.end_date>=from),periodAttendance=attendance.filter((x:any)=>within(x.work_date)),periodOvertime=overtime.filter((x:any)=>within(x.work_date)),periodTraining=enrollments.filter((x:any)=>x.completed_at&&within(x.completed_at.slice(0,10))),periodActions=actions.filter((x:any)=>within(x.effective_date)),periodExits=offboarding.filter((x:any)=>within(x.last_working_date)),periodPayroll=payrollRuns.filter((x:any)=>x.period_end>=from&&x.period_start<=to&&x.status!=="voided");
  const active=employees.filter((x:any)=>x.lifecycle_stage==="active"&&x.employment_status==="active"),hires=employees.filter((x:any)=>x.hire_date&&within(x.hire_date)),exitCompleted=periodExits.filter((x:any)=>x.status==="completed");
  const payrollByCurrency=periodPayroll.reduce((a:any,r:any)=>{const c=r.currency||"N/A";a[c]??={gross_minor:0,net_minor:0,deductions_minor:0,runs:0};a[c].gross_minor+=Number(r.gross_minor||0);a[c].net_minor+=Number(r.net_minor||0);a[c].deductions_minor+=Number(r.deductions_minor||0);a[c].runs++;return a},{});
  const months:string[]=[];const cursor=new Date(from+"T00:00:00Z"),end=new Date(to+"T00:00:00Z");cursor.setUTCDate(1);while(cursor<=end&&months.length<24){months.push(cursor.toISOString().slice(0,7));cursor.setUTCMonth(cursor.getUTCMonth()+1)}
  const trend=months.map(month=>({month,hires:employees.filter((x:any)=>x.hire_date?.startsWith(month)).length,exits:offboarding.filter((x:any)=>x.status==="completed"&&x.last_working_date?.startsWith(month)).length,applications:candidates.filter((x:any)=>x.created_date?.startsWith(month)).length}));
  const result={
   period:{from,to,generated_at:new Date().toISOString()},
   workforce:{total:employees.length,active:active.length,preboarding:employees.filter((x:any)=>x.lifecycle_stage==="preboarding").length,offboarding:employees.filter((x:any)=>x.lifecycle_stage==="offboarding").length,hires:hires.length,completed_exits:exitCompleted.length,turnover_rate:active.length?Math.round(exitCompleted.length/((active.length+employees.length)/2)*1000)/10:0,by_department:countBy(active,"department"),by_job_title:countBy(active,"job_title")},
   recruitment:{open_jobs:jobs.filter((x:any)=>x.status==="open").length,total_candidates:candidates.length,period_applications:candidates.filter((x:any)=>x.created_date&&within(x.created_date.slice(0,10))).length,hired:candidates.filter((x:any)=>x.stage==="hired").length,by_stage:countBy(candidates,"stage"),by_source:countBy(candidates,"source")},
   leave:{requests:periodLeaves.length,days:sum(periodLeaves.filter((x:any)=>x.status==="approved"),"days"),by_status:countBy(periodLeaves,"status"),by_type:countBy(periodLeaves,"leave_type")},
   time:{attendance_records:periodAttendance.length,worked_hours:Math.round(sum(periodAttendance,"worked_minutes")/6)/10,approved_overtime_hours:Math.round(sum(periodOvertime.filter((x:any)=>x.status==="approved"),"minutes")/6)/10,pending_overtime:periodOvertime.filter((x:any)=>x.status==="pending").length},
   learning:{courses:courses.length,completed_enrollments:periodTraining.length,completion_rate:enrollments.length?Math.round(enrollments.filter((x:any)=>x.status==="completed").length/enrollments.length*1000)/10:0,planned_cost_by_currency:courses.filter((x:any)=>x.start_date<=to&&x.end_date>=from).reduce((a:any,x:any)=>{a[x.currency]=(a[x.currency]||0)+Number(x.cost_minor||0);return a},{})},
   relations:{actions:periodActions.length,by_type:countBy(periodActions,"action_type"),pending:periodActions.filter((x:any)=>x.status==="pending").length},
   payroll:PAYROLL_ROLES.has(role)?{visible:true,by_currency:payrollByCurrency}:{visible:false},
   trend
  };
  await base44.asServiceRole.entities.AuditLog.create({tenant_id:tenantId,actor_user_id:user.id,actor_email:user.email,action:"report.generated",resource_type:"Analytics",resource_id:requestId,request_id:requestId,metadata:{from,to,payroll_visible:PAYROLL_ROLES.has(role)},occurred_at:new Date().toISOString()});
  return json({success:true,data:result});
 }catch(error){console.error("hr-analytics",requestId,error);return json({success:false,error:"Internal server error",request_id:requestId},500)}
});
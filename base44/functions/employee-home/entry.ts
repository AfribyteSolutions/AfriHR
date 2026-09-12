import {createClientFromRequest} from "npm:@base44/sdk";
const clean=(v:unknown,max=200)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(b:unknown,s=200)=>Response.json(b,{status:s});
Deno.serve(async(req)=>{
 const base44=createClientFromRequest(req),requestId=crypto.randomUUID();
 try{
  const user=await base44.auth.me();if(!user)return json({success:false,error:"Unauthorized"},401);
  if(["suspended","offboarded"].includes(user.employment_status))return json({success:false,error:"Account disabled"},403);
  const body=await req.json().catch(()=>({})),platform=user.role==="admin"||user.app_role==="platform_admin";
  const tenantId=platform?clean(body.tenant_id,100)||clean(user.tenant_id,100):clean(user.tenant_id,100);
  if(!tenantId)return json({success:false,error:"Tenant required"},400);
  if(!platform&&body.tenant_id&&body.tenant_id!==tenantId)return json({success:false,error:"Cross-tenant access denied"},403);
  const employees=await base44.asServiceRole.entities.Employee.filter({tenant_id:tenantId},"-created_date",500),employee=employees.find((e:any)=>e.user_id===user.id)||employees.find((e:any)=>String(e.email).toLowerCase()===String(user.email).toLowerCase());
  if(!employee)return json({success:false,error:"No employee profile is linked to this account"},409);
  const f=(name:string,sort:string,limit=250)=>(base44.asServiceRole.entities as any)[name].filter({tenant_id:tenantId,employee_id:employee.id},sort,limit);
  const [tenant,leaves,attendance,timesheets,reviews,documents,offboarding,payroll,enrolments,skills,loans,actions,schedules,courses]=await Promise.all([
   base44.asServiceRole.entities.Tenant.get(tenantId).catch(()=>null),f("LeaveRequest","-start_date"),f("AttendanceRecord","-work_date"),f("TimesheetEntry","-work_date"),f("PerformanceReview","-period_end"),f("EmployeeDocument","-created_date"),f("Offboarding","-created_date"),f("PayrollItem","-created_date"),f("TrainingEnrollment","-enrolled_at"),f("EmployeeSkill","-verified_at"),f("EmployeeLoan","-requested_at"),f("EmployeeAction","-effective_date"),base44.asServiceRole.entities.WorkSchedule.filter({tenant_id:tenantId},"-effective_from",250),base44.asServiceRole.entities.TrainingCourse.filter({tenant_id:tenantId},"-start_date",500)
  ]);
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:tenant?.timezone||"Africa/Douala",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),courseById=Object.fromEntries(courses.map((x:any)=>[x.id,x]));
  const safePayroll=payroll.filter((x:any)=>x.status==="finalized").map((x:any)=>({id:x.id,payroll_run_id:x.payroll_run_id,currency:x.currency,gross_minor:x.gross_minor,deductions_total_minor:x.deductions_total_minor,net_minor:x.net_minor,status:x.status,created_date:x.created_date})).slice(0,6);
  const safeDocuments=documents.filter((x:any)=>x.status!=="archived").map((x:any)=>({id:x.id,file_name:x.file_name,category:x.category,status:x.status,expiry_date:x.expiry_date,created_date:x.created_date}));
  const safeReviews=reviews.filter((x:any)=>x.status!=="draft").map((x:any)=>({id:x.id,period_start:x.period_start,period_end:x.period_end,goals:x.goals,rating:x.rating,feedback:x.feedback,status:x.status}));
  const visibleActions=actions.filter((x:any)=>x.action_type!=="termination"||x.status!=="pending");
  const applicableSchedules=schedules.filter((x:any)=>x.status==="active"&&(!x.employee_id||x.employee_id===employee.id)&&x.effective_from<=today&&(!x.effective_to||x.effective_to>=today));
  return json({success:true,data:{
   tenant:{name:tenant?.name||"Your organization",timezone:tenant?.timezone||"Africa/Douala"},
   employee:{id:employee.id,employee_number:employee.employee_number,full_name:employee.full_name,email:employee.email,department:employee.department,job_title:employee.job_title,hire_date:employee.hire_date,lifecycle_stage:employee.lifecycle_stage,employment_status:employee.employment_status},
   today,attendance_today:attendance.find((x:any)=>x.work_date===today)||null,schedules:applicableSchedules,
   summary:{pending_leave:leaves.filter((x:any)=>x.status==="pending").length,approved_leave_days:leaves.filter((x:any)=>x.status==="approved"&&x.end_date>=today).reduce((n:number,x:any)=>n+Number(x.days||0),0),pending_timesheets:timesheets.filter((x:any)=>["draft","rejected"].includes(x.status)).length,open_training:enrolments.filter((x:any)=>["enrolled","in_progress"].includes(x.status)).length,documents:safeDocuments.length,active_loan_balance:loans.filter((x:any)=>x.status==="active").reduce((n:number,x:any)=>n+Number(x.outstanding_minor||0),0),unacknowledged_warnings:actions.filter((x:any)=>x.action_type==="warning"&&x.status==="approved").length},
   leaves:leaves.slice(0,5),timesheets:timesheets.slice(0,5),reviews:safeReviews.slice(0,4),documents:safeDocuments.slice(0,6),offboarding:offboarding.find((x:any)=>!["completed","cancelled"].includes(x.status))||null,payslips:safePayroll,
   training:enrolments.slice(0,6).map((x:any)=>({...x,certificate_file_uri:undefined,course:courseById[x.course_id]?{title:courseById[x.course_id].title,start_date:courseById[x.course_id].start_date,end_date:courseById[x.course_id].end_date}:null})),skills:skills.filter((x:any)=>x.status==="active").slice(0,8),loans:loans.slice(0,5),actions:visibleActions.slice(0,6)
  }});
 }catch(error){console.error("employee-home",requestId,error);return json({success:false,error:"Internal server error",request_id:requestId},500)}
});
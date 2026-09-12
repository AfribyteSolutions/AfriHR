import { createClientFromRequest } from "npm:@base44/sdk";

const HR = new Set(["platform_admin","tenant_admin","hr_manager"]);
const clean=(v:unknown,max=2000)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(body:unknown,status=200)=>Response.json(body,{status});
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v);
const minutesBetween=(a:string,b:string)=>Math.max(0,Math.min(1440,Math.round((new Date(b).getTime()-new Date(a).getTime())/60000)));

Deno.serve(async(req)=>{
  const base44=createClientFromRequest(req);
  const requestId=crypto.randomUUID();
  try{
    const user=await base44.auth.me();
    if(!user)return json({success:false,error:"Unauthorized"},401);
    if(["suspended","offboarded"].includes(user.employment_status))return json({success:false,error:"Account disabled"},403);
    const body=await req.json().catch(()=>({}));
    const platformAdmin=user.role==="admin"||user.app_role==="platform_admin";
    const tenantId=platformAdmin?clean(body.tenant_id,100)||clean(user.tenant_id,100):clean(user.tenant_id,100);
    if(!tenantId)return json({success:false,error:"Tenant required"},400);
    if(!platformAdmin&&body.tenant_id&&body.tenant_id!==tenantId)return json({success:false,error:"Cross-tenant access denied"},403);
    const role=clean(user.app_role,50)||"employee";
    const permissions=new Set(Array.isArray(user.permissions)?user.permissions:[]);
    const canViewAll=platformAdmin||HR.has(role)||permissions.has("time.view")||permissions.has("time.review");
    const canReview=platformAdmin||HR.has(role)||permissions.has("time.review");
    const employees=await base44.asServiceRole.entities.Employee.filter({tenant_id:tenantId},"-created_date",500);
    const self=employees.find((e:any)=>e.user_id===user.id)||employees.find((e:any)=>String(e.email).toLowerCase()===String(user.email).toLowerCase());
    const byId=Object.fromEntries(employees.map((e:any)=>[e.id,e]));
    const managed=new Set(self?employees.filter((e:any)=>e.manager_id===self.id).map((e:any)=>e.id):[]);
    const canSee=(employeeId:string)=>canViewAll||!!self&&(employeeId===self.id||(role==="manager"&&managed.has(employeeId)));
    const operation=clean(body.operation,50);
    const audit=(action:string,type:string,id:string,metadata:Record<string,unknown>={})=>base44.asServiceRole.entities.AuditLog.create({
      tenant_id:tenantId,actor_user_id:user.id,actor_email:user.email,action,resource_type:type,resource_id:id,
      request_id:requestId,metadata,occurred_at:new Date().toISOString()
    });
    const tenant=await base44.asServiceRole.entities.Tenant.get(tenantId).catch(()=>null);
    const timezone=tenant?.timezone||"Africa/Douala";
    const localDate=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

    if(operation==="list_attendance"){
      let records=await base44.asServiceRole.entities.AttendanceRecord.filter({tenant_id:tenantId},"-work_date",500);
      records=records.filter((r:any)=>canSee(r.employee_id));
      return json({success:true,data:records.map((r:any)=>({...r,employee:byId[r.employee_id]||null})),today:localDate,timezone});
    }
    if(operation==="clock_in"){
      if(!self)return json({success:false,error:"No employee profile linked to this account"},409);
      const key=clean(body.idempotency_key,120);
      if(!key)return json({success:false,error:"Idempotency key required"},400);
      const duplicate=await base44.asServiceRole.entities.AttendanceRecord.filter({tenant_id:tenantId,idempotency_key:key},"-created_date",1);
      if(duplicate.length)return json({success:true,data:duplicate[0],idempotent:true});
      const todayRecords=await base44.asServiceRole.entities.AttendanceRecord.filter({tenant_id:tenantId,employee_id:self.id,work_date:localDate},"-created_date",20);
      const open=todayRecords.find((r:any)=>r.status==="clocked_in");
      if(open)return json({success:true,data:open,idempotent:true});
      const record=await base44.asServiceRole.entities.AttendanceRecord.create({
        tenant_id:tenantId,employee_id:self.id,work_date:localDate,clock_in:new Date().toISOString(),
        status:"clocked_in",source:"web",idempotency_key:key
      });
      await audit("attendance.clock_in","AttendanceRecord",record.id,{employee_id:self.id,work_date:localDate});
      return json({success:true,data:record},201);
    }
    if(operation==="clock_out"){
      if(!self)return json({success:false,error:"No employee profile linked to this account"},409);
      const records=await base44.asServiceRole.entities.AttendanceRecord.filter({tenant_id:tenantId,employee_id:self.id,work_date:localDate},"-created_date",20);
      const open=records.find((r:any)=>r.status==="clocked_in");
      if(!open)return json({success:false,error:"No active clock-in found"},409);
      const now=new Date().toISOString();
      const updated=await base44.asServiceRole.entities.AttendanceRecord.update(open.id,{clock_out:now,worked_minutes:minutesBetween(open.clock_in,now),status:"completed"});
      await audit("attendance.clock_out","AttendanceRecord",open.id,{employee_id:self.id,worked_minutes:updated.worked_minutes});
      return json({success:true,data:updated});
    }
    if(operation==="correct_attendance"){
      if(!canReview)return json({success:false,error:"Time review permission required"},403);
      const id=clean(body.attendance_id,100);
      const record=await base44.asServiceRole.entities.AttendanceRecord.get(id);
      if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Attendance record not found"},404);
      const clockIn=clean(body.clock_in,40),clockOut=clean(body.clock_out,40);
      if(!Number.isFinite(new Date(clockIn).getTime())||!Number.isFinite(new Date(clockOut).getTime())||new Date(clockOut)<=new Date(clockIn))return json({success:false,error:"Valid clock-in and clock-out required"},400);
      const updated=await base44.asServiceRole.entities.AttendanceRecord.update(id,{clock_in:clockIn,clock_out:clockOut,worked_minutes:minutesBetween(clockIn,clockOut),status:"corrected",note:clean(body.note),corrected_by:user.id,corrected_at:new Date().toISOString()});
      await audit("attendance.corrected","AttendanceRecord",id,{employee_id:record.employee_id,note:clean(body.note)});
      return json({success:true,data:updated});
    }

    if(operation==="list_timesheets"){
      let records=await base44.asServiceRole.entities.TimesheetEntry.filter({tenant_id:tenantId},"-work_date",500);
      records=records.filter((r:any)=>canSee(r.employee_id));
      return json({success:true,data:records.map((r:any)=>({...r,employee:byId[r.employee_id]||null,
        can_submit:!!self&&r.employee_id===self.id&&["draft","rejected"].includes(r.status),
        can_review:r.status==="submitted"&&(canReview||(role==="manager"&&managed.has(r.employee_id)))
      }))});
    }
    if(operation==="save_timesheet"){
      const requested=clean(body.employee_id,100);
      const employeeId=canReview?requested||self?.id:self?.id;
      if(!employeeId||!byId[employeeId])return json({success:false,error:"Employee not found"},404);
      if(!canReview&&employeeId!==self?.id)return json({success:false,error:"Forbidden"},403);
      const workDate=clean(body.work_date,10),minutes=Number(body.minutes),key=clean(body.idempotency_key,120);
      if(!dateOk(workDate)||!Number.isInteger(minutes)||minutes<1||minutes>1440||!key)return json({success:false,error:"Date, 1-1440 minutes and idempotency key required"},400);
      const duplicate=await base44.asServiceRole.entities.TimesheetEntry.filter({tenant_id:tenantId,idempotency_key:key},"-created_date",1);
      if(duplicate.length)return json({success:true,data:duplicate[0],idempotent:true});
      const record=await base44.asServiceRole.entities.TimesheetEntry.create({
        tenant_id:tenantId,employee_id:employeeId,work_date:workDate,minutes,
        description:clean(body.description),project_code:clean(body.project_code,100),status:"draft",idempotency_key:key
      });
      await audit("timesheet.created","TimesheetEntry",record.id,{employee_id:employeeId,minutes,work_date:workDate});
      return json({success:true,data:record},201);
    }
    const entryId=clean(body.timesheet_id,100);
    const entry=entryId?await base44.asServiceRole.entities.TimesheetEntry.get(entryId):null;
    if(!entry||entry.tenant_id!==tenantId)return json({success:false,error:"Timesheet entry not found"},404);

    if(operation==="submit_timesheet"){
      if(!self||entry.employee_id!==self.id)return json({success:false,error:"Only the employee can submit this entry"},403);
      if(!["draft","rejected"].includes(entry.status))return json({success:false,error:"Only draft or rejected entries can be submitted"},409);
      const updated=await base44.asServiceRole.entities.TimesheetEntry.update(entryId,{status:"submitted",submitted_at:new Date().toISOString(),review_note:""});
      await audit("timesheet.submitted","TimesheetEntry",entryId,{employee_id:entry.employee_id});
      return json({success:true,data:updated});
    }
    if(operation==="decide_timesheet"){
      const permitted=canReview||(role==="manager"&&managed.has(entry.employee_id));
      if(!permitted)return json({success:false,error:"You can only review direct reports"},403);
      if(entry.status!=="submitted")return json({success:false,error:"Only submitted entries can be reviewed"},409);
      const decision=clean(body.decision,20);
      if(!["approved","rejected"].includes(decision))return json({success:false,error:"Decision must be approved or rejected"},400);
      const updated=await base44.asServiceRole.entities.TimesheetEntry.update(entryId,{status:decision,reviewed_by:user.id,reviewed_at:new Date().toISOString(),review_note:clean(body.review_note)});
      await audit(`timesheet.${decision}`,"TimesheetEntry",entryId,{employee_id:entry.employee_id});
      return json({success:true,data:updated});
    }
    return json({success:false,error:"Unsupported operation"},400);
  }catch(error){
    console.error("workforce-time-ops",requestId,error);
    return json({success:false,error:"Internal server error",request_id:requestId},500);
  }
});

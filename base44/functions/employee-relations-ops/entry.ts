import {createClientFromRequest} from "npm:@base44/sdk";
const HR=new Set(["platform_admin","tenant_admin","hr_manager"]);
const TYPES=new Set(["warning","promotion","transfer","resignation","termination"]);
const clean=(v:unknown,max=3000)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(body:unknown,status=200)=>Response.json(body,{status});
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v);
const tasks=()=>[
 {id:"knowledge-handover",label:"Knowledge handover completed",required:true,completed:false},
 {id:"assets",label:"Company assets returned",required:true,completed:false},
 {id:"access",label:"System access removal confirmed",required:true,completed:false},
 {id:"finance",label:"Final payroll and benefits cleared",required:true,completed:false},
 {id:"documents",label:"Final documents issued",required:true,completed:false},
 {id:"exit-interview",label:"Exit interview completed",required:false,completed:false}
];

Deno.serve(async(req)=>{
 const base44=createClientFromRequest(req),requestId=crypto.randomUUID();
 try{
  const user=await base44.auth.me();if(!user)return json({success:false,error:"Unauthorized"},401);
  if(["suspended","offboarded"].includes(user.employment_status))return json({success:false,error:"Account disabled"},403);
  const body=await req.json().catch(()=>({})),platform=user.role==="admin"||user.app_role==="platform_admin";
  const tenantId=platform?clean(body.tenant_id,100)||clean(user.tenant_id,100):clean(user.tenant_id,100);
  if(!tenantId)return json({success:false,error:"Tenant required"},400);
  if(!platform&&body.tenant_id&&body.tenant_id!==tenantId)return json({success:false,error:"Cross-tenant access denied"},403);
  const role=clean(user.app_role,50)||"employee",permissions=new Set(Array.isArray(user.permissions)?user.permissions:[]);
  const canViewAll=platform||HR.has(role)||permissions.has("relations.view")||permissions.has("relations.manage"),canManage=platform||HR.has(role)||permissions.has("relations.manage");
  const employees=await base44.asServiceRole.entities.Employee.filter({tenant_id:tenantId},"full_name",500);
  const self=employees.find((e:any)=>e.user_id===user.id)||employees.find((e:any)=>String(e.email).toLowerCase()===String(user.email).toLowerCase());
  const byId=Object.fromEntries(employees.map((e:any)=>[e.id,e])),operation=clean(body.operation,50);
  const audit=(action:string,type:string,id:string,metadata:Record<string,unknown>={})=>base44.asServiceRole.entities.AuditLog.create({tenant_id:tenantId,actor_user_id:user.id,actor_email:user.email,action,resource_type:type,resource_id:id,request_id:requestId,metadata,occurred_at:new Date().toISOString()});

  if(operation==="list"){
   let records=await base44.asServiceRole.entities.EmployeeAction.filter({tenant_id:tenantId},"-effective_date",500);
   if(!canViewAll)records=self?records.filter((x:any)=>x.employee_id===self.id):[];
   return json({success:true,data:records.map((x:any)=>({...x,employee:byId[x.employee_id]||null})),employees:canManage?employees.map((e:any)=>({id:e.id,full_name:e.full_name,department:e.department,job_title:e.job_title,lifecycle_stage:e.lifecycle_stage})):[],can_manage:canManage,self_employee_id:self?.id||""});
  }
  if(operation==="create"){
   const type=clean(body.action_type,30);if(!TYPES.has(type))return json({success:false,error:"Invalid action type"},400);
   const employeeId=type==="resignation"&&!canManage?self?.id:clean(body.employee_id,100),employee=employeeId?byId[employeeId]:null;
   if(!employee)return json({success:false,error:"Employee not found"},404);
   if(!canManage&&type!=="resignation")return json({success:false,error:"Employee relations management permission required"},403);
   if(["resignation","termination"].includes(type)&&employee.lifecycle_stage==="offboarded")return json({success:false,error:"Employee is already offboarded"},409);
   const title=clean(body.title,160)||type[0].toUpperCase()+type.slice(1),reason=clean(body.reason),effective=clean(body.effective_date,10),key=clean(body.idempotency_key,120);
   if(!reason||!dateOk(effective)||!key)return json({success:false,error:"Reason, effective date and idempotency key are required"},400);
   const duplicate=await base44.asServiceRole.entities.EmployeeAction.filter({tenant_id:tenantId,idempotency_key:key},"-created_date",1);if(duplicate.length)return json({success:true,data:duplicate[0],idempotent:true});
   const values:any={tenant_id:tenantId,employee_id:employeeId,action_type:type,title,reason,effective_date:effective,status:"pending",requested_by:user.id,idempotency_key:key};
   if(type==="warning"){const severity=clean(body.severity,20);if(!["verbal","written","final"].includes(severity))return json({success:false,error:"Warning severity is required"},400);values.severity=severity;values.status="approved"}
   if(type==="promotion"){values.from_job_title=employee.job_title||"";values.to_job_title=clean(body.to_job_title,160);if(!values.to_job_title)return json({success:false,error:"New job title is required"},400)}
   if(type==="transfer"){values.from_department=employee.department||"";values.to_department=clean(body.to_department,160);if(!values.to_department)return json({success:false,error:"New department is required"},400)}
   const record=await base44.asServiceRole.entities.EmployeeAction.create(values);
   await audit(`employee_action.${type}.created`,"EmployeeAction",record.id,{employee_id:employeeId});
   return json({success:true,data:record},201);
  }
  const id=clean(body.id,100),record=id?await base44.asServiceRole.entities.EmployeeAction.get(id).catch(()=>null):null;
  if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Employee action not found"},404);
  if(operation==="acknowledge"){
   if(!self||record.employee_id!==self.id||record.action_type!=="warning")return json({success:false,error:"Only the affected employee can acknowledge this warning"},403);
   if(record.status!=="approved")return json({success:false,error:"Warning cannot be acknowledged"},409);
   const updated=await base44.asServiceRole.entities.EmployeeAction.update(id,{status:"acknowledged",acknowledged_by:user.id,acknowledged_at:new Date().toISOString()});await audit("employee_action.warning.acknowledged","EmployeeAction",id,{employee_id:self.id});return json({success:true,data:updated});
  }
  if(operation==="decide"){
   if(!canManage)return json({success:false,error:"Employee relations management permission required"},403);
   if(record.status!=="pending")return json({success:false,error:"Only pending actions can be reviewed"},409);
   const decision=clean(body.decision,20);if(!["approved","rejected"].includes(decision))return json({success:false,error:"Invalid decision"},400);
   if(record.action_type==="termination"&&record.requested_by===user.id&&!platform)return json({success:false,error:"Termination requires approval by a different HR administrator"},409);
   let offboardingId="";
   if(decision==="approved"){
    const employee=byId[record.employee_id];if(!employee)return json({success:false,error:"Employee not found"},404);
    if(record.action_type==="promotion")await base44.asServiceRole.entities.Employee.update(employee.id,{job_title:record.to_job_title});
    if(record.action_type==="transfer")await base44.asServiceRole.entities.Employee.update(employee.id,{department:record.to_department});
    if(["resignation","termination"].includes(record.action_type)){
     const existing=await base44.asServiceRole.entities.Offboarding.filter({tenant_id:tenantId,employee_id:employee.id},"-created_date",20),active=existing.find((x:any)=>!["completed","cancelled"].includes(x.status));
     if(active)offboardingId=active.id;else{const off=await base44.asServiceRole.entities.Offboarding.create({tenant_id:tenantId,employee_id:employee.id,offboarding_type:record.action_type,reason:record.reason,last_working_date:record.effective_date,status:"initiated",previous_lifecycle_stage:employee.lifecycle_stage||"active",previous_employment_status:employee.employment_status||"active",tasks:tasks(),initiated_by:user.id});offboardingId=off.id;await base44.asServiceRole.entities.Employee.update(employee.id,{lifecycle_stage:"offboarding"})}
    }
   }
   const updated=await base44.asServiceRole.entities.EmployeeAction.update(id,{status:decision,reviewed_by:user.id,reviewed_at:new Date().toISOString(),review_note:clean(body.review_note),offboarding_id:offboardingId});
   await audit(`employee_action.${record.action_type}.${decision}`,"EmployeeAction",id,{employee_id:record.employee_id,offboarding_id:offboardingId||null});
   return json({success:true,data:updated,offboarding_id:offboardingId||null});
  }
  if(operation==="cancel"){
   const owns=!!self&&record.employee_id===self.id&&record.action_type==="resignation";
   if(!canManage&&!owns)return json({success:false,error:"Forbidden"},403);
   if(record.status!=="pending")return json({success:false,error:"Only pending actions can be cancelled"},409);
   const updated=await base44.asServiceRole.entities.EmployeeAction.update(id,{status:"cancelled"});await audit("employee_action.cancelled","EmployeeAction",id,{employee_id:record.employee_id});return json({success:true,data:updated});
  }
  return json({success:false,error:"Unsupported operation"},400);
 }catch(error){console.error("employee-relations-ops",requestId,error);return json({success:false,error:"Internal server error",request_id:requestId},500)}
});
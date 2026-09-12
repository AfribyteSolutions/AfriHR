import { createClientFromRequest } from "npm:@base44/sdk";

const ADMIN=new Set(["platform_admin","tenant_admin","hr_manager"]);
const clean=(v:unknown,max=500)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(body:unknown,status=200)=>Response.json(body,{status});
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v);

Deno.serve(async(req)=>{
 const base44=createClientFromRequest(req),requestId=crypto.randomUUID();
 try{
  const user=await base44.auth.me();
  if(!user)return json({success:false,error:"Unauthorized"},401);
  if(["suspended","offboarded"].includes(user.employment_status))return json({success:false,error:"Account disabled"},403);
  const body=await req.json().catch(()=>({}));
  const platform=user.role==="admin"||user.app_role==="platform_admin";
  const tenantId=platform?clean(body.tenant_id,100)||clean(user.tenant_id,100):clean(user.tenant_id,100);
  if(!tenantId)return json({success:false,error:"Tenant required"},400);
  if(!platform&&body.tenant_id&&body.tenant_id!==tenantId)return json({success:false,error:"Cross-tenant access denied"},403);
  const canManage=platform||ADMIN.has(clean(user.app_role,50));
  const operation=clean(body.operation,50);
  const audit=(action:string,type:string,id:string,metadata:Record<string,unknown>={})=>base44.asServiceRole.entities.AuditLog.create({tenant_id:tenantId,actor_user_id:user.id,actor_email:user.email,action,resource_type:type,resource_id:id,request_id:requestId,metadata,occurred_at:new Date().toISOString()});
  if(operation==="list"){
   const [departments,designations,holidays,employees]=await Promise.all([
    base44.asServiceRole.entities.Department.filter({tenant_id:tenantId},"name",500),
    base44.asServiceRole.entities.Designation.filter({tenant_id:tenantId},"title",500),
    base44.asServiceRole.entities.Holiday.filter({tenant_id:tenantId},"date",500),
    base44.asServiceRole.entities.Employee.filter({tenant_id:tenantId},"full_name",500)
   ]);
   return json({success:true,data:{departments,designations,holidays,employees:employees.map((e:any)=>({id:e.id,full_name:e.full_name}))},can_manage:canManage});
  }
  if(!canManage)return json({success:false,error:"HR administrator access required"},403);
  if(operation==="save_department"){
   const name=clean(body.name,120),code=clean(body.code,30).toUpperCase();
   if(!name||!code)return json({success:false,error:"Department name and code are required"},400);
   const duplicate=await base44.asServiceRole.entities.Department.filter({tenant_id:tenantId,code},"-created_date",5);
   if(duplicate.some((x:any)=>x.id!==body.id))return json({success:false,error:"Department code already exists"},409);
   const values={name,code,description:clean(body.description),manager_employee_id:clean(body.manager_employee_id,100),cost_center_code:clean(body.cost_center_code,60),status:body.status==="archived"?"archived":"active"};
   let record;
   if(body.id){record=await base44.asServiceRole.entities.Department.get(clean(body.id,100));if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Department not found"},404);record=await base44.asServiceRole.entities.Department.update(record.id,values)}
   else record=await base44.asServiceRole.entities.Department.create({tenant_id:tenantId,...values});
   await audit(body.id?"department.updated":"department.created","Department",record.id,{code});
   return json({success:true,data:record},body.id?200:201);
  }
  if(operation==="save_designation"){
   const title=clean(body.title,120),code=clean(body.code,30).toUpperCase(),departmentId=clean(body.department_id,100);
   if(!title||!code)return json({success:false,error:"Designation title and code are required"},400);
   if(departmentId){const department=await base44.asServiceRole.entities.Department.get(departmentId).catch(()=>null);if(!department||department.tenant_id!==tenantId)return json({success:false,error:"Department not found"},404)}
   const duplicate=await base44.asServiceRole.entities.Designation.filter({tenant_id:tenantId,code},"-created_date",5);
   if(duplicate.some((x:any)=>x.id!==body.id))return json({success:false,error:"Designation code already exists"},409);
   const values={title,code,department_id:departmentId,level:clean(body.level,60),description:clean(body.description),status:body.status==="archived"?"archived":"active"};
   let record;
   if(body.id){record=await base44.asServiceRole.entities.Designation.get(clean(body.id,100));if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Designation not found"},404);record=await base44.asServiceRole.entities.Designation.update(record.id,values)}
   else record=await base44.asServiceRole.entities.Designation.create({tenant_id:tenantId,...values});
   await audit(body.id?"designation.updated":"designation.created","Designation",record.id,{code});
   return json({success:true,data:record},body.id?200:201);
  }
  if(operation==="save_holiday"){
   const name=clean(body.name,120),date=clean(body.date,10);
   if(!name||!dateOk(date))return json({success:false,error:"Holiday name and valid date are required"},400);
   const values={name,date,country_code:clean(body.country_code,2).toUpperCase(),location:clean(body.location,120),paid:body.paid!==false,recurring:body.recurring===true,status:body.status==="cancelled"?"cancelled":"active"};
   let record;
   if(body.id){record=await base44.asServiceRole.entities.Holiday.get(clean(body.id,100));if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Holiday not found"},404);record=await base44.asServiceRole.entities.Holiday.update(record.id,values)}
   else record=await base44.asServiceRole.entities.Holiday.create({tenant_id:tenantId,...values});
   await audit(body.id?"holiday.updated":"holiday.created","Holiday",record.id,{date});
   return json({success:true,data:record},body.id?200:201);
  }
  if(operation==="set_status"){
   const type=clean(body.resource_type,30),id=clean(body.id,100);
   const mapping:any={department:["Department","archived"],designation:["Designation","archived"],holiday:["Holiday","cancelled"]};
   if(!mapping[type])return json({success:false,error:"Invalid resource type"},400);
   const [entity,status]=mapping[type],record=await base44.asServiceRole.entities[entity].get(id).catch(()=>null);
   if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Record not found"},404);
   const updated=await base44.asServiceRole.entities[entity].update(id,{status});
   await audit(`${type}.${status.toLowerCase()}`,entity,id);
   return json({success:true,data:updated});
  }
  return json({success:false,error:"Unsupported operation"},400);
 }catch(error){console.error("organization-ops",requestId,error);return json({success:false,error:"Internal server error",request_id:requestId},500)}
});
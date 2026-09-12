import {createClientFromRequest} from "npm:@base44/sdk";
const HR=new Set(["platform_admin","tenant_admin","hr_manager"]);
const clean=(v:unknown,max=3000)=>typeof v==="string"?v.trim().slice(0,max):"";
const json=(body:unknown,status=200)=>Response.json(body,{status});
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v);
Deno.serve(async(req)=>{
 const base44=createClientFromRequest(req),requestId=crypto.randomUUID();
 try{
  const user=await base44.auth.me();if(!user)return json({success:false,error:"Unauthorized"},401);
  if(["suspended","offboarded"].includes(user.employment_status))return json({success:false,error:"Account disabled"},403);
  const body=await req.json().catch(()=>({})),platform=user.role==="admin"||user.app_role==="platform_admin";
  const tenantId=platform?clean(body.tenant_id,100)||clean(user.tenant_id,100):clean(user.tenant_id,100);
  if(!tenantId)return json({success:false,error:"Tenant required"},400);
  if(!platform&&body.tenant_id&&body.tenant_id!==tenantId)return json({success:false,error:"Cross-tenant access denied"},403);
  const isHr=platform||HR.has(clean(user.app_role,50)),operation=clean(body.operation,50);
  const employees=await base44.asServiceRole.entities.Employee.filter({tenant_id:tenantId},"full_name",500),self=employees.find((e:any)=>e.user_id===user.id)||employees.find((e:any)=>String(e.email).toLowerCase()===String(user.email).toLowerCase()),byId=Object.fromEntries(employees.map((e:any)=>[e.id,e]));
  const audit=(action:string,type:string,id:string,metadata:Record<string,unknown>={})=>base44.asServiceRole.entities.AuditLog.create({tenant_id:tenantId,actor_user_id:user.id,actor_email:user.email,action,resource_type:type,resource_id:id,request_id:requestId,metadata,occurred_at:new Date().toISOString()});
  if(operation==="list"){
   const [courses,enrollments,skills]=await Promise.all([base44.asServiceRole.entities.TrainingCourse.filter({tenant_id:tenantId},"-start_date",500),base44.asServiceRole.entities.TrainingEnrollment.filter({tenant_id:tenantId},"-enrolled_at",500),base44.asServiceRole.entities.EmployeeSkill.filter({tenant_id:tenantId},"-verified_at",500)]);
   const visibleEnrollments=isHr?enrollments:enrollments.filter((x:any)=>x.employee_id===self?.id),visibleSkills=isHr?skills:skills.filter((x:any)=>x.employee_id===self?.id);
   return json({success:true,data:{courses:courses.filter((x:any)=>isHr||x.status!=="draft"),enrollments:visibleEnrollments.map((x:any)=>({...x,employee:byId[x.employee_id]||null})),skills:visibleSkills.map((x:any)=>({...x,employee:byId[x.employee_id]||null})),employees:isHr?employees.map((e:any)=>({id:e.id,full_name:e.full_name})):[]},can_manage:isHr,self_employee_id:self?.id||""});
  }
  if(!isHr&&operation!=="self_enroll")return json({success:false,error:"HR access required"},403);
  if(operation==="save_course"){
   const id=clean(body.id,100),title=clean(body.title,180),mode=clean(body.delivery_mode,30),start=clean(body.start_date,10),end=clean(body.end_date,10),currency=clean(body.currency,3).toUpperCase(),capacity=Number(body.capacity||0),cost=Number(body.cost_minor||0);
   if(!title||!["in_person","virtual","self_paced","hybrid"].includes(mode)||!dateOk(start)||!dateOk(end)||end<start||!/^[A-Z]{3}$/.test(currency)||!Number.isInteger(capacity)||capacity<0||!Number.isInteger(cost)||cost<0)return json({success:false,error:"Complete valid course details are required"},400);
   const status=["draft","open","in_progress","completed","cancelled"].includes(body.status)?body.status:"draft";
   const values={title,description:clean(body.description),provider:clean(body.provider,160),delivery_mode:mode,start_date:start,end_date:end,capacity,cost_minor:cost,currency,skill_name:clean(body.skill_name,160),certification_name:clean(body.certification_name,160),certificate_valid_months:Math.max(0,Math.min(120,Number(body.certificate_valid_months||0))),status};
   let record;if(id){record=await base44.asServiceRole.entities.TrainingCourse.get(id).catch(()=>null);if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Course not found"},404);record=await base44.asServiceRole.entities.TrainingCourse.update(id,values)}else record=await base44.asServiceRole.entities.TrainingCourse.create({tenant_id:tenantId,...values});
   await audit(id?"training.course_updated":"training.course_created","TrainingCourse",record.id,{status,cost_minor:cost,currency});return json({success:true,data:record},id?200:201);
  }
  if(operation==="enroll"||operation==="self_enroll"){
   const courseId=clean(body.course_id,100),course=await base44.asServiceRole.entities.TrainingCourse.get(courseId).catch(()=>null),employeeId=operation==="self_enroll"?self?.id:clean(body.employee_id,100);
   if(!course||course.tenant_id!==tenantId)return json({success:false,error:"Course not found"},404);if(course.status!=="open")return json({success:false,error:"Course is not open for enrolment"},409);if(!employeeId||!byId[employeeId])return json({success:false,error:"Employee not found"},404);
   const existing=await base44.asServiceRole.entities.TrainingEnrollment.filter({tenant_id:tenantId,course_id:courseId,employee_id:employeeId},"-created_date",5);if(existing.some((x:any)=>x.status!=="withdrawn"))return json({success:true,data:existing[0],idempotent:true});
   const current=await base44.asServiceRole.entities.TrainingEnrollment.filter({tenant_id:tenantId,course_id:courseId},"-created_date",500);if(course.capacity>0&&current.filter((x:any)=>x.status!=="withdrawn").length>=course.capacity)return json({success:false,error:"Course capacity reached"},409);
   const record=await base44.asServiceRole.entities.TrainingEnrollment.create({tenant_id:tenantId,course_id:courseId,employee_id:employeeId,status:"enrolled",enrolled_by:user.id,enrolled_at:new Date().toISOString(),idempotency_key:clean(body.idempotency_key,120)||crypto.randomUUID()});await audit("training.employee_enrolled","TrainingEnrollment",record.id,{course_id:courseId,employee_id:employeeId});return json({success:true,data:record},201);
  }
  if(operation==="complete_enrollment"){
   const id=clean(body.id,100),record=await base44.asServiceRole.entities.TrainingEnrollment.get(id).catch(()=>null);if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Enrollment not found"},404);if(!["enrolled","in_progress"].includes(record.status))return json({success:false,error:"Enrollment cannot be completed"},409);
   const score=body.score===""||body.score==null?undefined:Number(body.score);if(score!==undefined&&(!Number.isFinite(score)||score<0||score>100))return json({success:false,error:"Score must be between 0 and 100"},400);
   const course=await base44.asServiceRole.entities.TrainingCourse.get(record.course_id),completedAt=new Date(),validMonths=Number(course.certificate_valid_months||0),expiry=validMonths?new Date(Date.UTC(completedAt.getUTCFullYear(),completedAt.getUTCMonth()+validMonths,completedAt.getUTCDate())).toISOString().slice(0,10):"";
   const updated=await base44.asServiceRole.entities.TrainingEnrollment.update(id,{status:"completed",completed_at:completedAt.toISOString(),score,completion_note:clean(body.completion_note),certificate_file_uri:clean(body.certificate_file_uri,2000),certificate_expiry_date:expiry});
   if(course.skill_name){const existing=await base44.asServiceRole.entities.EmployeeSkill.filter({tenant_id:tenantId,employee_id:record.employee_id,skill_name:course.skill_name},"-verified_at",10),values={proficiency:clean(body.proficiency,30)||"intermediate",source:"training",course_id:course.id,certification_name:course.certification_name||"",verified_by:user.id,verified_at:completedAt.toISOString(),expires_at:expiry,status:"active"};if(existing.length)await base44.asServiceRole.entities.EmployeeSkill.update(existing[0].id,values);else await base44.asServiceRole.entities.EmployeeSkill.create({tenant_id:tenantId,employee_id:record.employee_id,skill_name:course.skill_name,...values})}
   await audit("training.completed","TrainingEnrollment",id,{course_id:record.course_id,employee_id:record.employee_id,score});return json({success:true,data:updated});
  }
  if(operation==="set_enrollment_status"){
   const id=clean(body.id,100),status=clean(body.status,30),record=await base44.asServiceRole.entities.TrainingEnrollment.get(id).catch(()=>null);if(!record||record.tenant_id!==tenantId)return json({success:false,error:"Enrollment not found"},404);if(!["in_progress","failed","withdrawn"].includes(status))return json({success:false,error:"Invalid status"},400);const updated=await base44.asServiceRole.entities.TrainingEnrollment.update(id,{status});await audit("training.enrollment_status","TrainingEnrollment",id,{status});return json({success:true,data:updated});
  }
  return json({success:false,error:"Unsupported operation"},400);
 }catch(error){console.error("training-ops",requestId,error);return json({success:false,error:"Internal server error",request_id:requestId},500)}
});
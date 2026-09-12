"use client";
import React,{useCallback,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {base44} from "@/lib/base44";
import {useAuthUserContext} from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";
const unwrap=(r:any)=>r?.data?.success!==undefined?r.data:r;

export default function OnboardingPage(){
 const {user,loading:authLoading}=useAuthUserContext(); const router=useRouter();
 const [records,setRecords]=useState<any[]>([]); const [loading,setLoading]=useState(true);
 const tenantId=user?.tenantId||"";
 useEffect(()=>{if(!authLoading&&!user)router.replace("/auth/signin-basic?redirect=/hrm/onboarding");},[authLoading,user,router]);
 const invoke=useCallback(async(payload:any)=>{const result=unwrap(await base44.functions.invoke("employee-ops",{tenant_id:tenantId,...payload}));if(!result?.success)throw new Error(result?.error||"Operation failed");return result;},[tenantId]);
 const load=useCallback(async()=>{if(!tenantId){setLoading(false);return;}setLoading(true);try{setRecords((await invoke({operation:"list_onboarding"})).data||[]);}catch(e:any){toast.error(e.message);}finally{setLoading(false);}},[tenantId,invoke]);
 useEffect(()=>{void load();},[load]);
 const toggle=async(record:any,task:any)=>{try{await invoke({operation:"update_onboarding_task",onboarding_id:record.id,task_key:task.key,completed:task.status!=="completed"});await load();}catch(e:any){toast.error(e.message);}};
 if(authLoading||!user)return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
 return <NativeHrShell title="Onboarding" subtitle="Track new-hire readiness"><main className="p-5 md:p-8">
  {loading?<p className="py-16 text-center">Loading onboarding…</p>:<div className="grid lg:grid-cols-2 gap-5">
   {records.map(record=>{const tasks=Array.isArray(record.tasks)?record.tasks:[];const done=tasks.filter((t:any)=>t.status==="completed").length;return <article key={record.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5">
    <div className="flex justify-between gap-3"><div><h2 className="font-black">{record.employee?.full_name||"Unknown employee"}</h2><p className="text-sm text-slate-500">{record.employee?.job_title||"New hire"}</p></div><span className="capitalize text-xs px-2 py-1 h-fit rounded-lg bg-blue-50 text-blue-700">{record.status.replaceAll("_"," ")}</span></div>
    <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width:`${tasks.length?Math.round(done/tasks.length*100):0}%`}}/></div>
    <p className="text-xs text-slate-500 mt-2">{done} of {tasks.length} tasks complete</p>
    <div className="mt-4 space-y-2">{tasks.map((task:any)=><label key={task.key} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"><input type="checkbox" checked={task.status==="completed"} onChange={()=>void toggle(record,task)}/><span><strong className="block text-sm">{task.title}</strong><small className="text-slate-500 uppercase">{task.owner}</small></span></label>)}</div>
   </article>;})}
   {!records.length&&<div className="lg:col-span-2 py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">No active onboarding records.</div>}
  </div>}
 </main></NativeHrShell>;
}

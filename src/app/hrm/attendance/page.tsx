"use client";

import { useCallback,useEffect,useMemo,useState } from "react";
import { Clock,LogIn,LogOut,Plus,X } from "lucide-react";
import { useRouter,useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";
import { useAuthUserContext } from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";

const unwrap=(r:any)=>r?.data?.success!==undefined?r.data:r;
const HR=["platform_admin","tenant_admin","hr_manager"];
const fmt=(minutes:number)=>`${Math.floor((minutes||0)/60)}h ${(minutes||0)%60}m`;

export default function AttendancePage(){
 const {user,loading:authLoading}=useAuthUserContext();
 const router=useRouter(),params=useSearchParams();
 const [tab,setTab]=useState(params.get("tab")==="timesheets"?"timesheets":"attendance");
 const [attendance,setAttendance]=useState<any[]>([]),[timesheets,setTimesheets]=useState<any[]>([]);
 const [employees,setEmployees]=useState<any[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState("");
 const [showForm,setShowForm]=useState(false);
 const [form,setForm]=useState({employee_id:"",work_date:new Date().toISOString().slice(0,10),hours:"8",description:"",project_code:""});
 const tenantId=user?.tenantId||"",isHr=!!user&&HR.includes(user.appRole);
 useEffect(()=>{if(!authLoading&&!user)router.replace("/auth/signin-basic?redirect=/hrm/attendance")},[authLoading,user,router]);
 const invoke=useCallback(async(payload:any)=>{const result=unwrap(await base44.functions.invoke("workforce-time-ops",{tenant_id:tenantId,...payload}));if(!result?.success)throw new Error(result?.error||"Time operation failed");return result},[tenantId]);
 const load=useCallback(async()=>{if(!tenantId){setLoading(false);return}setLoading(true);try{
   const [a,t,e]=await Promise.all([invoke({operation:"list_attendance"}),invoke({operation:"list_timesheets"}),isHr?base44.functions.invoke("employee-ops",{operation:"list_employees",tenant_id:tenantId}):Promise.resolve(null)]);
   setAttendance(a.data||[]);setTimesheets(t.data||[]);if(e){const x=unwrap(e);setEmployees(x?.success?x.data||[]:[])}
 }catch(error:any){toast.error(error.message)}finally{setLoading(false)}},[tenantId,isHr,invoke]);
 useEffect(()=>{void load()},[load]);
 const today=useMemo(()=>new Date().toISOString().slice(0,10),[]);
 const mineToday=attendance.find(r=>r.work_date===today&&(!r.clock_out||r.status==="clocked_in"));
 const clock=async(operation:"clock_in"|"clock_out")=>{setBusy(operation);try{await invoke({operation,idempotency_key:`${user?.id}-${operation}-${Date.now()}`});toast.success(operation==="clock_in"?"Clocked in.":"Clocked out.");await load()}catch(e:any){toast.error(e.message)}finally{setBusy("")}};
 const addEntry=async(event:React.FormEvent)=>{event.preventDefault();setBusy("entry");try{await invoke({operation:"save_timesheet",...form,minutes:Math.round(Number(form.hours)*60),idempotency_key:`${user?.id}-timesheet-${crypto.randomUUID()}`});toast.success("Timesheet entry saved.");setShowForm(false);await load()}catch(e:any){toast.error(e.message)}finally{setBusy("")}};
 const transition=async(id:string,operation:string,decision?:string)=>{try{await invoke({operation,timesheet_id:id,decision});toast.success(decision?`Entry ${decision}.`:"Entry submitted.");await load()}catch(e:any){toast.error(e.message)}};
 const correct=async(record:any)=>{const start=window.prompt("Correct clock-in (ISO date/time)",record.clock_in);if(!start)return;const end=window.prompt("Correct clock-out (ISO date/time)",record.clock_out||new Date().toISOString());if(!end)return;const note=window.prompt("Reason for correction")||"";try{await invoke({operation:"correct_attendance",attendance_id:record.id,clock_in:new Date(start).toISOString(),clock_out:new Date(end).toISOString(),note});toast.success("Attendance corrected.");await load()}catch(e:any){toast.error(e.message)}};
 if(authLoading||!user)return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
 return <NativeHrShell title="Attendance & Timesheets" subtitle="Working time, entries and approvals" action={tab==="timesheets"?<button onClick={()=>setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> Add entry</button>:undefined}>
  <main className="p-5 md:p-8">
   <div className="flex flex-wrap justify-between gap-4">
    <div className="flex gap-2">{["attendance","timesheets"].map(v=><button key={v} onClick={()=>setTab(v)} className={`px-4 py-2 rounded-xl font-bold capitalize ${tab===v?"bg-blue-600 text-white":"bg-white dark:bg-slate-900 border"}`}>{v}</button>)}</div>
    {tab==="attendance"&&<button disabled={!!busy} onClick={()=>void clock(mineToday?"clock_out":"clock_in")} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold ${mineToday?"bg-red-600":"bg-emerald-600"}`}>{mineToday?<><LogOut size={17}/> Clock out</>:<><LogIn size={17}/> Clock in</>}</button>}
   </div>
   {loading?<p className="py-16 text-center text-slate-500">Loading time records…</p>:tab==="attendance"?<AttendanceList records={attendance} isHr={isHr} onCorrect={correct}/>:<TimesheetList records={timesheets} onTransition={transition}/>}
  </main>
  {showForm&&<div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4"><form onSubmit={addEntry} className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6">
   <div className="flex justify-between"><h2 className="text-xl font-black">Timesheet Entry</h2><button type="button" onClick={()=>setShowForm(false)}><X/></button></div>
   <div className="grid sm:grid-cols-2 gap-4 mt-6">
    {isHr&&<label className="sm:col-span-2 text-sm font-bold">Employee<select required value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.full_name}</option>)}</select></label>}
    <label className="text-sm font-bold">Work date<input required type="date" value={form.work_date} onChange={e=>setForm({...form,work_date:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
    <label className="text-sm font-bold">Hours<input required type="number" min=".25" max="24" step=".25" value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
    <label className="sm:col-span-2 text-sm font-bold">Description<textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="block w-full h-24 mt-1 p-3 border rounded-xl bg-transparent"/></label>
    <label className="sm:col-span-2 text-sm font-bold">Project or cost code (optional)<input value={form.project_code} onChange={e=>setForm({...form,project_code:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
   </div><button disabled={busy==="entry"} className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Save draft</button>
  </form></div>}
 </NativeHrShell>
}
function AttendanceList({records,isHr,onCorrect}:any){return <div className="grid lg:grid-cols-2 gap-4 mt-6">{records.map((r:any)=><article key={r.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5"><div className="flex justify-between"><div><h2 className="font-black">{r.employee?.full_name||"Employee"}</h2><p className="text-sm text-slate-500">{r.work_date}</p></div><span className="text-xs font-bold capitalize">{r.status?.replaceAll("_"," ")}</span></div><p className="flex items-center gap-2 mt-4 text-sm"><Clock size={16}/>{new Date(r.clock_in).toLocaleTimeString()} → {r.clock_out?new Date(r.clock_out).toLocaleTimeString():"Active"} · {fmt(r.worked_minutes)}</p>{isHr&&r.clock_out&&<button onClick={()=>void onCorrect(r)} className="mt-4 px-3 py-2 border rounded-xl text-xs font-bold">Correct</button>}</article>)}{!records.length&&<Empty text="No attendance records."/ >}</div>}
function TimesheetList({records,onTransition}:any){return <div className="grid lg:grid-cols-2 gap-4 mt-6">{records.map((r:any)=><article key={r.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5"><div className="flex justify-between"><div><h2 className="font-black">{r.employee?.full_name||"Employee"}</h2><p className="text-sm text-slate-500">{r.work_date} · {fmt(r.minutes)}</p></div><span className="text-xs font-bold capitalize">{r.status}</span></div><p className="mt-3 text-sm">{r.description}</p>{r.project_code&&<p className="mt-1 text-xs text-slate-500">Code: {r.project_code}</p>}<div className="flex gap-2 mt-4">{r.can_submit&&<button onClick={()=>void onTransition(r.id,"submit_timesheet")} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Submit</button>}{r.can_review&&<><button onClick={()=>void onTransition(r.id,"decide_timesheet","approved")} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">Approve</button><button onClick={()=>void onTransition(r.id,"decide_timesheet","rejected")} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Reject</button></>}</div></article>)}{!records.length&&<Empty text="No timesheet entries."/ >}</div>}
function Empty({text}:{text:string}){return <div className="lg:col-span-2 py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">{text}</div>}

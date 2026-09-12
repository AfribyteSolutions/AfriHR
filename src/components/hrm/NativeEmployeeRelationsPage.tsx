"use client";
import {useCallback,useEffect,useState} from "react";
import {AlertTriangle,ArrowRightLeft,BadgeCheck,DoorOpen,Plus,UserX,X} from "lucide-react";
import {useRouter,useSearchParams} from "next/navigation";
import {toast} from "sonner";
import {base44} from "@/lib/base44";
import {useAuthUserContext} from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";
const unwrap=(r:any)=>r?.data?.success!==undefined?r.data:r;
const tabs:any={warning:{label:"Warnings",icon:AlertTriangle},promotion:{label:"Promotions",icon:BadgeCheck},transfer:{label:"Transfers",icon:ArrowRightLeft},resignation:{label:"Resignations",icon:DoorOpen},termination:{label:"Terminations",icon:UserX}};
const blank=(type:string)=>({action_type:type,employee_id:"",title:"",reason:"",effective_date:new Date().toISOString().slice(0,10),severity:"written",to_job_title:"",to_department:""});
export default function NativeEmployeeRelationsPage({initialTab="warning"}:{initialTab?:string}){
 const {user,loading:authLoading}=useAuthUserContext(),router=useRouter(),params=useSearchParams();
 const requested=params.get("tab")||initialTab,[tab,setTab]=useState(tabs[requested]?requested:"warning"),[records,setRecords]=useState<any[]>([]),[employees,setEmployees]=useState<any[]>([]);
 const [canManage,setCanManage]=useState(false),[selfId,setSelfId]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[open,setOpen]=useState(false),[form,setForm]=useState<any>(blank("warning"));
 const tenantId=user?.tenantId||"";
 useEffect(()=>{if(!authLoading&&!user)router.replace("/auth/signin-basic?redirect=/hrm/employee-relations")},[authLoading,user,router]);
 const invoke=useCallback(async(payload:any)=>{const r=unwrap(await base44.functions.invoke("employee-relations-ops",{tenant_id:tenantId,...payload}));if(!r?.success)throw new Error(r?.error||"Employee relations operation failed");return r},[tenantId]);
 const load=useCallback(async()=>{if(!tenantId){setLoading(false);return}setLoading(true);try{const r=await invoke({operation:"list"});setRecords(r.data||[]);setEmployees(r.employees||[]);setCanManage(!!r.can_manage);setSelfId(r.self_employee_id||"")}catch(e:any){toast.error(e.message)}finally{setLoading(false)}},[tenantId,invoke]);
 useEffect(()=>{void load()},[load]);
 const visible=records.filter(r=>r.action_type===tab),canAdd=canManage||(tab==="resignation"&&!!selfId);
 const changeTab=(value:string)=>{setTab(value);setOpen(false)};
 const begin=()=>{setForm(blank(tab));setOpen(true)};
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);try{await invoke({operation:"create",...form,idempotency_key:`${user?.id}-${tab}-${crypto.randomUUID()}`});toast.success(tab==="warning"?"Warning issued.":"Action submitted for approval.");setOpen(false);await load()}catch(e:any){toast.error(e.message)}finally{setBusy(false)}};
 const decide=async(record:any,decision:string)=>{try{const r=await invoke({operation:"decide",id:record.id,decision,review_note:prompt("Review note (optional)")||""});toast.success(`Action ${decision}.${r.offboarding_id?" Offboarding started.":""}`);await load()}catch(e:any){toast.error(e.message)}};
 const acknowledge=async(id:string)=>{try{await invoke({operation:"acknowledge",id});toast.success("Warning acknowledged.");await load()}catch(e:any){toast.error(e.message)}};
 if(authLoading||!user)return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
 return <NativeHrShell title="Employee Relations" subtitle="Documented people decisions with controlled lifecycle effects" action={canAdd?<button onClick={begin} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/>{tab==="resignation"&&!canManage?"Submit resignation":`Add ${tabs[tab].label.slice(0,-1)}`}</button>:undefined}>
  <main className="p-5 md:p-8 max-w-7xl mx-auto">
   <div className="flex gap-2 overflow-x-auto">{Object.entries(tabs).map(([key,value]:any)=>{const Icon=value.icon;return <button key={key} onClick={()=>changeTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab===key?"bg-blue-600 text-white":"bg-white dark:bg-slate-900 border"}`}><Icon size={16}/>{value.label}</button>})}</div>
   {loading?<p className="py-16 text-center text-slate-500">Loading employee actions…</p>:<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">{visible.map((r:any)=><article key={r.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5">
    <div className="flex justify-between gap-3"><div><h2 className="font-black">{r.employee?.full_name||"Employee"}</h2><p className="text-xs text-slate-500">{r.title} · Effective {r.effective_date}</p></div><Status value={r.status}/></div>
    <p className="mt-3 text-sm">{r.reason}</p>
    {r.severity&&<p className="mt-2 text-xs uppercase font-bold text-amber-600">{r.severity} warning</p>}
    {r.to_job_title&&<p className="mt-2 text-xs text-slate-500">{r.from_job_title||"Unassigned"} → {r.to_job_title}</p>}
    {r.to_department&&<p className="mt-2 text-xs text-slate-500">{r.from_department||"Unassigned"} → {r.to_department}</p>}
    <div className="flex flex-wrap gap-2 mt-4">
     {canManage&&r.status==="pending"&&<><button onClick={()=>void decide(r,"approved")} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Approve</button><button onClick={()=>void decide(r,"rejected")} className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Reject</button></>}
     {tab==="warning"&&r.employee_id===selfId&&r.status==="approved"&&<button onClick={()=>void acknowledge(r.id)} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Acknowledge receipt</button>}
     {r.offboarding_id&&<button onClick={()=>router.push("/hrm/offboarding")} className="px-3 py-2 border rounded-xl text-xs font-bold">Open offboarding</button>}
    </div>
   </article>)}{!visible.length&&<div className="md:col-span-2 xl:col-span-3 py-16 text-center border border-dashed rounded-2xl text-slate-500">No {tabs[tab].label.toLowerCase()} yet.</div>}</div>}
  </main>
  {open&&<div className="fixed inset-0 z-40 bg-slate-950/60 grid place-items-center p-4"><form onSubmit={save} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-auto">
   <div className="flex justify-between"><h2 className="text-xl font-black">{tab==="resignation"&&!canManage?"Submit resignation":`New ${tabs[tab].label.slice(0,-1)}`}</h2><button type="button" onClick={()=>setOpen(false)}><X/></button></div>
   <div className="grid sm:grid-cols-2 gap-4 mt-6">
    {canManage&&<label className="sm:col-span-2 text-sm font-bold">Employee<select required value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">Select employee</option>{employees.filter((x:any)=>x.lifecycle_stage!=="offboarded").map((x:any)=><option key={x.id} value={x.id}>{x.full_name}</option>)}</select></label>}
    <Field label="Title" value={form.title} required={false} set={(v:string)=>setForm({...form,title:v})}/><Field label={["resignation","termination"].includes(tab)?"Last working date":"Effective date"} type="date" value={form.effective_date} set={(v:string)=>setForm({...form,effective_date:v})}/>
    {tab==="warning"&&<label className="sm:col-span-2 text-sm font-bold">Severity<select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent">{["verbal","written","final"].map(x=><option key={x}>{x}</option>)}</select></label>}
    {tab==="promotion"&&<Field label="New job title" value={form.to_job_title} set={(v:string)=>setForm({...form,to_job_title:v})}/>}
    {tab==="transfer"&&<Field label="New department" value={form.to_department} set={(v:string)=>setForm({...form,to_department:v})}/>}
    <Area label="Reason and supporting context" value={form.reason} set={(v:string)=>setForm({...form,reason:v})}/>
   </div>{tab==="termination"&&<p className="mt-4 text-xs text-amber-600">A termination must be approved by a different HR administrator before offboarding starts.</p>}<button disabled={busy} className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold">{busy?"Saving…":"Submit"}</button>
  </form></div>}
 </NativeHrShell>
}
function Field({label,value,set,required=true,...props}:any){return <label className="text-sm font-bold">{label}<input required={required} value={value||""} onChange={e=>set(e.target.value)} {...props} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>}
function Area({label,value,set}:any){return <label className="sm:col-span-2 text-sm font-bold">{label}<textarea required value={value||""} onChange={e=>set(e.target.value)} className="block w-full h-28 mt-1 p-3 border rounded-xl bg-transparent"/></label>}
function Status({value}:any){const tone=["approved","acknowledged"].includes(value)?"text-emerald-600":["rejected","cancelled"].includes(value)?"text-red-600":"text-amber-600";return <span className={`text-xs font-bold capitalize ${tone}`}>{value}</span>}

"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {Banknote,CalendarClock,Clock3,Plus,X} from "lucide-react";
import {useRouter,useSearchParams} from "next/navigation";
import {toast} from "sonner";
import {base44} from "@/lib/base44";
import {useAuthUserContext} from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";

const unwrap=(r:any)=>r?.data?.success!==undefined?r.data:r;
const tabs:any={schedules:{label:"Schedules",icon:CalendarClock,type:"schedule"},overtime:{label:"Overtime",icon:Clock3,type:"overtime"},loans:{label:"Employee Loans",icon:Banknote,type:"loan"}};
const blank:any={
 schedule:{name:"",department_id:"",employee_id:"",timezone:"Africa/Douala",days:["mon","tue","wed","thu","fri"],start_time:"08:00",end_time:"17:00",break_minutes:"60",effective_from:new Date().toISOString().slice(0,10),effective_to:"",status:"active"},
 overtime:{work_date:new Date().toISOString().slice(0,10),hours:"1",reason:""},
 loan:{loan_type:"salary_advance",amount:"",currency:"XAF",term_months:"1",reason:""}
};
const cash=(minor:number,currency:string)=>new Intl.NumberFormat(undefined,{style:"currency",currency:currency||"XAF",maximumFractionDigits:2}).format((minor||0)/100);
export default function NativeWorkforceOperationsPage({initialTab="schedules"}:{initialTab?:string}){
 const {user,loading:authLoading}=useAuthUserContext(),router=useRouter(),params=useSearchParams();
 const requested=params.get("tab")||initialTab,[tab,setTab]=useState(tabs[requested]?requested:"schedules");
 const [data,setData]=useState<any>({schedules:[],overtime:[],loans:[],employees:[],departments:[]}),[permissions,setPermissions]=useState<any>({}),[selfId,setSelfId]=useState("");
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[open,setOpen]=useState(false),[form,setForm]=useState<any>({...blank.schedule});
 const tenantId=user?.tenantId||"",type=tabs[tab].type;
 useEffect(()=>{if(!authLoading&&!user)router.replace("/auth/signin-basic?redirect=/hrm/workforce-operations")},[authLoading,user,router]);
 const invoke=useCallback(async(payload:any)=>{const r=unwrap(await base44.functions.invoke("workforce-admin-ops",{tenant_id:tenantId,...payload}));if(!r?.success)throw new Error(r?.error||"Workforce operation failed");return r},[tenantId]);
 const load=useCallback(async()=>{if(!tenantId){setLoading(false);return}setLoading(true);try{const r=await invoke({operation:"list"});setData(r.data);setPermissions(r.permissions||{});setSelfId(r.self_employee_id||"")}catch(e:any){toast.error(e.message)}finally{setLoading(false)}},[tenantId,invoke]);
 useEffect(()=>{void load()},[load]);
 const names=useMemo(()=>Object.fromEntries(data.employees.map((e:any)=>[e.id,e.full_name])),[data.employees]);
 const canAdd=type==="schedule"?permissions.manage_schedules:!!selfId;
 const begin=(record?:any)=>{setForm(record?{...record,break_minutes:String(record.break_minutes)}:{...blank[type],days:type==="schedule"?[...blank.schedule.days]:undefined});setOpen(true)};
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);try{
  if(type==="schedule")await invoke({operation:"save_schedule",...form,break_minutes:Number(form.break_minutes)});
  if(type==="overtime")await invoke({operation:"request_overtime",work_date:form.work_date,minutes:Math.round(Number(form.hours)*60),reason:form.reason,idempotency_key:`${user?.id}-ot-${crypto.randomUUID()}`});
  if(type==="loan")await invoke({operation:"request_loan",loan_type:form.loan_type,amount_minor:Math.round(Number(form.amount)*100),currency:form.currency,term_months:Number(form.term_months),reason:form.reason,idempotency_key:`${user?.id}-loan-${crypto.randomUUID()}`});
  toast.success(type==="schedule"?"Schedule saved.":"Request submitted.");setOpen(false);await load()
 }catch(e:any){toast.error(e.message)}finally{setBusy(false)}};
 const decide=async(record:any,decision:string)=>{try{
  if(type==="overtime")await invoke({operation:"decide_overtime",id:record.id,decision,review_note:prompt("Review note (optional)")||""});
  else {let extra:any={};if(decision==="approved"){const approved=prompt("Approved amount",String((record.amount_minor||0)/100));if(!approved)return;const monthly=prompt("Monthly deduction",String(Number(approved)/record.term_months));if(!monthly)return;const first=prompt("First deduction date (YYYY-MM-DD)",new Date().toISOString().slice(0,10));if(!first)return;extra={approved_amount_minor:Math.round(Number(approved)*100),monthly_deduction_minor:Math.round(Number(monthly)*100),first_deduction_date:first}}await invoke({operation:"decide_loan",id:record.id,decision,review_note:prompt("Review note (optional)")||"",...extra})}
  toast.success(`Request ${decision}.`);await load()
 }catch(e:any){toast.error(e.message)}};
 if(authLoading||!user)return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
 const records=data[tab]||[];
 return <NativeHrShell title="Workforce Operations" subtitle="Schedules, overtime and employee lending" action={canAdd?<button onClick={()=>begin()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/>{type==="schedule"?"Add schedule":type==="overtime"?"Request overtime":"Request loan"}</button>:undefined}>
  <main className="p-5 md:p-8 max-w-7xl mx-auto">
   <div className="flex gap-2 overflow-x-auto">{Object.entries(tabs).map(([key,value]:any)=>{const Icon=value.icon;return <button key={key} onClick={()=>setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab===key?"bg-blue-600 text-white":"bg-white dark:bg-slate-900 border"}`}><Icon size={16}/>{value.label}</button>})}</div>
   {loading?<p className="py-16 text-center text-slate-500">Loading workforce records…</p>:<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">{records.map((r:any)=><article key={r.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5">
    <div className="flex justify-between gap-3"><div><h2 className="font-black">{type==="schedule"?r.name:(r.employee?.full_name||names[r.employee_id]||"Employee")}</h2><p className="text-xs text-slate-500">{type==="schedule"?`${r.start_time}–${r.end_time} · ${r.timezone}`:type==="overtime"?`${r.work_date} · ${Math.round(r.minutes/60*10)/10} hours`:cash(r.amount_minor,r.currency)}</p></div><Status value={r.status}/></div>
    {type==="schedule"&&<><p className="mt-3 text-sm uppercase">{(r.days||[]).join(" · ")}</p><p className="text-xs text-slate-500 mt-1">{r.employee_id?`Assigned to ${names[r.employee_id]||"employee"}`:"General schedule"} · from {r.effective_from}{r.effective_to?` to ${r.effective_to}`:""}</p></>}
    {type==="overtime"&&<p className="mt-3 text-sm">{r.reason}</p>}
    {type==="loan"&&<><p className="mt-3 text-sm capitalize">{String(r.loan_type).replaceAll("_"," ")} · {r.term_months} month term</p><p className="text-xs text-slate-500 mt-1">{r.reason}{r.outstanding_minor!=null?` · Outstanding ${cash(r.outstanding_minor,r.currency)}`:""}</p></>}
    <div className="flex gap-2 mt-4">
     {type==="schedule"&&permissions.manage_schedules&&<button onClick={()=>begin(r)} className="px-3 py-2 border rounded-xl text-xs font-bold">Edit</button>}
     {type==="overtime"&&permissions.review_overtime&&r.status==="pending"&&<><button onClick={()=>void decide(r,"approved")} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Approve</button><button onClick={()=>void decide(r,"rejected")} className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Reject</button></>}
     {type==="loan"&&permissions.review_loans&&r.status==="pending"&&<><button onClick={()=>void decide(r,"approved")} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Approve</button><button onClick={()=>void decide(r,"rejected")} className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Reject</button></>}
    </div>
   </article>)}{!records.length&&<div className="md:col-span-2 xl:col-span-3 py-16 text-center border border-dashed rounded-2xl text-slate-500">No {tabs[tab].label.toLowerCase()} yet.</div>}</div>}
  </main>
  {open&&<div className="fixed inset-0 z-40 bg-slate-950/60 grid place-items-center p-4"><form onSubmit={save} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-auto">
   <div className="flex justify-between"><h2 className="text-xl font-black">{form.id?"Edit schedule":type==="schedule"?"New schedule":type==="overtime"?"Overtime request":"Loan request"}</h2><button type="button" onClick={()=>setOpen(false)}><X/></button></div>
   <div className="grid sm:grid-cols-2 gap-4 mt-6">
    {type==="schedule"&&<ScheduleForm form={form} setForm={setForm} data={data}/>}
    {type==="overtime"&&<><Field label="Work date" type="date" value={form.work_date} set={(v:string)=>setForm({...form,work_date:v})}/><Field label="Hours" type="number" min=".25" step=".25" value={form.hours} set={(v:string)=>setForm({...form,hours:v})}/><Area label="Business reason" value={form.reason} set={(v:string)=>setForm({...form,reason:v})}/></>}
    {type==="loan"&&<><label className="text-sm font-bold">Loan type<select value={form.loan_type} onChange={e=>setForm({...form,loan_type:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent">{["salary_advance","personal","emergency","equipment","other"].map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label><Field label="Amount" type="number" min=".01" step=".01" value={form.amount} set={(v:string)=>setForm({...form,amount:v})}/><Field label="Currency" value={form.currency} maxLength={3} set={(v:string)=>setForm({...form,currency:v.toUpperCase()})}/><Field label="Term (months)" type="number" min="1" max="60" value={form.term_months} set={(v:string)=>setForm({...form,term_months:v})}/><Area label="Reason" value={form.reason} set={(v:string)=>setForm({...form,reason:v})}/></>}
   </div><button disabled={busy} className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold">{busy?"Saving…":type==="schedule"?"Save schedule":"Submit request"}</button>
  </form></div>}
 </NativeHrShell>
}
function ScheduleForm({form,setForm,data}:any){const days=["mon","tue","wed","thu","fri","sat","sun"];return <><Field label="Schedule name" value={form.name} set={(v:string)=>setForm({...form,name:v})}/><Field label="Timezone" value={form.timezone} set={(v:string)=>setForm({...form,timezone:v})}/><label className="text-sm font-bold">Employee<select value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">General schedule</option>{data.employees.map((x:any)=><option key={x.id} value={x.id}>{x.full_name}</option>)}</select></label><label className="text-sm font-bold">Department<select value={form.department_id} onChange={e=>setForm({...form,department_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">All departments</option>{data.departments.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><Field label="Start time" type="time" value={form.start_time} set={(v:string)=>setForm({...form,start_time:v})}/><Field label="End time" type="time" value={form.end_time} set={(v:string)=>setForm({...form,end_time:v})}/><Field label="Break minutes" type="number" min="0" max="240" value={form.break_minutes} set={(v:string)=>setForm({...form,break_minutes:v})}/><Field label="Effective from" type="date" value={form.effective_from} set={(v:string)=>setForm({...form,effective_from:v})}/><Field label="Effective to (optional)" type="date" value={form.effective_to} required={false} set={(v:string)=>setForm({...form,effective_to:v})}/><div className="sm:col-span-2"><p className="text-sm font-bold mb-2">Working days</p><div className="flex flex-wrap gap-2">{days.map(d=><label key={d} className="flex gap-2 items-center px-3 py-2 border rounded-xl text-sm uppercase"><input type="checkbox" checked={form.days.includes(d)} onChange={e=>setForm({...form,days:e.target.checked?[...form.days,d]:form.days.filter((x:string)=>x!==d)})}/>{d}</label>)}</div></div></>}
function Field({label,value,set,required=true,...props}:any){return <label className="text-sm font-bold">{label}<input required={required} value={value||""} onChange={e=>set(e.target.value)} {...props} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>}
function Area({label,value,set}:any){return <label className="sm:col-span-2 text-sm font-bold">{label}<textarea required value={value||""} onChange={e=>set(e.target.value)} className="block w-full h-24 mt-1 p-3 border rounded-xl bg-transparent"/></label>}
function Status({value}:any){const tone=["approved","active"].includes(value)?"text-emerald-600":["rejected","cancelled"].includes(value)?"text-red-600":"text-amber-600";return <span className={`text-xs font-bold capitalize ${tone}`}>{String(value).replaceAll("_"," ")}</span>}

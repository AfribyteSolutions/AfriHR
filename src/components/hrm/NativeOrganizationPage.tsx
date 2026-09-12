"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {Building2,CalendarDays,Plus,Tag,X} from "lucide-react";
import {useRouter,useSearchParams} from "next/navigation";
import {toast} from "sonner";
import {base44} from "@/lib/base44";
import {useAuthUserContext} from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";

const unwrap=(r:any)=>r?.data?.success!==undefined?r.data:r;
const empty:any={department:{name:"",code:"",description:"",manager_employee_id:"",cost_center_code:"",status:"active"},designation:{title:"",code:"",department_id:"",level:"",description:"",status:"active"},holiday:{name:"",date:"",country_code:"CM",location:"",paid:true,recurring:false,status:"active"}};
const tabs:any={departments:{label:"Departments",icon:Building2,type:"department"},designations:{label:"Designations",icon:Tag,type:"designation"},holidays:{label:"Holidays",icon:CalendarDays,type:"holiday"}};

export default function NativeOrganizationPage({initialTab="departments"}:{initialTab?:string}){
 const {user,loading:authLoading}=useAuthUserContext(),router=useRouter(),params=useSearchParams();
 const requested=params.get("tab")||initialTab;
 const [tab,setTab]=useState(tabs[requested]?requested:"departments"),[data,setData]=useState<any>({departments:[],designations:[],holidays:[],employees:[]});
 const [loading,setLoading]=useState(true),[canManage,setCanManage]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[form,setForm]=useState<any>({...empty.department});
 const tenantId=user?.tenantId||"";
 useEffect(()=>{if(!authLoading&&!user)router.replace("/auth/signin-basic?redirect=/hrm/organization")},[authLoading,user,router]);
 const invoke=useCallback(async(payload:any)=>{const result=unwrap(await base44.functions.invoke("organization-ops",{tenant_id:tenantId,...payload}));if(!result?.success)throw new Error(result?.error||"Organization operation failed");return result},[tenantId]);
 const load=useCallback(async()=>{if(!tenantId){setLoading(false);return}setLoading(true);try{const r=await invoke({operation:"list"});setData(r.data);setCanManage(!!r.can_manage)}catch(e:any){toast.error(e.message)}finally{setLoading(false)}},[tenantId,invoke]);
 useEffect(()=>{void load()},[load]);
 const type=tabs[tab].type,records=data[tab]||[];
 const departmentNames=useMemo(()=>Object.fromEntries((data.departments||[]).map((d:any)=>[d.id,d.name])),[data.departments]);
 const begin=(record?:any)=>{setForm(record?{...record}:{...empty[type]});setOpen(true)};
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);try{await invoke({operation:`save_${type}`,...form});toast.success(`${tabs[tab].label.slice(0,-1)} saved.`);setOpen(false);await load()}catch(e:any){toast.error(e.message)}finally{setBusy(false)}};
 const archive=async(record:any)=>{if(!confirm(`Archive ${record.name||record.title}?`))return;try{await invoke({operation:"set_status",resource_type:type,id:record.id});toast.success("Record archived.");await load()}catch(e:any){toast.error(e.message)}};
 if(authLoading||!user)return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
 return <NativeHrShell title="Organization Setup" subtitle="Departments, roles and work calendars" action={canManage?<button onClick={()=>begin()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> Add {tabs[tab].label.slice(0,-1)}</button>:undefined}>
  <main className="p-5 md:p-8 max-w-7xl mx-auto">
   <div className="flex gap-2 overflow-x-auto">{Object.entries(tabs).map(([key,value]:any)=>{const Icon=value.icon;return <button key={key} onClick={()=>setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${tab===key?"bg-blue-600 text-white":"bg-white dark:bg-slate-900 border"}`}><Icon size={16}/>{value.label}</button>})}</div>
   {loading?<p className="py-16 text-center text-slate-500">Loading organization records…</p>:<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">{records.map((r:any)=><article key={r.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5">
    <div className="flex justify-between gap-3"><div><h2 className="font-black">{r.name||r.title}</h2><p className="text-xs text-slate-500">{r.code||r.date}</p></div><span className={`text-xs font-bold capitalize ${["archived","cancelled"].includes(r.status)?"text-slate-400":"text-emerald-600"}`}>{r.status}</span></div>
    {type==="department"&&<p className="mt-3 text-sm">{r.description||"No description"}{r.cost_center_code&&` · Cost centre ${r.cost_center_code}`}</p>}
    {type==="designation"&&<p className="mt-3 text-sm">{departmentNames[r.department_id]||"No department"}{r.level&&` · ${r.level}`}</p>}
    {type==="holiday"&&<p className="mt-3 text-sm">{r.country_code||"All countries"}{r.location&&` · ${r.location}`} · {r.paid?"Paid":"Unpaid"}{r.recurring?" · Repeats yearly":""}</p>}
    {canManage&&!["archived","cancelled"].includes(r.status)&&<div className="flex gap-2 mt-4"><button onClick={()=>begin(r)} className="px-3 py-2 border rounded-xl text-xs font-bold">Edit</button><button onClick={()=>void archive(r)} className="px-3 py-2 border rounded-xl text-xs font-bold text-red-600">Archive</button></div>}
   </article>)}{!records.length&&<div className="md:col-span-2 xl:col-span-3 py-16 text-center border border-dashed rounded-2xl text-slate-500">No {tabs[tab].label.toLowerCase()} yet.</div>}</div>}
  </main>
  {open&&<div className="fixed inset-0 z-40 bg-slate-950/60 grid place-items-center p-4"><form onSubmit={save} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-auto">
   <div className="flex justify-between"><h2 className="text-xl font-black">{form.id?"Edit":"Add"} {tabs[tab].label.slice(0,-1)}</h2><button type="button" onClick={()=>setOpen(false)}><X/></button></div>
   <div className="grid sm:grid-cols-2 gap-4 mt-6">
    {type==="department"&&<><Field label="Name" value={form.name} set={(v:string)=>setForm({...form,name:v})}/><Field label="Code" value={form.code} set={(v:string)=>setForm({...form,code:v})}/><Field label="Cost centre" value={form.cost_center_code} set={(v:string)=>setForm({...form,cost_center_code:v})} optional/><label className="text-sm font-bold">Manager<select value={form.manager_employee_id} onChange={e=>setForm({...form,manager_employee_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">Unassigned</option>{data.employees.map((x:any)=><option key={x.id} value={x.id}>{x.full_name}</option>)}</select></label><Area label="Description" value={form.description} set={(v:string)=>setForm({...form,description:v})}/></>}
    {type==="designation"&&<><Field label="Title" value={form.title} set={(v:string)=>setForm({...form,title:v})}/><Field label="Code" value={form.code} set={(v:string)=>setForm({...form,code:v})}/><label className="text-sm font-bold">Department<select value={form.department_id} onChange={e=>setForm({...form,department_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">Unassigned</option>{data.departments.filter((x:any)=>x.status==="active").map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><Field label="Level / grade" value={form.level} set={(v:string)=>setForm({...form,level:v})} optional/><Area label="Description" value={form.description} set={(v:string)=>setForm({...form,description:v})}/></>}
    {type==="holiday"&&<><Field label="Holiday name" value={form.name} set={(v:string)=>setForm({...form,name:v})}/><label className="text-sm font-bold">Date<input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label><Field label="Country code" value={form.country_code} set={(v:string)=>setForm({...form,country_code:v})} optional/><Field label="Location" value={form.location} set={(v:string)=>setForm({...form,location:v})} optional/><label className="flex gap-2 items-center text-sm font-bold"><input type="checkbox" checked={form.paid} onChange={e=>setForm({...form,paid:e.target.checked})}/>Paid holiday</label><label className="flex gap-2 items-center text-sm font-bold"><input type="checkbox" checked={form.recurring} onChange={e=>setForm({...form,recurring:e.target.checked})}/>Repeat yearly</label></>}
   </div><button disabled={busy} className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold">{busy?"Saving…":"Save"}</button>
  </form></div>}
 </NativeHrShell>
}
function Field({label,value,set,optional=false}:any){return <label className="text-sm font-bold">{label}<input required={!optional} value={value||""} onChange={e=>set(e.target.value)} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>}
function Area({label,value,set}:any){return <label className="sm:col-span-2 text-sm font-bold">{label}<textarea value={value||""} onChange={e=>set(e.target.value)} className="block w-full h-24 mt-1 p-3 border rounded-xl bg-transparent"/></label>}

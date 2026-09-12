"use client";
import {useCallback,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {base44} from "@/lib/base44";
import {useAuthUserContext} from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";
const unwrap=(r:any)=>r?.data?.success!==undefined?r.data:r;
const HR=["platform_admin","tenant_admin","hr_manager"],today=new Date().toISOString().slice(0,10);
const example=JSON.stringify([{code:"CODE",name:"Verified statutory item",calculation:"percentage",base:"gross",rate_basis_points:0,threshold_minor:0,cap_minor:null}],null,2);
export default function StatutoryRulesPage(){
 const {user,loading:auth}=useAuthUserContext(),router=useRouter(),tenantId=user?.tenantId||"",isHr=!!user&&HR.includes(user.appRole);
 const [rules,setRules]=useState<any[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[form,setForm]=useState({country_code:"CM",currency:"XAF",name:"Cameroon statutory payroll",version:"",effective_from:today,verified_on:today,source_url:"",source_note:"",employee_rules:example,employer_rules:example});
 const invoke=useCallback(async(p:any)=>{const x=unwrap(await base44.functions.invoke("payroll-ops",{tenant_id:tenantId,...p}));if(!x?.success)throw Error(x?.error||"Operation failed");return x},[tenantId]);
 const load=useCallback(async()=>{if(!tenantId||!isHr)return setLoading(false);try{const x=await invoke({operation:"list_statutory_rules"});setRules(x.data||[])}catch(e:any){toast.error(e.message)}finally{setLoading(false)}},[tenantId,isHr,invoke]);
 useEffect(()=>{if(!auth&&(!user||!isHr))router.replace("/payroll/payroll");else void load()},[auth,user,isHr,router,load]);
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);try{await invoke({operation:"save_statutory_rule",...form,employee_rules:JSON.parse(form.employee_rules),employer_rules:JSON.parse(form.employer_rules)});toast.success("Draft rule version saved.");await load()}catch(e:any){toast.error(e instanceof SyntaxError?"Rules must be valid JSON.":e.message)}finally{setBusy(false)}};
 const activate=async(r:any)=>{const confirmation=prompt(`Type ${r.country_code}:${r.version} to activate this legal rule version`);if(!confirmation)return;setBusy(true);try{await invoke({operation:"activate_statutory_rule",rule_set_id:r.id,confirmation});toast.success("Statutory rules activated.");await load()}catch(e:any){toast.error(e.message)}finally{setBusy(false)}};
 if(auth||!user||!isHr)return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
 return <NativeHrShell title="Statutory Payroll Rules" subtitle="Effective-dated legal deductions and employer contributions"><main className="p-5 md:p-8 max-w-6xl mx-auto">
  <div className="p-4 mb-6 rounded-2xl bg-amber-50 text-amber-950 text-sm"><b>Compliance control:</b> enter only rates verified against an official source. Basis points are integers: 100 = 1%, 1,000 = 10%. Money caps and thresholds use minor units; XAF uses whole francs.</div>
  <form onSubmit={save} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 grid md:grid-cols-3 gap-4">
   <Field n="Country code"><input required maxLength={2} value={form.country_code} onChange={e=>setForm({...form,country_code:e.target.value.toUpperCase()})}/></Field><Field n="Currency"><input required maxLength={3} value={form.currency} onChange={e=>setForm({...form,currency:e.target.value.toUpperCase()})}/></Field><Field n="Version"><input required placeholder="e.g. 2026-reviewed" value={form.version} onChange={e=>setForm({...form,version:e.target.value})}/></Field>
   <Field n="Name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field n="Effective from"><input required type="date" value={form.effective_from} onChange={e=>setForm({...form,effective_from:e.target.value})}/></Field><Field n="Verified on"><input required type="date" value={form.verified_on} onChange={e=>setForm({...form,verified_on:e.target.value})}/></Field>
   <label className="md:col-span-3 text-sm font-bold">Official HTTPS source<input required type="url" value={form.source_url} onChange={e=>setForm({...form,source_url:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
   <label className="md:col-span-3 text-sm font-bold">Verification note<textarea value={form.source_note} onChange={e=>setForm({...form,source_note:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
   <label className="md:col-span-1 text-sm font-bold">Employee deductions JSON<textarea value={form.employee_rules} onChange={e=>setForm({...form,employee_rules:e.target.value})} className="block w-full h-64 mt-1 p-3 font-mono text-xs border rounded-xl bg-transparent"/></label>
   <label className="md:col-span-2 text-sm font-bold">Employer contributions JSON<textarea value={form.employer_rules} onChange={e=>setForm({...form,employer_rules:e.target.value})} className="block w-full h-64 mt-1 p-3 font-mono text-xs border rounded-xl bg-transparent"/></label>
   <button disabled={busy} className="md:col-span-3 py-3 rounded-xl bg-blue-600 text-white font-bold">Save as draft</button>
  </form>
  <div className="space-y-3 mt-8">{rules.map(r=><article key={r.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 flex flex-wrap justify-between gap-4"><div><h2 className="font-black">{r.name} · {r.version}</h2><p className="text-sm text-slate-500">{r.country_code}/{r.currency} · effective {r.effective_from} · verified {r.verified_on}</p><a href={r.source_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Open official source</a></div><div className="text-right"><b className="capitalize">{r.status}</b>{r.status==="draft"&&<button disabled={busy} onClick={()=>void activate(r)} className="block mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">Activate</button>}</div></article>)}{!loading&&!rules.length&&<p className="py-12 text-center border-2 border-dashed rounded-2xl text-slate-400">No statutory rule versions.</p>}</div>
 </main></NativeHrShell>
}
function Field({n,children}:{n:string,children:React.ReactNode}){return <label className="text-sm font-bold">{n}<span className="block mt-1 [&>*]:w-full [&>*]:p-3 [&>*]:border [&>*]:rounded-xl [&>*]:bg-transparent">{children}</span></label>}

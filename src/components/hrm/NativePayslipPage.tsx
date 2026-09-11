"use client";
import {useCallback,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Download,Printer} from "lucide-react";
import {toast} from "sonner";
import {base44} from "@/lib/base44";
import {useAuthUserContext} from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";
const ZERO=new Set(["XAF","XOF","UGX","RWF"]);
const cash=(v:number,c:string)=>new Intl.NumberFormat(undefined,{style:"currency",currency:c,maximumFractionDigits:ZERO.has(c)?0:2}).format((v||0)/10**(ZERO.has(c)?0:2));
const unwrap=(r:any)=>r?.data?.success!==undefined?r.data:r;
export default function NativePayslipPage(){
 const {user,loading:auth}=useAuthUserContext(),router=useRouter(),tenantId=user?.tenantId||"",[items,setItems]=useState<any[]>([]),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{if(!tenantId)return setLoading(false);try{const x=unwrap(await base44.functions.invoke("payroll-ops",{operation:"list_my_payslips",tenant_id:tenantId}));if(!x?.success)throw Error(x?.error||"Could not load payslips");setItems(x.data||[])}catch(e:any){toast.error(e.message)}finally{setLoading(false)}},[tenantId]);
 useEffect(()=>{if(!auth&&!user)router.replace("/auth/signin-basic?redirect=/payroll/payroll-payslip");else void load()},[auth,user,router,load]);
 const download=(item:any)=>{const data={source:"AfriHR",employee:item.employee_name,employee_number:item.employee_number,currency:item.currency,period:item.snapshot,gross_minor:item.gross_minor,deductions_minor:item.deductions_total_minor,net_minor:item.net_minor,allowances:item.allowances||[],deductions:item.deductions||[]};const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})),a=document.createElement("a");a.href=u;a.download=`payslip-${item.snapshot?.period_end||item.id}.json`;a.click();URL.revokeObjectURL(u)};
 if(auth||!user)return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
 return <NativeHrShell title="My Payslips" subtitle="Finalized payroll statements"><main className="p-5 md:p-8 max-w-4xl mx-auto">
  {loading?<p className="py-16 text-center">Loading payslips…</p>:<div className="space-y-5">{items.map(i=><article key={i.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-6 print:shadow-none">
   <div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-xl font-black">{i.snapshot?.period_start} — {i.snapshot?.period_end}</h2><p className="text-sm text-slate-500">Pay date {i.snapshot?.pay_date||"—"} · {i.employee_number||"Employee"}</p></div><span className="font-black">{cash(i.net_minor,i.currency)} net</span></div>
   <div className="grid sm:grid-cols-3 gap-4 my-6"><Stat n="Base" v={cash(i.base_minor,i.currency)}/><Stat n="Gross" v={cash(i.gross_minor,i.currency)}/><Stat n="Deductions" v={cash(i.deductions_total_minor,i.currency)}/></div>
   <div className="grid md:grid-cols-2 gap-5"><Lines title="Allowances" lines={i.allowances} currency={i.currency}/><Lines title="Deductions" lines={i.deductions} currency={i.currency}/></div>
   <div className="flex gap-2 mt-6 print:hidden"><button onClick={()=>window.print()} className="px-4 py-2 border rounded-xl font-bold flex gap-2 items-center"><Printer size={16}/> Print</button><button onClick={()=>download(i)} className="px-4 py-2 border rounded-xl font-bold flex gap-2 items-center"><Download size={16}/> Download data</button></div>
  </article>)}{!items.length&&<p className="py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">No finalized payslips yet.</p>}</div>}
 </main></NativeHrShell>
}
function Stat({n,v}:{n:string,v:string}){return <div><small className="text-slate-500">{n}</small><p className="font-black">{v}</p></div>}
function Lines({title,lines=[],currency}:{title:string,lines:any[],currency:string}){return <section><h3 className="font-bold mb-2">{title}</h3>{lines.length?lines.map((x:any,k:number)=><div key={x.code||k} className="flex justify-between py-2 border-b text-sm"><span>{x.name}</span><b>{cash(x.amount_minor,currency)}</b></div>):<p className="text-sm text-slate-400">None</p>}</section>}

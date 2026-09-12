"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {Award,Banknote,BookOpen,CalendarDays,Clock3,FileText,LogOut,Star,UserRound} from "lucide-react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {base44} from "@/lib/base44";
import {useAuthUserContext} from "@/context/UserAuthContext";
const unwrap=(r:any)=>r?.data?.success!==undefined?r.data:r;
const money=(n:number,c="XAF")=>new Intl.NumberFormat(undefined,{style:"currency",currency:c}).format((n||0)/100);
export default function NativeEmployeeHome(){
 const {user,loading:auth}=useAuthUserContext(),router=useRouter(),[loading,setLoading]=useState(true),[data,setData]=useState<any>(null);
 const tenantId=user?.tenantId||"";
 useEffect(()=>{if(!auth&&!user)router.replace("/auth/signin-basic?redirect=/dashboard/employee-dashboard")},[auth,user,router]);
 const load=useCallback(async()=>{if(!tenantId)return;setLoading(true);try{const r=unwrap(await base44.functions.invoke("employee-home",{tenant_id:tenantId}));if(!r?.success)throw new Error(r?.error||"Dashboard failed");setData(r.data)}catch(e:any){toast.error(e.message)}finally{setLoading(false)}},[tenantId]);
 useEffect(()=>{if(tenantId)void load()},[tenantId,load]);
 if(auth||!user)return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
 if(loading)return <div className="min-h-screen grid place-items-center bg-slate-50">Loading your workspace…</div>;
 if(!data)return <div className="min-h-screen grid place-items-center">Employee profile unavailable.</div>;
 const e=data.employee,s=data.summary,attendance=data.attendance_today;
 const shortcuts=[[CalendarDays,"Leave","/hrm/leaves"],[Clock3,"Time & timesheets","/hrm/attendance"],[Banknote,"Payslips","/payroll/payroll-payslip"],[BookOpen,"Learning","/hrm/training"],[Star,"Performance","/hrm/performance"],[FileText,"Documents","/hrm/documents"],[Award,"Employee relations","/hrm/employee-relations"]];
 return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
  <header className="bg-slate-950 text-white px-5 md:px-10 py-6"><div className="max-w-7xl mx-auto flex justify-between items-center gap-4"><div><p className="text-xs text-blue-300 font-bold uppercase tracking-widest">AfriHR · {data.tenant.name}</p><h1 className="text-2xl md:text-3xl font-black mt-1">Welcome, {e.full_name?.split(" ")[0]}</h1><p className="text-sm text-slate-400">{e.job_title||"Employee"}{e.department?" · "+e.department:""}</p></div><button onClick={()=>base44.auth.logout("/auth/signin-basic")} className="p-3 rounded-xl border border-slate-700" title="Sign out"><LogOut size={18}/></button></div></header>
  <main className="max-w-7xl mx-auto p-5 md:p-8">
   <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card icon={Clock3} label="Today" value={attendance?.status==="clocked_in"?"Clocked in":attendance?.clock_out?"Completed":"Not clocked in"} note={attendance?.worked_minutes?Math.round(attendance.worked_minutes/6)/10+" hours":data.today}/>
    <Card icon={CalendarDays} label="Leave" value={s.approved_leave_days+" days"} note={s.pending_leave+" pending requests"}/>
    <Card icon={BookOpen} label="Learning" value={s.open_training} note="active enrolments"/>
    <Card icon={FileText} label="Documents" value={s.documents} note={s.unacknowledged_warnings?s.unacknowledged_warnings+" warning awaiting receipt":"No warning awaiting receipt"}/>
   </section>
   {(s.pending_timesheets>0||data.offboarding)&&<section className="mt-6 space-y-3">{s.pending_timesheets>0&&<Notice tone="amber" text={"You have "+s.pending_timesheets+" draft or rejected timesheet entries to complete."} href="/hrm/attendance?tab=timesheets"/ >}{data.offboarding&&<Notice tone="red" text={"Offboarding is "+String(data.offboarding.status).replaceAll("_"," ")+"; last working date "+data.offboarding.last_working_date+"."} href="/hrm/offboarding"/>}</section>}
   <section className="mt-8"><h2 className="text-lg font-black">Self-service</h2><div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mt-3">{shortcuts.map(([Icon,label,href]:any)=><Link key={href} href={href} className="bg-white dark:bg-slate-900 border rounded-2xl p-4 hover:border-blue-500 transition"><Icon size={20} className="text-blue-600"/><p className="text-sm font-bold mt-3">{label}</p></Link>)}</div></section>
   <section className="grid lg:grid-cols-2 gap-6 mt-8"><Panel title="Upcoming leave"><Rows rows={data.leaves} empty="No leave requests." render={(r:any)=><><b className="capitalize">{r.leave_type} leave</b><span>{r.start_date}–{r.end_date} · {r.status}</span></>}/></Panel><Panel title="My training"><Rows rows={data.training} empty="No training enrolments." render={(r:any)=><><b>{r.course?.title||"Training course"}</b><span className="capitalize">{r.status.replaceAll("_"," ")}{r.score!=null?" · "+r.score+"%":""}</span></>}/></Panel><Panel title="Performance"><Rows rows={data.reviews} empty="No published reviews." render={(r:any)=><><b>{r.period_start}–{r.period_end}</b><span>{r.rating?"Rating "+r.rating+"/5 · ":""}{r.status}</span></>}/></Panel><Panel title="Recent payslips"><Rows rows={data.payslips} empty="No finalized payslips." render={(r:any)=><><b>{money(r.net_minor,r.currency)} net</b><span>{new Date(r.created_date).toLocaleDateString()} · finalized</span></>}/></Panel></section>
   <section className="grid lg:grid-cols-3 gap-6 mt-6"><Panel title="Skills"><Rows rows={data.skills} empty="No verified skills." render={(r:any)=><><b>{r.skill_name}</b><span className="capitalize">{r.proficiency}{r.expires_at?" · expires "+r.expires_at:""}</span></>}/></Panel><Panel title="Loans"><Rows rows={data.loans} empty="No loan records." render={(r:any)=><><b>{money(r.amount_minor,r.currency)}</b><span className="capitalize">{r.loan_type.replaceAll("_"," ")} · {r.status}</span></>}/></Panel><Panel title="My profile"><div className="text-sm space-y-2 mt-3"><p><b>Employee no.</b> {e.employee_number||"—"}</p><p><b>Email</b> {e.email}</p><p><b>Hire date</b> {e.hire_date||"—"}</p><p className="capitalize"><b>Status</b> {e.employment_status}</p></div></Panel></section>
  </main>
 </div>
}
function Card({icon:Icon,label,value,note}:any){return <article className="bg-white dark:bg-slate-900 border rounded-2xl p-5"><Icon size={20} className="text-blue-600"/><p className="text-xs text-slate-500 mt-4">{label}</p><p className="text-2xl font-black mt-1">{value}</p><p className="text-xs text-slate-500 mt-1">{note}</p></article>}
function Panel({title,children}:any){return <article className="bg-white dark:bg-slate-900 border rounded-2xl p-5"><h2 className="font-black">{title}</h2>{children}</article>}
function Rows({rows,empty,render}:any){return <div className="divide-y mt-3">{rows.map((r:any)=><div key={r.id} className="py-3 flex justify-between gap-3 text-sm"><div className="flex flex-col">{render(r)}</div></div>)}{!rows.length&&<p className="py-6 text-sm text-slate-500">{empty}</p>}</div>}
function Notice({tone,text,href}:any){return <Link href={href} className={"block border rounded-2xl p-4 text-sm font-bold "+(tone==="red"?"bg-red-50 border-red-200 text-red-800":"bg-amber-50 border-amber-200 text-amber-800")}>{text}</Link>}

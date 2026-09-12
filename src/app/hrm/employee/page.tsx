"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";
import { useAuthUserContext } from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";

const unwrap = (r: any) => r?.data?.success !== undefined ? r.data : r;
export default function EmployeeDirectory() {
  const { user, loading: authLoading } = useAuthUserContext();
  const router = useRouter();
  const [employees,setEmployees] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [search,setSearch] = useState("");
  const [showForm,setShowForm] = useState(false);
  const [form,setForm] = useState({ full_name:"",email:"",phone:"",department:"",job_title:"",manager_id:"",hire_date:new Date().toISOString().slice(0,10) });
  const [contract,setContract] = useState<File|null>(null);
  const tenantId = user?.tenantId || "";

  useEffect(() => { if (!authLoading && !user) router.replace("/auth/signin-basic?redirect=/hrm/employee"); }, [authLoading,user,router]);
  const invoke = useCallback(async (payload:any) => {
    const result=unwrap(await base44.functions.invoke("employee-ops",{tenant_id:tenantId,...payload}));
    if(!result?.success) throw new Error(result?.error||"Operation failed");
    return result;
  },[tenantId]);
  const load=useCallback(async()=>{ if(!tenantId){setLoading(false);return;} setLoading(true); try{setEmployees((await invoke({operation:"list_employees"})).data||[]);}catch(e:any){toast.error(e.message);}finally{setLoading(false);}},[tenantId,invoke]);
  useEffect(()=>{void load();},[load]);
  const filtered=useMemo(()=>employees.filter(e=>`${e.full_name} ${e.email} ${e.department} ${e.job_title}`.toLowerCase().includes(search.toLowerCase())),[employees,search]);

  const submit=async(e:React.FormEvent)=>{e.preventDefault();try{
    let contract_file_uri="";
    if(contract){ if(contract.size>10*1024*1024) throw new Error("Contract must be smaller than 10 MB"); contract_file_uri=(await base44.integrations.Core.UploadPrivateFile({file:contract})).file_uri; }
    const result=await invoke({operation:"create_employee",...form,contract_file_uri});
    toast.success(result.duplicate?"Employee already exists.":"Employee and onboarding checklist created.");
    setShowForm(false); await load();
  }catch(err:any){toast.error(err.message||"Could not create employee.");}};

  if(authLoading||!user) return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;
  return <NativeHrShell title="Employee Directory" subtitle="Base44-native employee records"
    action={<button onClick={()=>setShowForm(true)} className="flex gap-2 items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> Add employee</button>}>
    <main className="p-5 md:p-8">
      <label className="max-w-lg flex items-center gap-3 bg-white dark:bg-slate-900 border rounded-xl px-4 py-3"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees" className="w-full bg-transparent outline-none"/></label>
      {loading?<p className="py-16 text-center text-slate-500">Loading employees…</p>:<div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {filtered.map(emp=><article key={emp.id} className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 grid place-items-center font-black">{String(emp.full_name||"?").split(" ").map((n:string)=>n[0]).slice(0,2).join("")}</div>
          <h2 className="mt-4 font-black">{emp.full_name}</h2><p className="text-sm text-blue-600">{emp.job_title||"No job title"}</p>
          <p className="text-xs text-slate-500 mt-2">{emp.department||"Unassigned"} · {emp.employee_number||"Pending number"}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs capitalize">{emp.lifecycle_stage}</span>
            <Link href={`/hrm/employee-profile/${emp.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">View profile <ArrowRight size={14}/></Link>
          </div>
        </article>)}
        {!filtered.length&&<div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">No employees found.</div>}
      </div>}
    </main>
    {showForm&&<div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4"><form onSubmit={submit} className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 max-h-[90vh] overflow-auto">
      <div className="flex justify-between"><h2 className="text-xl font-black">Add Employee</h2><button type="button" onClick={()=>setShowForm(false)}><X/></button></div>
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {Object.entries({full_name:"Full name",email:"Email",phone:"Phone",department:"Department",job_title:"Job title",manager_id:"Manager employee ID",hire_date:"Hire date"}).map(([key,label])=><label key={key} className="text-sm font-bold">{label}<input required={["full_name","email","job_title","hire_date"].includes(key)} type={key==="email"?"email":key==="hire_date"?"date":"text"} value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>)}
      </div>
      <label className="block mt-4 p-4 border-2 border-dashed rounded-xl cursor-pointer"><input type="file" className="sr-only" accept=".pdf,.doc,.docx" onChange={e=>setContract(e.target.files?.[0]||null)}/>{contract?.name||"Upload private employment contract (optional)"}</label>
      <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Create employee</button>
    </form></div>}
  </NativeHrShell>;
}

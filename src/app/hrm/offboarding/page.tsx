"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Plus, ShieldAlert, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";
import { useAuthUserContext } from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";

const unwrap = (r: any) => r?.data?.success !== undefined ? r.data : r;
const HR_ROLES = ["platform_admin", "tenant_admin", "hr_manager"];

export default function OffboardingPage() {
  const { user, loading: authLoading } = useAuthUserContext();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: "", offboarding_type: "resignation", last_working_date: "", reason: "" });
  const tenantId = user?.tenantId || "";
  const isHr = !!user && HR_ROLES.includes(user.appRole);

  useEffect(() => { if (!authLoading && !user) router.replace("/auth/signin-basic?redirect=/hrm/offboarding"); }, [authLoading, user, router]);

  const invoke = useCallback(async (payload: any) => {
    const result = unwrap(await base44.functions.invoke("offboarding-ops", { tenant_id: tenantId, ...payload }));
    if (!result?.success) throw new Error(result?.error || "Offboarding operation failed");
    return result;
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [offboardingResult, employeeRaw] = await Promise.all([
        invoke({ operation: "list" }),
        isHr ? base44.functions.invoke("employee-ops", { operation: "list_employees", tenant_id: tenantId }) : Promise.resolve(null)
      ]);
      setRecords(offboardingResult.data || []);
      if (employeeRaw) {
        const result = unwrap(employeeRaw);
        setEmployees(result?.success ? (result.data || []).filter((e: any) => e.lifecycle_stage !== "offboarded") : []);
      }
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  }, [tenantId, isHr, invoke]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return records;
    if (filter === "active") return records.filter(r => !["completed", "cancelled"].includes(r.status));
    return records.filter(r => r.status === filter);
  }, [records, filter]);

  const initiate = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy("initiate");
    try {
      const result = await invoke({ operation: "initiate", ...form });
      toast.success(result.idempotent ? "Existing offboarding record opened." : "Offboarding initiated.");
      setShowForm(false); setForm({ employee_id: "", offboarding_type: "resignation", last_working_date: "", reason: "" });
      await load();
    } catch (error: any) { toast.error(error.message); }
    finally { setBusy(""); }
  };

  const updateTask = async (recordId: string, task: any) => {
    setBusy(task.id);
    try { await invoke({ operation: "update_task", offboarding_id: recordId, task_id: task.id, completed: !task.completed }); await load(); }
    catch (error: any) { toast.error(error.message); }
    finally { setBusy(""); }
  };

  const saveDetails = async (record: any, notes: string, file?: File) => {
    setBusy(`details-${record.id}`);
    try {
      let final_document_uri: string | undefined;
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error("Final document must be 10 MB or smaller");
        final_document_uri = (await base44.integrations.Core.UploadPrivateFile({ file })).file_uri;
      }
      await invoke({ operation: "save_details", offboarding_id: record.id, exit_interview_notes: notes, ...(final_document_uri ? { final_document_uri } : {}) });
      toast.success("Offboarding details saved."); await load();
    } catch (error: any) { toast.error(error.message); }
    finally { setBusy(""); }
  };

  const download = async (id: string) => {
    try { const result = await invoke({ operation: "download_final_document", offboarding_id: id }); window.open(result.data.signed_url, "_blank", "noopener,noreferrer"); }
    catch (error: any) { toast.error(error.message); }
  };

  const cancel = async (record: any) => {
    if (!window.confirm(`Cancel offboarding for ${record.employee?.full_name}? Their previous employment state will be restored.`)) return;
    setBusy(`cancel-${record.id}`);
    try { await invoke({ operation: "cancel", offboarding_id: record.id }); toast.success("Offboarding cancelled."); await load(); }
    catch (error: any) { toast.error(error.message); }
    finally { setBusy(""); }
  };

  const complete = async (record: any) => {
    const expected = record.employee?.employee_number || record.employee?.email;
    const confirmation = window.prompt(`This locks the record and marks the employee offboarded. Enter ${expected} to continue.`);
    if (confirmation === null) return;
    setBusy(`complete-${record.id}`);
    try { await invoke({ operation: "complete", offboarding_id: record.id, confirmation }); toast.success("Employee offboarding completed."); await load(); }
    catch (error: any) { toast.error(error.message); }
    finally { setBusy(""); }
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;

  return <NativeHrShell title="Offboarding" subtitle="Clearance, exit records and final handover"
    action={isHr ? <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> Start offboarding</button> : undefined}>
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap gap-2">
        {["active","all","initiated","in_progress","ready_to_complete","completed","cancelled"].map(v => <button key={v} onClick={() => setFilter(v)}
          className={`px-3 py-2 rounded-xl text-xs font-bold capitalize ${filter === v ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border"}`}>{v.replaceAll("_"," ")}</button>)}
      </div>

      {loading ? <p className="py-16 text-center text-slate-500">Loading offboarding records…</p> :
        <div className="space-y-5 mt-6">
          {filtered.map(record => <OffboardingCard key={record.id} record={record} isHr={isHr} busy={busy}
            onTask={updateTask} onSave={saveDetails} onDownload={download} onCancel={cancel} onComplete={complete}/>)}
          {!filtered.length && <div className="py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">No offboarding records found.</div>}
        </div>}
    </main>

    {showForm && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4">
      <form onSubmit={initiate} className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6">
        <div className="flex justify-between"><h2 className="text-xl font-black">Start Offboarding</h2><button type="button" onClick={() => setShowForm(false)}><X/></button></div>
        <div className="space-y-4 mt-6">
          <label className="block text-sm font-bold">Employee<select required value={form.employee_id} onChange={e => setForm({...form,employee_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">Select employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name} · {e.employee_number || e.email}</option>)}</select></label>
          <label className="block text-sm font-bold">Departure type<select value={form.offboarding_type} onChange={e => setForm({...form,offboarding_type:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent">{["resignation","termination","retirement","contract_end","other"].map(v => <option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select></label>
          <label className="block text-sm font-bold">Last working date<input required type="date" value={form.last_working_date} onChange={e => setForm({...form,last_working_date:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
          <label className="block text-sm font-bold">Reason<textarea required value={form.reason} onChange={e => setForm({...form,reason:e.target.value})} className="block w-full h-24 mt-1 p-3 border rounded-xl bg-transparent"/></label>
        </div>
        <button disabled={busy === "initiate"} className="w-full mt-6 py-3 bg-blue-600 disabled:opacity-50 text-white rounded-xl font-bold">{busy === "initiate" ? "Starting…" : "Start controlled offboarding"}</button>
      </form>
    </div>}
  </NativeHrShell>;
}

function OffboardingCard({ record, isHr, busy, onTask, onSave, onDownload, onCancel, onComplete }: any) {
  const [notes, setNotes] = useState(record.exit_interview_notes || "");
  const [file, setFile] = useState<File | undefined>();
  const required = (record.tasks || []).filter((t: any) => t.required);
  const done = required.filter((t: any) => t.completed).length;
  const progress = required.length ? Math.round(done / required.length * 100) : 0;

  return <article className="bg-white dark:bg-slate-900 border rounded-2xl p-5 md:p-6">
    <div className="flex flex-wrap justify-between gap-3">
      <div><h2 className="text-lg font-black">{record.employee?.full_name || "Employee"}</h2><p className="text-sm text-slate-500 capitalize">{record.offboarding_type?.replaceAll("_"," ")} · Last day {record.last_working_date}</p></div>
      <span className="h-fit px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold capitalize">{record.status?.replaceAll("_"," ")}</span>
    </div>
    {record.reason && <p className="mt-3 text-sm">{record.reason}</p>}
    <div className="mt-5"><div className="flex justify-between text-xs font-bold"><span>Required clearance</span><span>{done}/{required.length}</span></div><div className="h-2 mt-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width:`${progress}%`}}/></div></div>
    <div className="grid md:grid-cols-2 gap-2 mt-5">
      {(record.tasks || []).map((task: any) => <button key={task.id} disabled={!record.can_manage || busy === task.id} onClick={() => void onTask(record.id, task)}
        className={`flex items-center gap-3 text-left p-3 rounded-xl border disabled:cursor-default ${task.completed ? "bg-emerald-50 border-emerald-200 text-emerald-800" : ""}`}>
        <CheckCircle2 size={18} className={task.completed ? "text-emerald-600" : "text-slate-300"}/><span className="text-sm font-semibold">{task.label}{!task.required && " (optional)"}</span>
      </button>)}
    </div>
    {isHr && record.can_manage && <div className="grid md:grid-cols-2 gap-4 mt-5 pt-5 border-t">
      <label className="text-sm font-bold">Exit interview notes<textarea value={notes} onChange={e => setNotes(e.target.value)} className="block w-full h-24 mt-1 p-3 border rounded-xl bg-transparent"/></label>
      <label className="text-sm font-bold">Final document<input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0])} className="block w-full mt-1 p-3 border rounded-xl"/><span className="block mt-2 text-xs text-slate-500">Private file, maximum 10 MB.</span></label>
      <button disabled={busy === `details-${record.id}`} onClick={() => void onSave(record, notes, file)} className="md:col-span-2 flex justify-center items-center gap-2 py-2 rounded-xl border font-bold"><Upload size={16}/> Save details</button>
    </div>}
    <div className="flex flex-wrap gap-2 mt-5">
      {record.can_download && <button onClick={() => void onDownload(record.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold"><Download size={15}/> Final document</button>}
      {record.can_manage && <button disabled={busy === `cancel-${record.id}`} onClick={() => void onCancel(record)} className="px-4 py-2 rounded-xl border text-sm font-bold">Cancel</button>}
      {record.can_complete && <button disabled={busy === `complete-${record.id}`} onClick={() => void onComplete(record)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold"><ShieldAlert size={16}/> Complete permanently</button>}
    </div>
  </article>;
}

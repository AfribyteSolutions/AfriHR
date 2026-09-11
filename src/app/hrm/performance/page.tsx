"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";
import { useAuthUserContext } from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";

const unwrap = (r: any) => r?.data?.success !== undefined ? r.data : r;
const REVIEW_ROLES = ["platform_admin", "tenant_admin", "hr_manager", "manager"];
const HR_ROLES = ["platform_admin", "tenant_admin", "hr_manager"];

export default function PerformancePage() {
  const { user, loading: authLoading } = useAuthUserContext();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: "", period_start: "", period_end: "", goals: "", rating: "3", feedback: "" });
  const tenantId = user?.tenantId || "";
  const canCreate = !!user && REVIEW_ROLES.includes(user.appRole);
  const isHr = !!user && HR_ROLES.includes(user.appRole);

  useEffect(() => { if (!authLoading && !user) router.replace("/auth/signin-basic?redirect=/hrm/performance"); }, [authLoading, user, router]);

  const invoke = useCallback(async (payload: any) => {
    const result = unwrap(await base44.functions.invoke("performance-ops", { tenant_id: tenantId, ...payload }));
    if (!result?.success) throw new Error(result?.error || "Performance operation failed");
    return result;
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [reviewResult, employeeRaw] = await Promise.all([
        invoke({ operation: "list" }),
        canCreate ? base44.functions.invoke("employee-ops", { operation: "list_employees", tenant_id: tenantId }) : Promise.resolve(null)
      ]);
      setReviews(reviewResult.data || []);
      if (employeeRaw) {
        const result = unwrap(employeeRaw);
        setEmployees(result?.success ? result.data || [] : []);
      }
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  }, [tenantId, canCreate, invoke]);

  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => status === "all" ? reviews : reviews.filter(r => r.status === status), [reviews, status]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await invoke({ operation: "create", ...form, goals: form.goals.split("\n").map(v => v.trim()).filter(Boolean), rating: Number(form.rating) });
      toast.success("Review draft created.");
      setShowForm(false);
      setForm({ employee_id: "", period_start: "", period_end: "", goals: "", rating: "3", feedback: "" });
      await load();
    } catch (error: any) { toast.error(error.message); }
  };

  const transition = async (review_id: string, operation: string) => {
    try {
      await invoke({ operation, review_id });
      toast.success(operation === "submit" ? "Review submitted." : operation === "acknowledge" ? "Review acknowledged." : "Review closed.");
      await load();
    } catch (error: any) { toast.error(error.message); }
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;

  return <NativeHrShell title="Performance Reviews" subtitle="Goals, feedback and review cycles"
    action={canCreate ? <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> New review</button> : undefined}>
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap gap-2">
        {["all","draft","submitted","acknowledged","closed"].map(v => <button key={v} onClick={() => setStatus(v)}
          className={`px-3 py-2 rounded-xl text-xs font-bold capitalize ${status === v ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border"}`}>{v}</button>)}
      </div>
      {loading ? <p className="py-16 text-center text-slate-500">Loading reviews…</p> :
        <div className="grid lg:grid-cols-2 gap-4 mt-6">
          {filtered.map(review => <article key={review.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5">
            <div className="flex justify-between gap-3">
              <div><h2 className="font-black">{review.employee?.full_name || "Employee"}</h2><p className="text-sm text-slate-500">{review.period_start} → {review.period_end}</p></div>
              <span className="h-fit px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold capitalize">{review.status}</span>
            </div>
            <div className="flex items-center gap-1 mt-4 text-amber-500">{[1,2,3,4,5].map(n => <Star key={n} size={17} fill={n <= Number(review.rating) ? "currentColor" : "none"}/>)}</div>
            {review.feedback && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{review.feedback}</p>}
            {!!review.goals?.length && <ul className="mt-3 list-disc pl-5 text-sm text-slate-500">{review.goals.map((goal: string, i: number) => <li key={i}>{goal}</li>)}</ul>}
            <div className="flex gap-2 mt-5">
              {review.status === "draft" && canCreate && <button onClick={() => void transition(review.id, "submit")} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">Submit</button>}
              {review.status === "submitted" && <button onClick={() => void transition(review.id, "acknowledge")} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">Acknowledge</button>}
              {review.status === "acknowledged" && isHr && <button onClick={() => void transition(review.id, "close")} className="px-4 py-2 rounded-xl border text-sm font-bold">Close</button>}
            </div>
          </article>)}
          {!filtered.length && <div className="lg:col-span-2 py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">No performance reviews found.</div>}
        </div>}
    </main>
    {showForm && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4">
      <form onSubmit={create} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-6">
        <div className="flex justify-between"><h2 className="text-xl font-black">New Review</h2><button type="button" onClick={() => setShowForm(false)}><X/></button></div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <label className="sm:col-span-2 text-sm font-bold">Employee<select required value={form.employee_id} onChange={e => setForm({...form,employee_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">Select employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></label>
          <label className="text-sm font-bold">Period start<input required type="date" value={form.period_start} onChange={e => setForm({...form,period_start:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
          <label className="text-sm font-bold">Period end<input required type="date" min={form.period_start} value={form.period_end} onChange={e => setForm({...form,period_end:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
          <label className="text-sm font-bold">Rating<select value={form.rating} onChange={e => setForm({...form,rating:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent">{[1,2,3,4,5].map(v => <option key={v}>{v}</option>)}</select></label>
          <label className="sm:col-span-2 text-sm font-bold">Goals (one per line)<textarea value={form.goals} onChange={e => setForm({...form,goals:e.target.value})} className="block w-full h-24 mt-1 p-3 border rounded-xl bg-transparent"/></label>
          <label className="sm:col-span-2 text-sm font-bold">Feedback<textarea required value={form.feedback} onChange={e => setForm({...form,feedback:e.target.value})} className="block w-full h-28 mt-1 p-3 border rounded-xl bg-transparent"/></label>
        </div>
        <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Create draft</button>
      </form>
    </div>}
  </NativeHrShell>;
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";
import { useAuthUserContext } from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";

const unwrap = (r: any) => r?.data?.success !== undefined ? r.data : r;
const HR_ROLES = ["platform_admin", "tenant_admin", "hr_manager"];
const REVIEW_ROLES = [...HR_ROLES, "manager"];

export default function LeavePage() {
  const { user, loading: authLoading } = useAuthUserContext();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    employee_id: "", leave_type: "annual", start_date: "", end_date: "", reason: ""
  });
  const tenantId = user?.tenantId || "";
  const canReview = !!user && REVIEW_ROLES.includes(user.appRole);
  const canChooseEmployee = !!user && HR_ROLES.includes(user.appRole);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/signin-basic?redirect=/hrm/leaves");
  }, [authLoading, user, router]);

  const invoke = useCallback(async (payload: any) => {
    try {
      const result = unwrap(await base44.functions.invoke("leave-ops", { tenant_id: tenantId, ...payload }));
      if (!result?.success) throw new Error(result?.error || "Leave operation failed");
      return result;
    } catch (error: any) {
      throw new Error(error?.response?.data?.error || error?.message || "Leave operation failed");
    }
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [leaveResult, employeeResultRaw] = await Promise.all([
        invoke({ operation: "list" }),
        canChooseEmployee
          ? base44.functions.invoke("employee-ops", { operation: "list_employees", tenant_id: tenantId })
          : Promise.resolve(null)
      ]);
      setRecords(leaveResult.data || []);
      if (employeeResultRaw) {
        const employeeResult = unwrap(employeeResultRaw);
        setEmployees(employeeResult?.success ? employeeResult.data || [] : []);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, invoke, canChooseEmployee]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(
    () => statusFilter === "all" ? records : records.filter(r => r.status === statusFilter),
    [records, statusFilter]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await invoke({ operation: "submit", ...form });
      toast.success("Leave request submitted.");
      setShowForm(false);
      setForm({ employee_id: "", leave_type: "annual", start_date: "", end_date: "", reason: "" });
      await load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const decide = async (id: string, decision: "approved" | "rejected") => {
    try {
      await invoke({ operation: "decide", leave_request_id: id, decision });
      toast.success(`Request ${decision}.`);
      await load();
    } catch (error: any) { toast.error(error.message); }
  };

  const cancel = async (id: string) => {
    try {
      await invoke({ operation: "cancel", leave_request_id: id });
      toast.success("Request cancelled.");
      await load();
    } catch (error: any) { toast.error(error.message); }
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;

  return (
    <NativeHrShell title="Leave Management" subtitle="Requests and approvals"
      action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> Request leave</button>}>
      <main className="p-5 md:p-8">
        <div className="flex flex-wrap gap-2">
          {["all","pending","approved","rejected","cancelled"].map(status => (
            <button key={status} onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize ${statusFilter === status ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border"}`}>
              {status}
            </button>
          ))}
        </div>

        {loading ? <p className="py-16 text-center text-slate-500">Loading leave requests…</p> :
          <div className="grid lg:grid-cols-2 gap-4 mt-6">
            {filtered.map(record => (
              <article key={record.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5">
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-black">{record.employee?.full_name || "Employee"}</h2>
                    <p className="text-sm text-slate-500 capitalize">{record.leave_type} leave</p>
                  </div>
                  <span className={`h-fit px-2 py-1 rounded-lg text-xs font-bold capitalize ${
                    record.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                    record.status === "rejected" ? "bg-red-50 text-red-700" :
                    record.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>{record.status}</span>
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm"><CalendarDays size={16}/>{record.start_date} → {record.end_date} · {record.days} day{record.days === 1 ? "" : "s"}</div>
                {record.reason && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{record.reason}</p>}
                {record.status === "pending" && <div className="flex gap-2 mt-5">
                  {canReview && <>
                    <button onClick={() => void decide(record.id, "approved")} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">Approve</button>
                    <button onClick={() => void decide(record.id, "rejected")} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold">Reject</button>
                  </>}
                  <button onClick={() => void cancel(record.id)} className="px-4 py-2 rounded-xl border text-sm font-bold">Cancel</button>
                </div>}
              </article>
            ))}
            {!filtered.length && <div className="lg:col-span-2 py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">No leave requests found.</div>}
          </div>
        }
      </main>

      {showForm && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4">
        <form onSubmit={submit} className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6">
          <div className="flex justify-between"><h2 className="text-xl font-black">Request Leave</h2><button type="button" onClick={() => setShowForm(false)}><X/></button></div>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {canChooseEmployee && <label className="sm:col-span-2 text-sm font-bold">Employee
              <select required value={form.employee_id} onChange={e => setForm({...form,employee_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent">
                <option value="">Select employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </label>}
            <label className="sm:col-span-2 text-sm font-bold">Leave type
              <select value={form.leave_type} onChange={e => setForm({...form,leave_type:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent">
                {["annual","sick","maternity","paternity","bereavement","unpaid","other"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Start date<input required type="date" value={form.start_date} onChange={e => setForm({...form,start_date:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
            <label className="text-sm font-bold">End date<input required type="date" min={form.start_date} value={form.end_date} onChange={e => setForm({...form,end_date:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
            <label className="sm:col-span-2 text-sm font-bold">Reason<textarea value={form.reason} onChange={e => setForm({...form,reason:e.target.value})} className="block w-full h-24 mt-1 p-3 border rounded-xl bg-transparent"/></label>
          </div>
          <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Submit request</button>
        </form>
      </div>}
    </NativeHrShell>
  );
}

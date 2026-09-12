"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, FileText, Landmark, Save, ShieldAlert, Star, UserRound, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NativeHrShell from "@/components/hrm/NativeHrShell";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { base44 } from "@/lib/base44";

const unwrap = (result: any) => result?.data?.success !== undefined ? result.data : result;
const editableFields = [
  ["full_name", "Full name", "text"],
  ["email", "Work email", "email"],
  ["phone", "Phone", "tel"],
  ["date_of_birth", "Date of birth", "date"],
  ["gender", "Gender", "text"],
  ["nationality", "Nationality", "text"],
  ["address", "Address", "text"],
  ["city", "City", "text"],
  ["country", "Country", "text"],
  ["location", "Work location", "text"],
  ["department", "Department", "text"],
  ["job_title", "Job title", "text"],
  ["manager_id", "Manager employee ID", "text"],
  ["hire_date", "Hire date", "date"],
  ["emergency_contact_name", "Emergency contact", "text"],
  ["emergency_contact_phone", "Emergency phone", "tel"],
  ["emergency_contact_relationship", "Relationship", "text"]
] as const;

const modules = [
  { href: "/hrm/onboarding", label: "Onboarding", text: "Checklist and readiness", icon: UserRound, color: "bg-sky-100 text-sky-700" },
  { href: "/hrm/leaves", label: "Leave", text: "Requests and approvals", icon: CalendarDays, color: "bg-emerald-100 text-emerald-700" },
  { href: "/hrm/performance", label: "Performance", text: "Reviews and goals", icon: Star, color: "bg-amber-100 text-amber-700" },
  { href: "/hrm/documents", label: "Documents", text: "Private employee files", icon: FileText, color: "bg-violet-100 text-violet-700" },
  { href: "/hrm/training", label: "Learning", text: "Courses and skills", icon: BookOpen, color: "bg-indigo-100 text-indigo-700" },
  { href: "/hrm/employee-relations", label: "Employee relations", text: "Warnings and movements", icon: ShieldAlert, color: "bg-rose-100 text-rose-700" },
  { href: "/payroll/payroll", label: "Payroll", text: "Compensation and payslips", icon: Landmark, color: "bg-cyan-100 text-cyan-700" },
  { href: "/hrm/offboarding", label: "Offboarding", text: "Exit tasks and controls", icon: WalletCards, color: "bg-slate-200 text-slate-700" }
];

export default function EmployeeProfileDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUserContext();
  const tenantId = user?.tenantId || "";
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const invoke = useCallback(async (payload: Record<string, unknown>) => {
    const response = unwrap(await base44.functions.invoke("employee-ops", { tenant_id: tenantId, ...payload }));
    if (!response?.success) throw new Error(response?.error || "Operation failed");
    return response;
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const rows = (await invoke({ operation: "list_employees" })).data || [];
      setEmployees(rows);
      const employee = rows.find((row: any) => row.id === params.id);
      if (employee) setForm(Object.fromEntries(editableFields.map(([key]) => [key, employee[key] || ""])).concat ? {} : {});
      if (employee) {
        const next: Record<string, string> = {};
        editableFields.forEach(([key]) => { next[key] = employee[key] || ""; });
        next.employment_type = employee.employment_type || "";
        setForm(next);
      }
    } catch (error: any) {
      toast.error(error.message || "Could not load employee.");
    } finally {
      setLoading(false);
    }
  }, [invoke, params.id, tenantId]);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/auth/signin-basic?redirect=/hrm/employee-profile/${params.id}`);
  }, [authLoading, params.id, router, user]);
  useEffect(() => { void load(); }, [load]);

  const employee = useMemo(() => employees.find((row) => row.id === params.id), [employees, params.id]);
  const manager = useMemo(() => employees.find((row) => row.id === form.manager_id), [employees, form.manager_id]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await invoke({ operation: "update_employee", employee_id: params.id, ...form });
      toast.success("Employee profile updated.");
      await load();
    } catch (error: any) {
      toast.error(error.message || "Could not update employee.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;

  return <NativeHrShell title="Employee Profile" subtitle="Base44-native employee record">
    <main className="p-5 md:p-8 max-w-7xl mx-auto">
      <Link href="/hrm/employee" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600"><ArrowLeft size={16}/> Employee directory</Link>
      {loading ? <p className="py-24 text-center text-slate-500">Loading employee profile…</p> : !employee ? (
        <div className="mt-8 p-10 text-center bg-white dark:bg-slate-900 border rounded-3xl">
          <h2 className="text-xl font-black">Employee not found</h2>
          <p className="mt-2 text-slate-500">This record does not exist in your organization or you do not have access.</p>
        </div>
      ) : <>
        <section className="mt-5 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/15 grid place-items-center text-2xl font-black">
              {String(employee.full_name || "?").split(" ").map((name: string) => name[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-black">{employee.full_name}</h1>
                <span className="px-2.5 py-1 rounded-full bg-white/15 text-xs font-bold capitalize">{employee.employment_status}</span>
              </div>
              <p className="mt-1 text-blue-100">{employee.job_title || "No job title"} · {employee.department || "Unassigned"}</p>
              <p className="mt-3 text-sm text-blue-100">{employee.employee_number || "No employee number"} · Joined {employee.hire_date || "Not set"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="px-4 py-3 bg-white/10 rounded-xl"><p className="text-xs text-blue-200">Stage</p><p className="font-bold capitalize">{employee.lifecycle_stage}</p></div>
              <div className="px-4 py-3 bg-white/10 rounded-xl"><p className="text-xs text-blue-200">Type</p><p className="font-bold capitalize">{(employee.employment_type || "Not set").replaceAll("_", " ")}</p></div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 mt-6">
          <form onSubmit={save} className="p-5 md:p-7 bg-white dark:bg-slate-900 border rounded-3xl">
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="text-xl font-black">Employee details</h2><p className="text-sm text-slate-500">Personal and employment information</p></div>
              <button disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 disabled:opacity-60 text-white font-bold"><Save size={16}/>{saving ? "Saving…" : "Save"}</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              {editableFields.map(([key, label, type]) => <label key={key} className={key === "address" ? "sm:col-span-2 text-sm font-bold" : "text-sm font-bold"}>
                {label}
                <input required={["full_name", "email", "job_title", "hire_date"].includes(key)} type={type} value={form[key] || ""} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="block w-full mt-1 p-3 bg-transparent border rounded-xl font-normal outline-none focus:ring-2 focus:ring-blue-500"/>
              </label>)}
              <label className="text-sm font-bold">Employment type
                <select value={form.employment_type || ""} onChange={(event) => setForm((current) => ({ ...current, employment_type: event.target.value }))} className="block w-full mt-1 p-3 bg-white dark:bg-slate-900 border rounded-xl font-normal">
                  <option value="">Not set</option>
                  <option value="permanent">Permanent</option><option value="fixed_term">Fixed term</option><option value="part_time">Part time</option>
                  <option value="contractor">Contractor</option><option value="intern">Intern</option><option value="casual">Casual</option>
                </select>
              </label>
            </div>
            {manager && <p className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">Reports to <strong>{manager.full_name}</strong> · {manager.job_title || "No job title"}</p>}
          </form>

          <aside>
            <div className="p-5 bg-white dark:bg-slate-900 border rounded-3xl">
              <h2 className="font-black">Employee journey</h2>
              <p className="text-sm text-slate-500 mt-1">Sensitive records stay inside their permission-controlled modules.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3 mt-5">
                {modules.map(({ href, label, text, icon: Icon, color }) => <Link key={href} href={href} className="flex items-center gap-3 p-3 border rounded-2xl hover:border-blue-400 hover:shadow-sm transition">
                  <span className={`w-10 h-10 rounded-xl grid place-items-center ${color}`}><Icon size={18}/></span>
                  <span><strong className="block text-sm">{label}</strong><span className="text-xs text-slate-500">{text}</span></span>
                </Link>)}
              </div>
            </div>
          </aside>
        </div>
      </>}
    </main>
  </NativeHrShell>;
}

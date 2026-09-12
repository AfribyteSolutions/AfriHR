"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, ShieldCheck, UserCog, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NativeHrShell from "@/components/hrm/NativeHrShell";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { base44 } from "@/lib/base44";

const unwrap = (result: any) => result?.data?.success !== undefined ? result.data : result;
const label = (permission: string) => permission.split(".").map((part) => part.replaceAll("_", " ")).join(" · ");

export default function AccessControlPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuthUserContext();
  const tenantId = user?.tenantId || "";
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", description: "", base_role: "employee", permissions: [] as string[] });

  const allowed = user?.appRole === "platform_admin" || user?.appRole === "tenant_admin" || user?.permissions.includes("access.manage");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/signin-basic?redirect=/hrm/access-control");
    else if (!authLoading && user && !allowed) router.replace("/dashboard");
  }, [allowed, authLoading, router, user]);

  const invoke = useCallback(async (payload: Record<string, unknown>) => {
    const result = unwrap(await base44.functions.invoke("access-control-ops", { tenant_id: tenantId, ...payload }));
    if (!result?.success) throw new Error(result?.error || "Operation failed");
    return result;
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId || !allowed) return;
    setLoading(true);
    try {
      const data = (await invoke({ operation: "list" })).data;
      setRoles(data.roles || []);
      setUsers(data.users || []);
      setCatalog(data.permission_catalog || []);
      setAssignments(Object.fromEntries((data.users || []).map((member: any) => [member.id, (data.roles || []).find((role: any) => role.key === member.role_key)?.id || ""])));
    } catch (error: any) {
      toast.error(error.message || "Could not load access control.");
    } finally {
      setLoading(false);
    }
  }, [allowed, invoke, tenantId]);

  useEffect(() => { void load(); }, [load]);

  const grouped = useMemo(() => catalog.reduce((result: Record<string, string[]>, permission) => {
    const group = permission.split(".")[0];
    (result[group] ||= []).push(permission);
    return result;
  }, {}), [catalog]);

  const createRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving("create");
    try {
      await invoke({ operation: "create_role", ...form });
      toast.success("Custom role created.");
      setShowCreate(false);
      setForm({ name: "", description: "", base_role: "employee", permissions: [] });
      await load();
    } catch (error: any) {
      toast.error(error.message || "Could not create role.");
    } finally {
      setSaving("");
    }
  };

  const assign = async (member: any) => {
    const roleId = assignments[member.id];
    if (!roleId) return toast.error("Select a role first.");
    setSaving(member.id);
    try {
      await invoke({ operation: "assign_role", user_id: member.id, role_id: roleId });
      toast.success(`Access updated for ${member.full_name || member.email}.`);
      if (member.id === user?.id) await refreshUser();
      await load();
    } catch (error: any) {
      toast.error(error.message || "Could not assign role.");
    } finally {
      setSaving("");
    }
  };

  if (authLoading || !user || !allowed) return <div className="min-h-screen grid place-items-center">Checking access…</div>;

  return <NativeHrShell title="Access Control" subtitle="Tenant roles, permissions and user assignment"
    action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> Custom role</button>}>
    <main className="p-5 md:p-8 max-w-7xl mx-auto">
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-blue-700 text-white rounded-2xl"><ShieldCheck/><p className="mt-4 text-3xl font-black">{roles.length}</p><p className="text-sm text-blue-100">Active role definitions</p></div>
        <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl"><UserCog className="text-violet-600"/><p className="mt-4 text-3xl font-black">{users.length}</p><p className="text-sm text-slate-500">Workspace users</p></div>
        <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl"><KeyRound className="text-emerald-600"/><p className="mt-4 text-3xl font-black">{catalog.length}</p><p className="text-sm text-slate-500">Available permissions</p></div>
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl"><p className="font-black text-amber-900">Fail-safe rules</p><p className="mt-2 text-xs text-amber-800">You cannot demote yourself, remove the final tenant administrator, or alter a platform administrator.</p></div>
      </section>

      <section className="mt-7 bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden">
        <div className="p-5 border-b"><h2 className="text-xl font-black">User assignments</h2><p className="text-sm text-slate-500">Role permissions are copied to the user as an auditable access snapshot.</p></div>
        {loading ? <p className="p-12 text-center text-slate-500">Loading access control…</p> : <div className="divide-y">
          {users.map((member) => <div key={member.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0"><p className="font-bold truncate">{member.full_name || member.email}</p><p className="text-xs text-slate-500 truncate">{member.email} · <span className="capitalize">{member.employment_status}</span></p></div>
            <select value={assignments[member.id] || ""} onChange={(event) => setAssignments((current) => ({ ...current, [member.id]: event.target.value }))} className="md:w-64 p-3 border rounded-xl bg-white dark:bg-slate-900">
              <option value="">Select role</option>
              {roles.filter((role) => role.status === "active").map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <button disabled={saving === member.id} onClick={() => assign(member)} className="px-4 py-3 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-bold disabled:opacity-60">{saving === member.id ? "Saving…" : "Apply role"}</button>
          </div>)}
          {!users.length && <p className="p-12 text-center text-slate-500">No users belong to this tenant yet.</p>}
        </div>}
      </section>

      <section className="mt-7">
        <h2 className="text-xl font-black">Role definitions</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {roles.map((role) => <article key={role.id} className="p-5 bg-white dark:bg-slate-900 border rounded-2xl">
            <div className="flex justify-between gap-3"><div><h3 className="font-black">{role.name}</h3><p className="text-xs text-slate-500 capitalize">{role.base_role.replaceAll("_", " ")} · {role.is_system ? "System template" : "Custom"}</p></div><span className="h-fit px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">{role.permissions?.length || 0} permissions</span></div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{role.description || "No description"}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">{(role.permissions || []).map((permission: string) => <span key={permission} className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px]">{label(permission)}</span>)}</div>
          </article>)}
        </div>
      </section>
    </main>

    {showCreate && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4">
      <form onSubmit={createRole} className="w-full max-w-3xl max-h-[92vh] overflow-auto p-6 bg-white dark:bg-slate-900 rounded-3xl">
        <div className="flex justify-between gap-4"><div><h2 className="text-xl font-black">Create custom role</h2><p className="text-sm text-slate-500">Start with a base identity, then select only the access required.</p></div><button type="button" onClick={() => setShowCreate(false)}><X/></button></div>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <label className="text-sm font-bold">Role name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
          <label className="text-sm font-bold">Base identity<select value={form.base_role} onChange={(event) => setForm({ ...form, base_role: event.target.value })} className="block w-full mt-1 p-3 border rounded-xl bg-white dark:bg-slate-900">
            <option value="employee">Employee</option><option value="manager">People manager</option><option value="recruiter">Recruiter</option><option value="hr_manager">HR manager</option><option value="payroll_manager">Payroll manager</option><option value="finance_manager">Finance manager</option>
          </select></label>
          <label className="sm:col-span-2 text-sm font-bold">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="block w-full mt-1 p-3 border rounded-xl bg-transparent" rows={2}/></label>
        </div>
        <div className="mt-6 space-y-4">{Object.entries(grouped).map(([group, permissions]) => <fieldset key={group} className="p-4 border rounded-2xl">
          <legend className="px-2 font-black capitalize">{group}</legend>
          <div className="grid sm:grid-cols-2 gap-3">{permissions.map((permission) => <label key={permission} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.permissions.includes(permission)} onChange={(event) => setForm((current) => ({ ...current, permissions: event.target.checked ? [...current.permissions, permission] : current.permissions.filter((item) => item !== permission) }))}/>{label(permission)}
          </label>)}</div>
        </fieldset>)}</div>
        <button disabled={saving === "create"} className="w-full mt-6 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-60">{saving === "create" ? "Creating…" : "Create role"}</button>
      </form>
    </div>}
  </NativeHrShell>;
}

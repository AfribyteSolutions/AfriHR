"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";
import { useAuthUserContext } from "@/context/UserAuthContext";
import NativeHrShell from "@/components/hrm/NativeHrShell";

const unwrap = (r: any) => r?.data?.success !== undefined ? r.data : r;
const HR_ROLES = ["platform_admin", "tenant_admin", "hr_manager"];
const CATEGORIES = ["contract", "id", "qualification", "policy", "tax", "medical", "other"];

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuthUserContext();
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: "", category: "contract", expiry_date: "" });
  const [file, setFile] = useState<File | null>(null);
  const tenantId = user?.tenantId || "";
  const isHr = !!user && HR_ROLES.includes(user.appRole);

  useEffect(() => { if (!authLoading && !user) router.replace("/auth/signin-basic?redirect=/hrm/documents"); }, [authLoading, user, router]);

  const invoke = useCallback(async (payload: any) => {
    const result = unwrap(await base44.functions.invoke("document-ops", { tenant_id: tenantId, ...payload }));
    if (!result?.success) throw new Error(result?.error || "Document operation failed");
    return result;
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [documentResult, employeeRaw] = await Promise.all([
        invoke({ operation: "list" }),
        isHr ? base44.functions.invoke("employee-ops", { operation: "list_employees", tenant_id: tenantId }) : Promise.resolve(null)
      ]);
      setDocuments(documentResult.data || []);
      if (employeeRaw) {
        const result = unwrap(employeeRaw);
        setEmployees(result?.success ? result.data || [] : []);
      }
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  }, [tenantId, isHr, invoke]);

  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => category === "all" ? documents : documents.filter(d => d.category === category), [documents, category]);

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return toast.error("Choose a file.");
    if (file.size > 10 * 1024 * 1024) return toast.error("File must be 10 MB or smaller.");
    setUploading(true);
    try {
      const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
      await invoke({
        operation: "register", ...form, file_uri: uploaded.file_uri,
        file_name: file.name, mime_type: file.type, size_bytes: file.size
      });
      toast.success("Document uploaded securely.");
      setShowForm(false); setFile(null);
      setForm({ employee_id: "", category: "contract", expiry_date: "" });
      await load();
    } catch (error: any) { toast.error(error?.response?.data?.error || error.message); }
    finally { setUploading(false); }
  };

  const download = async (document: any) => {
    try {
      const result = await invoke({ operation: "download", document_id: document.id });
      window.open(result.data.signed_url, "_blank", "noopener,noreferrer");
    } catch (error: any) { toast.error(error.message); }
  };

  const archive = async (id: string) => {
    try { await invoke({ operation: "archive", document_id: id }); toast.success("Document archived."); await load(); }
    catch (error: any) { toast.error(error.message); }
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center">Loading AfriHR…</div>;

  return <NativeHrShell title="Employee Documents" subtitle="Private, role-controlled personnel files"
    action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> Upload</button>}>
    <main className="p-5 md:p-8">
      <div className="flex flex-wrap gap-2">
        {["all",...CATEGORIES].map(v => <button key={v} onClick={() => setCategory(v)}
          className={`px-3 py-2 rounded-xl text-xs font-bold capitalize ${category === v ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 border"}`}>{v}</button>)}
      </div>
      {loading ? <p className="py-16 text-center text-slate-500">Loading documents…</p> :
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {filtered.map(document => <article key={document.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5">
            <div className="flex items-start gap-3"><div className="p-3 rounded-xl bg-blue-50 text-blue-600"><FileText/></div>
              <div className="min-w-0 flex-1"><h2 className="font-black truncate">{document.file_name}</h2><p className="text-sm text-slate-500">{document.employee?.full_name || "Employee"}</p></div>
              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold capitalize">{document.category}</span>
            </div>
            <div className="mt-4 text-xs text-slate-500 space-y-1">
              <p>{document.mime_type || "File"} · {document.size_bytes ? `${(document.size_bytes / 1024).toFixed(0)} KB` : "Size unavailable"}</p>
              {document.expiry_date && <p>Expires {document.expiry_date}</p>}
              <p className="capitalize">Status: {document.status}</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => void download(document)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold"><Download size={15}/> Open</button>
              {isHr && document.status !== "archived" && <button onClick={() => void archive(document.id)} className="px-4 py-2 rounded-xl border text-sm font-bold">Archive</button>}
            </div>
          </article>)}
          {!filtered.length && <div className="md:col-span-2 xl:col-span-3 py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">No employee documents found.</div>}
        </div>}
    </main>
    {showForm && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/60 p-4">
      <form onSubmit={upload} className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6">
        <div className="flex justify-between"><h2 className="text-xl font-black">Upload Document</h2><button type="button" onClick={() => setShowForm(false)}><X/></button></div>
        <div className="space-y-4 mt-6">
          {isHr && <label className="block text-sm font-bold">Employee<select required value={form.employee_id} onChange={e => setForm({...form,employee_id:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="">Select employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select></label>}
          <label className="block text-sm font-bold">Category<select value={form.category} onChange={e => setForm({...form,category:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent">{CATEGORIES.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
          <label className="block text-sm font-bold">Expiry date (optional)<input type="date" value={form.expiry_date} onChange={e => setForm({...form,expiry_date:e.target.value})} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>
          <label className="block text-sm font-bold">Private file<input required type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full mt-1 p-3 border rounded-xl" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"/></label>
          <p className="text-xs text-slate-500">PDF, Word or image. Maximum 10 MB. Downloads use short-lived links.</p>
        </div>
        <button disabled={uploading} className="w-full mt-6 py-3 bg-blue-600 disabled:opacity-50 text-white rounded-xl font-bold">{uploading ? "Uploading…" : "Upload securely"}</button>
      </form>
    </div>}
  </NativeHrShell>;
}

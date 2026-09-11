"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LogOut, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";
import ApplicationForm from "./ApplicationForm";
import type { Applicant, Stage } from "@/types/recruit";

const STAGES: Stage[] = ["applied", "screening", "interview", "assessment", "offer", "hired", "rejected", "withdrawn"];
const COLORS: Record<Stage, string> = {
  application: "bg-slate-400",
  applied: "bg-slate-400", screening: "bg-amber-400", interview: "bg-blue-400",
  assessment: "bg-cyan-500", offer: "bg-purple-500", hired: "bg-emerald-500",
  rejected: "bg-red-500", withdrawn: "bg-zinc-500"
};
const ALLOWED: Record<Stage, Stage[]> = {
  application: ["screening", "rejected", "withdrawn"],
  applied: ["screening", "rejected", "withdrawn"],
  screening: ["interview", "rejected", "withdrawn"],
  interview: ["assessment", "offer", "rejected", "withdrawn"],
  assessment: ["interview", "offer", "rejected", "withdrawn"],
  offer: ["hired", "rejected", "withdrawn"],
  hired: [], rejected: [], withdrawn: []
};

const unwrap = (response: any) => response?.data?.success !== undefined ? response.data : response;
const mapCandidate = (row: any): Applicant => {
  const names = String(row.full_name || "").trim().split(/\s+/);
  return {
    id: row.id, fullName: row.full_name || "", firstName: names[0] || "",
    lastName: names.slice(1).join(" "), email: row.email || "", phone: row.phone || "",
    position: row.position || "", department: row.department || "", stage: row.stage || "applied",
    appliedDate: row.created_date || new Date().toISOString(), resumeFileUri: row.resume_file_uri || "",
    photoFileUri: row.photo_file_uri || "", notes: row.notes || "", source: row.source || "",
    hiredEmployeeId: row.hired_employee_id || ""
  };
};

export default function RecruitmentDashboard({ userData }: { userData: any }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Applicant | null>(null);
  const tenantId = userData?.tenantId || userData?.companyId || "";

  const invoke = useCallback(async (payload: Record<string, unknown>) => {
    const result = unwrap(await base44.functions.invoke("recruitment-ops", { tenant_id: tenantId, ...payload }));
    if (!result?.success) throw new Error(result?.error || "Recruitment operation failed");
    return result;
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const result = await invoke({ operation: "list_candidates" });
      setApplicants((result.data || []).map(mapCandidate));
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || "Could not load candidates.");
    } finally { setLoading(false); }
  }, [invoke, tenantId]);

  useEffect(() => { void load(); }, [load]);

  const createCandidate = async (data: any) => {
    const result = await invoke({ operation: "create_candidate", ...data });
    toast.success(result.duplicate ? "Candidate already exists." : "Candidate added.");
    setShowForm(false);
    await load();
  };

  const move = async (candidate: Applicant, stage: Stage) => {
    if (stage === "hired") {
      const result = await invoke({ operation: "hire_candidate", candidate_id: candidate.id });
      toast.success(result.duplicate ? "Employee already exists; no duplicate created." : "Candidate hired and onboarding created.");
    } else {
      await invoke({ operation: "change_stage", candidate_id: candidate.id, stage });
      toast.success(`Moved to ${stage}.`);
    }
    setSelected(null);
    await load();
  };

  const saveNotes = async () => {
    if (!selected) return;
    await invoke({ operation: "update_candidate", candidate_id: selected.id, notes: selected.notes });
    toast.success("Notes saved.");
    await load();
  };

  const columns = useMemo(() => STAGES.map(stage => ({
    stage, people: applicants.filter(a => a.stage === stage)
  })), [applicants]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 md:px-8 py-4 flex items-center justify-between">
        <div><h1 className="text-2xl font-black">AfriHR Recruitment</h1><p className="text-xs text-slate-500">Base44-native talent pipeline</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"><Plus size={16}/> Candidate</button>
          <button onClick={() => base44.auth.logout("/auth/signin-basic")} className="p-2 rounded-xl border border-slate-200" title="Sign out"><LogOut size={18}/></button>
        </div>
      </header>

      {!tenantId && <div className="m-6 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">Your Base44 user has no tenant assigned. Set tenant_id before using recruitment.</div>}
      <main className="p-5 md:p-8 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {columns.map(({ stage, people }) => (
            <section key={stage} className="w-72">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${COLORS[stage]}`}/>{stage}</h2>
                <span className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-lg">{people.length}</span>
              </div>
              <div className="space-y-3">
                {people.map(person => (
                  <button key={person.id} onClick={() => setSelected(person)}
                    className="block text-left w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400">
                    <strong className="block truncate">{person.fullName}</strong>
                    <span className="block text-xs text-blue-600 truncate">{person.position || "Position not set"}</span>
                    <span className="block text-xs text-slate-500 mt-2 truncate">{person.email}</span>
                  </button>
                ))}
                {!people.length && <div className="p-6 text-center text-xs text-slate-400 border-2 border-dashed rounded-2xl">No candidates</div>}
              </div>
            </section>
          ))}
        </div>
      </main>

      {showForm && <div className="fixed inset-0 z-40 grid place-items-center p-4 bg-slate-950/60">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 max-h-[90vh] overflow-auto">
          <div className="flex justify-between mb-5"><h2 className="text-xl font-black">New Candidate</h2><button onClick={() => setShowForm(false)}><X/></button></div>
          <ApplicationForm onAddApplicant={createCandidate}/>
        </div>
      </div>}

      {selected && <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/50">
        <aside className="w-full max-w-md h-full bg-white dark:bg-slate-900 p-6 overflow-auto">
          <div className="flex justify-between"><div><h2 className="text-xl font-black">{selected.fullName}</h2><p className="text-sm text-slate-500">{selected.position}</p></div><button onClick={() => setSelected(null)}><X/></button></div>
          <dl className="mt-6 space-y-3 text-sm"><div><dt className="text-slate-400">Email</dt><dd>{selected.email}</dd></div><div><dt className="text-slate-400">Department</dt><dd>{selected.department || "—"}</dd></div><div><dt className="text-slate-400">Stage</dt><dd className="capitalize">{selected.stage}</dd></div></dl>
          {selected.resumeFileUri && <button onClick={async () => {
            const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: selected.resumeFileUri!, expires_in: 300 });
            window.open(signed_url, "_blank", "noopener,noreferrer");
          }} className="mt-5 text-blue-600 font-bold">Open private CV</button>}
          <label className="block mt-6 text-xs font-bold uppercase text-slate-500">Internal notes</label>
          <textarea value={selected.notes} onChange={e => setSelected({ ...selected, notes: e.target.value })}
            className="w-full h-28 mt-2 p-3 rounded-xl border border-slate-200 bg-transparent"/>
          <button onClick={() => void saveNotes()} className="mt-2 w-full py-2 rounded-xl border font-bold">Save notes</button>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {ALLOWED[selected.stage].map(stage => <button key={stage} onClick={() => void move(selected, stage)}
              className={`py-3 px-2 rounded-xl text-xs font-bold uppercase text-white ${stage === "hired" ? "bg-emerald-600" : "bg-blue-600"}`}>{stage === "hired" ? "Complete hire" : `Move to ${stage}`}</button>)}
          </div>
        </aside>
      </div>}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { base44 } from "@/lib/base44";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";

export default function ComplianceReadinessPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const res:any = await base44.functions.invoke("complianceReadiness", {});
      setData(res?.data ?? res);
    } catch (e:any) { setError(e?.message || "Unable to load compliance readiness"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  const checks = data?.checks || [];
  async function remediate(check:any) {
    const r = check?.remediation;
    if (!r) return;
    if (r.type === "invoke" && r.operation) {
      setLoading(true); setError("");
      try {
        await base44.functions.invoke("complianceReadiness", { operation: r.operation });
        await load();
      } catch (e:any) { setError(e?.message || "Remediation failed"); setLoading(false); }
      return;
    }
    if (r.target && typeof window !== "undefined") window.location.assign(r.target);
  }
  const ready = data?.readiness === "configured" && !(data?.blockers || []).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance & Readiness</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Technical configuration status only; not a legal certification.</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Recheck
        </button>
      </div>
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : loading ? <p className="text-sm text-gray-500">Checking readiness…</p> : <>
        <div className={`mb-4 rounded-lg border p-3 ${ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="flex items-center gap-2">{ready ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}<span className="text-sm font-semibold text-gray-900">{ready ? "Configuration ready" : "Configuration needs attention"}</span></div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">{checks.map((c:any) => <div key={c.key} className="flex gap-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">{c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}<div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">{c.label || String(c.key).replaceAll("_", " ")}</p><p className="text-xs text-gray-500 dark:text-gray-400">{c.detail}</p>{!c.ok && c.remediation && <button onClick={() => remediate(c)} className="mt-2 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">{c.remediation.label || "Fix"} →</button>}</div></div>)}</div>
      </>}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, LayoutGrid, List } from 'lucide-react';
import { toast } from "sonner";
import ApplicationForm from "./ApplicationForm";
import ApplicantCard from "./ApplicantCard";
import ApplicantDetailModal from "./ApplicantDetailModal";
import type { Applicant, Stage } from "@/types/recruit";

const STAGES: Stage[] = ['application', 'screening', 'interview', 'offer', 'hired', 'rejected'];

const STAGE_COLORS: Record<string, string> = {
  application: 'bg-slate-400',
  screening:   'bg-yellow-400',
  interview:   'bg-blue-400',
  offer:       'bg-purple-400',
  hired:       'bg-emerald-400',
  rejected:    'bg-red-400',
};

const RecruitmentDashboard = ({ userData }: { userData: any }) => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [mobileStage, setMobileStage] = useState<Stage>('application');

  const loadPipeline = useCallback(async () => {
    if (!userData?.companyId) return;
    try {
      const res = await fetch(`/api/recruitment?companyId=${userData.companyId}`);
      const data = await res.json();
      if (data.success) {
        setApplicants(data.applicants);
      } else {
        toast.error(data.message || "Failed to load pipeline");
      }
    } catch (err) {
      console.error("Pipeline Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [userData?.companyId]);

  useEffect(() => {
    if (userData?.companyId) {
      loadPipeline();
    } else {
      const timer = setTimeout(() => setLoading(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [userData, loadPipeline]);

  const handleAddApplicant = async (payload: any) => {
    try {
      const res = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Applicant added to database");
        loadPipeline();
        setIsModalOpen(false);
      }
    } catch (err) {
      toast.error("Network error saving applicant");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Applicant>) => {
    try {
      const res = await fetch("/api/recruitment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        setApplicants(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        if (selectedApplicant?.id === id) {
          setSelectedApplicant(prev => prev ? { ...prev, ...updates } : null);
        }
      }
    } catch (err) {
      toast.error("Failed to sync status");
    }
  };

  const handleFinalizeHire = async (applicant: Applicant) => {
    const toastId = toast.loading(`Creating account for ${applicant.firstName}...`);
    try {
      const res = await fetch("/api/recruitment/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId: applicant.id,
          companyId: userData.companyId,
          createdBy: userData.uid,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Hire failed");
      }
  
      // Optimistically update local state
      setApplicants(prev =>
        prev.map(a => a.id === applicant.id ? { ...a, stage: 'hired' as Stage } : a)
      );
      if (selectedApplicant?.id === applicant.id) {
        setSelectedApplicant(prev => prev ? { ...prev, stage: 'hired' as Stage } : null);
      }
  
      toast.success(
        `${applicant.firstName} is now an employee! A password reset email has been sent.`,
        { id: toastId, duration: 5000 }
      );
      setIsDetailOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create employee account", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initialising Pipeline</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col overflow-hidden">

      <header className="px-4 py-4 md:px-8 md:py-6 bg-white dark:bg-[#1a222c] border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg md:text-2xl font-black dark:text-white">Talent Pipeline</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Recruitment Management</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Applicant</span>
          <span className="sm:hidden">Add</span>
        </button>
      </header>

      <div className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto shrink-0 bg-white dark:bg-[#1a222c] border-b border-slate-200 dark:border-slate-800">
        {STAGES.map(stage => {
          const count = applicants.filter(a => a.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setMobileStage(stage)}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                mobileStage === stage
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STAGE_COLORS[stage]}`} />
              {stage}
              <span className={`px-1 rounded text-[9px] font-bold ${mobileStage === stage ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-hidden">
        <div className="hidden md:flex h-full p-6 gap-5 overflow-x-auto custom-scrollbar items-start">
          {STAGES.map((stage) => {
            const stageApplicants = applicants.filter(a => a.stage === stage);
            return (
              <div key={stage} className="w-72 lg:w-80 shrink-0 flex flex-col max-h-full">
                <div className="flex justify-between items-center mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]}`} />
                    <h3 className="uppercase text-[11px] font-black text-slate-400 tracking-widest">{stage}</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg text-slate-500 shadow-sm">
                    {stageApplicants.length}
                  </span>
                </div>
                <div className="space-y-3 overflow-y-auto flex-1 pb-10 pr-1 custom-scrollbar">
                  {stageApplicants.map((applicant) => (
                    <ApplicantCard
                      key={applicant.id}
                      applicant={applicant}
                      onClick={() => { setSelectedApplicant(applicant); setIsDetailOpen(true); }}
                    />
                  ))}
                  {stageApplicants.length === 0 && (
                    <div className="h-24 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center opacity-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">No Active {stage}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="md:hidden h-full overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {applicants.filter(a => a.stage === mobileStage).map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onClick={() => { setSelectedApplicant(applicant); setIsDetailOpen(true); }}
            />
          ))}
        </div>
      </main>

      <ApplicantDetailModal
        applicant={selectedApplicant}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onMoveStage={(id, stage) => handleUpdate(id, { stage })}
        onUpdateNotes={(id, notes) => handleUpdate(id, { notes })}
        onHire={handleFinalizeHire} // 🔹 Passed new handler
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full sm:max-w-xl bg-white dark:bg-[#1a222c] rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">New Application</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <Plus className="rotate-45" />
                </button>
              </div>
              <ApplicationForm onAddApplicant={handleAddApplicant} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentDashboard;
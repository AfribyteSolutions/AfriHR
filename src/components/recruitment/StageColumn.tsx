"use client";

import React from "react";
import type { Applicant, Stage } from "@/types/recruit";
import ApplicantDetail from "./ApplicantDetail";

interface StageColumnProps {
  stage: Stage;
  applicants: Applicant[];
  onSelectApplicant: (applicant: Applicant) => void;
  onMoveApplicant: (applicantId: string, newStage: Stage) => void;
  onHireTrigger: (applicant: Applicant) => void;
}

const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  applicants,
  onSelectApplicant,
  onMoveApplicant,
  onHireTrigger
}) => {
  const stages: Stage[] = ["application", "screening", "interview", "offer", "hired", "rejected"];

  const getStageColor = (s: string) => {
    switch (s) {
      case 'hired': return 'border-t-green-500';
      case 'rejected': return 'border-t-red-500';
      default: return 'border-t-blue-500';
    }
  };

  return (
    <div className={`flex-shrink-0 w-80 flex flex-col h-full rounded-2xl bg-slate-50 dark:bg-[#1a222c] border-t-4 ${getStageColor(stage)} shadow-sm`}>
      <div className="p-4 flex items-center justify-between">
        <h4 className="font-bold text-slate-700 dark:text-slate-200 capitalize flex items-center gap-2">
          {stage}
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
            {applicants.length}
          </span>
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 common-scrollbar">
        {applicants.map((applicant) => (
          <div key={applicant.id} className="group relative">
            <div onClick={() => onSelectApplicant(applicant)} className="cursor-pointer">
              <ApplicantDetail applicant={applicant} onHire={onHireTrigger} />
            </div>

            {/* Quick Move Selector */}
            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Move to:</span>
              <select
                value={stage}
                onChange={(e) => onMoveApplicant(applicant.id, e.target.value as Stage)}
                className="bg-transparent text-[10px] font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
              >
                {stages.map((s) => (
                  <option key={s} value={s} className="dark:bg-[#1a222c]">{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        
        {applicants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-400 mb-2" />
            <p className="text-xs text-slate-400 font-medium italic">Empty Stage</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StageColumn;
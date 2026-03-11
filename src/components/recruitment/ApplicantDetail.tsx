"use client";

import React from "react";
import type { Applicant } from "@/types/recruit";
import { Mail, Phone, Briefcase, Calendar, Building2 } from "lucide-react";

interface ApplicantDetailProps {
  applicant: Applicant;
  onHire?: (applicant: Applicant) => void;
}

const ApplicantDetail: React.FC<ApplicantDetailProps> = ({ applicant, onHire }) => {
  const isHired = applicant.stage === "hired";

  return (
    <div className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">
            {applicant.firstName} {applicant.lastName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-blue-600 dark:text-blue-400 font-medium text-xs">
            <Briefcase size={12} />
            {applicant.position}
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
          isHired ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        }`}>
          {applicant.stage}
        </span>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Mail size={14} /> {applicant.email}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Phone size={14} /> {applicant.phone || "No phone"}
        </div>
        {applicant.department && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Building2 size={14} /> {applicant.department}
          </div>
        )}
      </div>

      {applicant.stage === "offer" && (
        <button 
          onClick={() => onHire?.(applicant)}
          className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          Finalize Hire
        </button>
      )}
    </div>
  );
};

export default ApplicantDetail;
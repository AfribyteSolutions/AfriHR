"use client";

import React from "react";
import type { Applicant } from "@/types/recruit";
import { Mail, Briefcase, FileText, Landmark, Clock, User } from "lucide-react";

interface ApplicantCardProps {
  applicant: Applicant;
  onClick: (applicant: Applicant) => void;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant, onClick }) => {
  const isDataComplete = !!(applicant.bankAccount?.bankName && applicant.bankAccount?.accountNumber);

  return (
    <div 
      onClick={() => onClick(applicant)}
      className="group bg-white dark:bg-[#1a222c] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all cursor-pointer relative"
    >
      <div className="flex gap-4 items-start mb-3">
        {/* Profile Image Preview */}
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
          {applicant.photoURL ? (
            <img src={applicant.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <User size={16} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
            {applicant.firstName} {applicant.lastName}
          </h4>
          <p className="text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-tighter">
            {applicant.position}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Mail size={12} className="opacity-70" /> 
          <span className="truncate">{applicant.email}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isDataComplete && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <Landmark size={10} /> PAYROLL
            </span>
          )}
          {applicant.cvUrl && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
              <FileText size={10} /> CV
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock size={10} /> {new Date(applicant.appliedDate).toLocaleDateString()}
        </div>
        <span className="text-[10px] font-black text-blue-500 uppercase opacity-0 group-hover:opacity-100 transition-all">
          View Profile →
        </span>
      </div>
    </div>
  );
};

export default ApplicantCard; // 🔹 Fixed Default Export
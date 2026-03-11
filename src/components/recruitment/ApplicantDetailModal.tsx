"use client";

import React, { useState, useEffect } from "react";
import {
  X, Mail, Phone, Briefcase, Building2,
  Calendar, Globe, FileText, PhoneCall, StickyNote, UserPlus
} from "lucide-react";
import type { Applicant, Stage } from "@/types/recruit";

interface Props {
  applicant: Applicant | null;
  isOpen: boolean;
  onClose: () => void;
  onMoveStage: (id: string, newStage: Stage) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onHire: (applicant: Applicant) => void;
}

const STAGES: Stage[] = ['application', 'screening', 'interview', 'offer', 'hired', 'rejected'];

const STAGE_COLORS: Record<string, string> = {
  application: 'bg-slate-400',
  screening:   'bg-yellow-400',
  interview:   'bg-blue-400',
  offer:       'bg-purple-500',
  hired:       'bg-emerald-500',
  rejected:    'bg-red-500',
};

const ApplicantDetailModal: React.FC<Props> = ({
  applicant, isOpen, onClose, onMoveStage, onUpdateNotes, onHire
}) => {
  const [localNotes, setLocalNotes] = useState<string>("");

  useEffect(() => {
    if (applicant) setLocalNotes(applicant.notes || "");
  }, [applicant]);

  if (!applicant) return null;

  const isHired = applicant.stage === 'hired';

  const appliedDate = applicant.appliedDate
    ? new Date(applicant.appliedDate).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      })
    : "—";

  const openCV = () => {
    if (!applicant.cvUrl) return;
    try {
      if (applicant.cvUrl.startsWith("data:")) {
        const parts = applicant.cvUrl.split(",");
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: "application/pdf" });
        window.open(URL.createObjectURL(blob), "_blank");
      } else {
        window.open(applicant.cvUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to open CV:", error);
    }
  };

  return (
    <div className={`fixed inset-0 z-[120] flex justify-end transition-all ${isOpen ? "visible" : "invisible"}`}>
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div className={`relative w-full md:max-w-md bg-white dark:bg-[#1a222c] h-full shadow-2xl transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"} overflow-y-auto flex flex-col`}>

        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X size={18} />
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 pt-10 pb-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-black overflow-hidden shrink-0">
              {applicant.photoURL ? (
                <img src={applicant.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{(applicant.firstName?.[0] || "") + (applicant.lastName?.[0] || "")}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-white truncate">
                {applicant.firstName} {applicant.lastName}
              </h2>
              <p className="text-blue-200 text-[11px] font-bold uppercase tracking-widest truncate">
                {applicant.position}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${STAGE_COLORS[applicant.stage] ?? 'bg-slate-400'}`} />
                <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                  {applicant.stage}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact Actions */}
          <div className="flex gap-2 mt-5">
            <a
              href={`mailto:${applicant.email}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl text-white text-xs font-bold transition-all"
            >
              <Mail size={13} /> Email
            </a>
            {applicant.phone && (
              <a
                href={`tel:${applicant.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl text-white text-xs font-bold transition-all"
              >
                <PhoneCall size={13} /> Call
              </a>
            )}
            {applicant.cvUrl && (
              <button
                onClick={openCV}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl text-white text-xs font-bold transition-all"
              >
                <FileText size={13} /> CV
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 space-y-6">

          {/* Hired Status Banner */}
          {isHired && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                This applicant has been hired and onboarded. Their account is active and the profile is now locked.
              </p>
            </div>
          )}

          {/* Finalize Hire CTA */}
          {applicant.stage === 'offer' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl">
              <h5 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1">Finalize Hire</h5>
              <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60 mb-4 leading-relaxed">
                Creating an account will automatically send a welcome email and onboarding instructions.
              </p>
              <button
                onClick={() => onHire(applicant)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={14} /> Complete Onboarding
              </button>
            </div>
          )}

          {/* Information Rows */}
          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Contact Information</h4>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
              <InfoRow icon={<Mail size={13} />} label="Email" value={applicant.email} href={`mailto:${applicant.email}`} />
              <InfoRow icon={<Phone size={13} />} label="Phone" value={applicant.phone || "—"} href={applicant.phone ? `tel:${applicant.phone}` : undefined} />
            </div>
          </section>

          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Application Details</h4>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
              <InfoRow icon={<Briefcase size={13} />} label="Position" value={applicant.position} />
              <InfoRow icon={<Building2 size={13} />} label="Department" value={applicant.department || "—"} />
              <InfoRow icon={<Globe size={13} />} label="Source" value={applicant.source || "—"} />
              <InfoRow icon={<Calendar size={13} />} label="Applied" value={appliedDate} />
            </div>
          </section>

          {/* Pipeline Management */}
          {!isHired && (
            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Update Pipeline Stage</h4>
              <div className="grid grid-cols-3 gap-2">
                {STAGES.filter(s => s !== 'hired').map((s) => (
                  <button
                    key={s}
                    onClick={() => onMoveStage(applicant.id, s)}
                    className={`py-2 rounded-xl text-[9px] font-bold uppercase border transition-all ${
                      applicant.stage === s
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => onHire(applicant)}
                  className="col-span-3 mt-1 py-2 rounded-xl text-[9px] font-bold uppercase border border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                >
                  ✓ Mark as Hired
                </button>
              </div>
            </section>
          )}

          {/* Feedback/Notes */}
          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <StickyNote size={12} /> Interview Notes
            </h4>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => onUpdateNotes(applicant.id, localNotes)}
              placeholder="Add interview feedback or internal notes..."
              disabled={isHired}
              className={`w-full h-28 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none italic text-slate-600 dark:text-slate-300 ${isHired ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

/* --- Internal Helper --- */
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, href }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <span className="text-slate-400 shrink-0">{icon}</span>
    <span className="text-[10px] font-black text-slate-400 uppercase w-20 shrink-0">{label}</span>
    {href ? (
      <a href={href} className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate hover:underline">
        {value}
      </a>
    ) : (
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{value}</span>
    )}
  </div>
);

export default ApplicantDetailModal;
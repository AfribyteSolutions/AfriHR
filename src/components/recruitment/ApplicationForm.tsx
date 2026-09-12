"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import InputField from "@/components/elements/SharedInputs/InputField";
import { base44 } from "@/lib/base44";

interface Props { onAddApplicant: (data: any) => Promise<void>; }

export default function ApplicationForm({ onAddApplicant }: Props) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      let resumeFileUri = "";
      if (cvFile) {
        if (cvFile.type !== "application/pdf" || cvFile.size > 10 * 1024 * 1024) {
          toast.error("CV must be a PDF smaller than 10 MB.");
          return;
        }
        resumeFileUri = (await base44.integrations.Core.UploadPrivateFile({ file: cvFile })).file_uri;
      }
      await onAddApplicant({
        full_name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        email: data.email, phone: data.phone, position: data.position,
        department: data.department, source: "internal", resume_file_uri: resumeFileUri
      });
      reset();
      setCvFile(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not save candidate.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="First Name" id="firstName" register={register("firstName", { required: true })} />
        <InputField label="Last Name" id="lastName" register={register("lastName", { required: true })} />
        <InputField label="Email" type="email" id="email" register={register("email", { required: true })} />
        <InputField label="Phone Number" type="tel" id="phone" register={register("phone")} />
        <InputField label="Position" id="position" register={register("position", { required: true })} />
        <InputField label="Department" id="department" register={register("department")} />
      </div>
      <label className="block p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-pointer">
        <input type="file" accept="application/pdf,.pdf" className="sr-only"
          onChange={e => setCvFile(e.target.files?.[0] || null)} />
        <span className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase">
          <FileText size={18} /> {cvFile ? cvFile.name : "Upload private CV (PDF, max 10 MB)"}
        </span>
      </label>
      <button type="submit" disabled={isSubmitting}
        className="w-full py-4 bg-blue-600 disabled:opacity-60 text-white rounded-2xl font-black uppercase tracking-widest">
        {isSubmitting ? "Saving..." : "Save Candidate"}
      </button>
    </form>
  );
}

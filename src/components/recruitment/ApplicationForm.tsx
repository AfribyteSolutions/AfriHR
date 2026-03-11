"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Camera, FileText } from "lucide-react";
import InputField from "@/components/elements/SharedInputs/InputField";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase"; // your firebase client init

interface ApplicationFormProps {
  onAddApplicant: (data: any) => void;
  isPublic?: boolean;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ onAddApplicant, isPublic = false }) => {
  const { user: userData } = useAuthUserContext() as any;
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'cv') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'photo') {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => setPreviewImg(reader.result as string);
    } else {
      setCvFile(file);
      setCvFileName(file.name);
      toast.success("CV Selected: " + file.name);
    }
  };

  const uploadToStorage = async (file: File, path: string): Promise<string> => {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const onSubmit = async (data: any) => {
    try {
      const companyId = userData?.companyId || (window as any).PUBLIC_COMPANY_ID;
      const timestamp = Date.now();

      let photoURL = "";
      let cvUrl = "";

      if (photoFile) {
        toast.loading("Uploading photo...");
        photoURL = await uploadToStorage(photoFile, `recruitment/${companyId}/${timestamp}_photo`);
      }

      if (cvFile) {
        toast.loading("Uploading CV...");
        cvUrl = await uploadToStorage(cvFile, `recruitment/${companyId}/${timestamp}_cv.pdf`);
      }

      toast.dismiss();

      const payload = {
        ...data,
        photoURL,
        cvUrl,
        companyId,
        appliedDate: new Date().toISOString(),
        stage: "application",
        source: isPublic ? "external" : "internal",
      };

      await onAddApplicant(payload);
      toast.success("Applicant added successfully");
      reset();
      setPreviewImg(null);
      setCvFileName(null);
      setCvFile(null);
      setPhotoFile(null);
    } catch (err) {
      toast.dismiss();
      toast.error("Submission failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-24 h-24 group">
          <div className="w-full h-full rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
            {previewImg ? <img src={previewImg} className="w-full h-full object-cover" /> : <Camera className="text-slate-400" />}
          </div>
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'photo')} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Photo</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField label="First Name" id="firstName" register={register("firstName", { required: true })} />
        <InputField label="Last Name" id="lastName" register={register("lastName", { required: true })} />
        <InputField label="Email" type="email" id="email" register={register("email", { required: true })} />
        <InputField label="Phone Number" type="tel" id="phone" register={register("phone", { required: true })} />
        <InputField label="Position" id="position" register={register("position", { required: true })} />
        <InputField label="Department" id="department" register={register("department")} />
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 relative">
        <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'cv')} />
        <div className="flex items-center gap-3 text-slate-500">
          <FileText size={18} />
          <span className="text-xs font-bold uppercase">
            {cvFileName ? `✅ ${cvFileName}` : "Upload CV (PDF Only)"}
          </span>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">
        {isSubmitting ? "Uploading..." : "Save Applicant"}
      </button>
    </form>
  );
};

export default ApplicationForm;
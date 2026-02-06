"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import { IDocument } from "@/interface/table.interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import { statePropsType } from "@/interface/common.interface";
import { toast } from "sonner";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuthUserContext } from "@/context/UserAuthContext";

const AddNewDocumentModal = ({ open, setOpen }: statePropsType) => {
  const { user: userData } = useAuthUserContext();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IDocument>();

  useEffect(() => {
    const fetchEmps = async () => {
      if (!userData?.companyId) return;
      const res = await fetch(`/api/company-employees?companyId=${userData.companyId}`);
      const result = await res.json();
      if (result.success) setEmployees(result.employees);
    };
    if (open) fetchEmps();
  }, [open, userData]);

  const onSubmit = async (data: any) => {
    const file = data.file[0];
    if (!file) return toast.error("Please select a file.");

    setLoading(true);
    try {
      const storageRef = ref(storage, `documents/${userData?.companyId}/${Date.now()}_${file.name}`);
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: data.fileName,
          fileUrl: downloadURL,
          userId: data.userId, // Recipient
          role: data.role,
          description: data.description,
          companyId: userData?.companyId,
          uploadedBy: userData?.uid, // Sender
        }),
      });

      if (res.ok) {
        toast.success("Document uploaded!");
        setOpen(false);
        reset();
        window.location.reload();
      }
    } catch (error: any) {
      toast.error("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title font-bold">Upload Document</h5>
          <button onClick={() => setOpen(false)} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <InputField 
            label="File Display Name" 
            id="fileName" 
            register={register("fileName", { required: "Required" })} 
            error={errors.fileName as any} 
          />
          
          <div className="form__input-box">
            <div className="form__input-title"><label>Assign to Employee (Recipient)</label></div>
            <select {...register("userId" as any, { required: "Required" })} className="w-full border p-2 rounded h-[45px]">
              <option value="">-- Select Recipient --</option>
              {employees.map(e => <option key={e.uid} value={e.uid}>{e.fullName}</option>)}
            </select>
          </div>

          <div className="form__input-box">
            <div className="form__input-title"><label>File</label></div>
            <input type="file" {...register("file" as any, { required: true })} className="form-control" accept=".pdf,.doc,.docx" />
          </div>

          <InputField label="Role/Category" id="role" register={register("role")} error={errors.role as any} />
          <InputField label="Description" id="description" isTextArea register={register("description")} error={errors.description as any} />

          <div className="submit__btn flex justify-end gap-2">
            <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Uploading..." : "Submit"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewDocumentModal;
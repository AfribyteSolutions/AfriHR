"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { IWarningData, IWarningFormInput } from "@/interface/table.interface";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useAuthUserContext } from "@/context/UserAuthContext";

interface WarningEditModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editData: IWarningData | null;
  onSuccess?: () => void;
}

const WarningEditModal = ({ open, setOpen, editData, onSuccess }: WarningEditModalProps) => {
  const [selectWarningDate, setSelectWarningDate] = useState<Date | null>(new Date());
  const [user] = useAuthState(auth);
  const { user: userData } = useAuthUserContext(); // Pulls companyId/role context
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("active");
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<IWarningFormInput>();

  useEffect(() => {
    if (editData && open) {
      setValue("subject", editData.subject || "");
      setValue("description", editData.description || "");
      
      const initialStatus = editData.status || "active";
      setStatus(initialStatus);

      if (editData.warningDate) {
        let dateValue: Date;
        const wd: any = editData.warningDate;
        if (wd && typeof wd === 'object' && 'seconds' in wd) {
          dateValue = new Date(wd.seconds * 1000);
        } else {
          dateValue = new Date(wd);
        }
        setSelectWarningDate(isNaN(dateValue.getTime()) ? new Date() : dateValue);
      }
    }
  }, [editData, open, setValue]);

  const onSubmit = async (data: IWarningFormInput) => {
    // SECURITY: Ensure both the user and their company association exist
    if (!user || !editData?.id || !userData?.companyId) {
      toast.error("User security context missing. Please refresh.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const payload = {
        warningId: editData.id,
        userId: user.uid,
        // CRITICAL: Ensure companyId is passed to prevent data orphanization
        companyId: editData.companyId || userData.companyId,
        subject: data.subject,
        description: data.description,
        warningDate: selectWarningDate ? selectWarningDate.toISOString() : new Date().toISOString(),
        status: status,
        updatedAt: new Date().toISOString() // Track when the update happened
      };

      const res = await fetch("/api/warnings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Warning updated successfully! 🎉");
        setOpen(false);
        if (onSuccess) onSuccess(); 
        else window.location.reload();
      } else {
        toast.error(result.message || "Update failed");
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle className="font-bold border-b">Edit Warning Record</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-6">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center mb-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block">Issued To</label>
              <p className="font-bold text-gray-800">{editData?.employeeName || "Staff Member"}</p>
            </div>
            <div className="text-right">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block">Current Status</label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {status}
              </span>
            </div>
          </div>

          <InputField
            label="Subject"
            id="subject"
            register={register("subject", { required: "Subject is required" })}
            error={errors.subject as any}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel label="Warning Date" id="date" />
              <div className="datepicker-style">
                <DatePicker
                  selected={selectWarningDate}
                  onChange={(date) => setSelectWarningDate(date)}
                  className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Change Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full border p-2 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          </div>

          <InputField
            label="Description"
            id="description"
            isTextArea={true}
            register={register("description", { required: "Description is required" })}
            error={errors.description as any}
          />

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button 
              type="button" 
              onClick={() => setOpen(false)} 
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md disabled:bg-gray-400 disabled:shadow-none transition-all"
            >
              {isSubmitting ? "Saving Changes..." : "Update Warning"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WarningEditModal;
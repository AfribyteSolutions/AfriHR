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

interface WarningEditModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editData: IWarningData | null;
  onSuccess?: () => void;
}

const WarningEditModal = ({ open, setOpen, editData, onSuccess }: WarningEditModalProps) => {
  const [selectWarningDate, setSelectWarningDate] = useState<Date | null>(new Date());
  const [user] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("active");
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<IWarningFormInput>();

  useEffect(() => {
    if (editData && open) {
      setValue("subject", editData.subject || "");
      setValue("description", editData.description || "");
      
      // FIX: Ensure status is initialized correctly
      const initialStatus = editData.status || "active";
      setStatus(initialStatus);

      if (editData.warningDate) {
        let dateValue: Date;
        const wd: any = editData.warningDate;
        if (wd.seconds) {
          dateValue = new Date(wd.seconds * 1000);
        } else {
          dateValue = new Date(wd);
        }
        setSelectWarningDate(isNaN(dateValue.getTime()) ? new Date() : dateValue);
      }
    }
  }, [editData, open, setValue]);

  const onSubmit = async (data: IWarningFormInput) => {
    if (!user || !editData?.id) return;
    setIsSubmitting(true);

    try {
      const payload = {
        warningId: editData.id,
        userId: user.uid,
        subject: data.subject,
        description: data.description,
        warningDate: selectWarningDate ? selectWarningDate.toISOString() : new Date().toISOString(),
        status: status, // State variable ensures this is not undefined
      };

      const res = await fetch("/api/warnings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Updated successfully");
        setOpen(false);
        if (onSuccess) onSuccess(); 
        else window.location.reload();
      } else {
        toast.error(result.message || "Update failed");
      }
    } catch (error) {
      toast.error("Update failed. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Edit Warning</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <label className="text-xs text-gray-500 block">Employee</label>
              <p className="font-bold text-gray-800">{editData?.employeeName || "Staff Member"}</p>
            </div>
          </div>

          <InputField
            label="Subject"
            id="subject"
            register={register("subject", { required: "Required" })}
            error={errors.subject as any}
          />

          <div>
            <FormLabel label="Warning Date" id="date" />
            <DatePicker
              selected={selectWarningDate}
              onChange={(date) => setSelectWarningDate(date)}
              className="form-control w-full border p-2 rounded"
              dateFormat="dd/MM/yyyy"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              className="w-full border p-2 rounded bg-white"
            >
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          <InputField
            label="Description"
            id="description"
            isTextArea={true}
            register={register("description", { required: "Required" })}
            error={errors.description as any}
          />

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? "Updating..." : "Update Warning"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WarningEditModal;
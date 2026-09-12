"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import { toast } from "sonner";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { base44 } from "@/lib/base44";

const AddWarningModal = ({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) => {
  const { user } = useAuthUserContext();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<{ uid: string; displayName: string }[]>([]);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user?.companyId) return;

      try {
        const results = await (base44.entities as any).User.filter({
          tenant_id: user.companyId,
        });
        setEmployees(
          (results || []).map((u: any) => ({
            uid: u.id,
            displayName: u.full_name || u.name || "Unknown",
          }))
        );
      } catch (error) {
        console.error("Error fetching company employees:", error);
      }
    };

    if (open) fetchEmployees();
  }, [open, user?.companyId]);

  const onSubmit = async (data: any) => {
    if (!user || !user?.companyId) {
      toast.error("User context not fully loaded. Try again.");
      return;
    }
    setLoading(true);

    try {
      const selectedEmp = employees.find(e => e.uid === data.employeeId);

      const payload = {
        companyId: user.companyId, 
        employeeId: data.employeeId,
        employeeName: selectedEmp?.displayName || "Unknown",
        managerId: user.uid,            
        subject: data.subject,
        description: data.description,
        warningDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "active"
      };

      const res = await fetch("/api/warnings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Warning issued!");
        reset();
        setOpen(false);
      } else {
        toast.error(result.message || "Failed to create");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle className="font-bold">Issue New Warning</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium">Employee</label>
            <select {...register("employeeId", { required: true })} className="w-full p-2 border rounded">
              <option value="">-- Select --</option>
              {employees.map(e => (
                <option key={e.uid} value={e.uid}>
                  {e.displayName}
                </option>
              ))}
            </select>
            {errors.employeeId && <span className="text-red-500 text-xs">Employee is required</span>}
          </div>
          <InputField 
            label="Subject" 
            id="subject" 
            register={register("subject", { required: true })} 
            error={errors.subject as any} 
          />
          <InputField 
            label="Description" 
            id="description" 
            isTextArea 
            register={register("description", { required: true })} 
            error={errors.description as any} 
          />
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWarningModal;

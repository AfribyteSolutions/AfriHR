"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useAuthUserContext } from "@/context/UserAuthContext";

import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import { IPromotion } from "@/interface/table.interface";
import { statePropsType } from "@/interface/common.interface";

const AddNewPromotionModal = ({ open, setOpen }: statePropsType) => {
  const [adminUser] = useAuthState(auth);
  const { user: userData } = useAuthUserContext(); // Get current admin's companyId
  
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectPromotionDate, setSelectPromotionDate] = useState<Date | null>(new Date());
  const [isManager, setIsManager] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IPromotion>();

  // Fetch employees belonging to the same company
  useEffect(() => {
    const fetchCompanyEmployees = async () => {
      if (!userData?.companyId) return;
      
      try {
        // Calling your company-employees API
        const res = await fetch(`/api/company-employees?companyId=${userData.companyId}&limit=100`);
        const result = await res.json();
        
        if (result.success) {
          setEmployees(result.employees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    if (open) fetchCompanyEmployees();
  }, [open, userData?.companyId]);

  const handleToggle = () => {
    reset();
    setOpen(!open);
  };

  const onSubmit = async (data: any) => {
    if (!adminUser || !userData?.companyId) {
      toast.error("Session error. Please refresh.");
      return;
    }

    // Find the full name of the selected employee for the record
    const selectedEmp = employees.find(e => e.uid === data.employeeId);

    setLoading(true);
    try {
      const payload = {
        ...data,
        promotedEmployee: selectedEmp?.fullName || "Unknown",
        employeeId: data.employeeId, // The UID for the promotion check
        companyId: userData.companyId,
        promotionDate: selectPromotionDate?.toISOString(),
        isManagerPromotion: isManager,
        createdBy: adminUser.uid,
      };

      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save promotion");

      toast.success("Promotion successfully recorded!");
      handleToggle();
      window.location.reload(); 
    } catch (error: any) {
      toast.error(error?.message || "Error saving promotion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title font-bold text-xl">Add New Promotion</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="card__wrapper">
            <div className="grid grid-cols-12 gap-x-5 gap-y-5">
              
              {/* Employee Selection */}
              <div className="col-span-12 md:col-span-6">
                <div className="form__input-box">
                  <div className="form__input-title">
                    <label className="text-sm font-medium">Employee Name <span className="text-red-500">*</span></label>
                  </div>
                  <select 
                    {...register("employeeId" as any, { required: "Select an employee" })} 
                    className="w-full p-2 border rounded h-[45px]"
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.uid} value={emp.uid}>
                        {emp.fullName} ({emp.position})
                      </option>
                    ))}
                  </select>
                  {errors.employeeId && <span className="text-red-500 text-xs">Employee is required</span>}
                </div>
              </div>

              {/* Designation */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="New Designation"
                  id="designation"
                  register={register("designation", { required: "Required" })}
                  error={errors.designation}
                />
              </div>

              {/* Promotion Title */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Promotion Title"
                  id="promotionTitle"
                  register={register("promotionTitle", { required: "Required" })}
                  error={errors.promotionTitle}
                />
              </div>

              {/* Promotion Date */}
              <div className="col-span-12 md:col-span-6">
                <FormLabel label="Promotion Date" id="date" />
                <div className="datepicker-style">
                  <DatePicker
                    selected={selectPromotionDate}
                    onChange={(date) => setSelectPromotionDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-full border p-2 rounded h-[45px]"
                  />
                </div>
              </div>

              {/* Ticking Box: Manager Promotion */}
              <div className="col-span-12">
                <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <input 
                    type="checkbox" 
                    id="isManager" 
                    checked={isManager}
                    onChange={(e) => setIsManager(e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-indigo-600"
                  />
                  <div>
                    <label htmlFor="isManager" className="cursor-pointer font-bold text-indigo-900 block leading-none">
                      Promote to Manager Role
                    </label>
                    <p className="text-xs text-indigo-700 mt-1">This will update system permissions for the employee.</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="col-span-12">
                <InputField
                  label="Description / Reason"
                  id="description"
                  isTextArea
                  register={register("description", { required: "Required" })}
                  error={errors.description}
                />
              </div>
            </div>
          </div>

          <div className="submit__btn flex items-center justify-end gap-[10px] mt-6">
            <button className="btn btn-secondary" type="button" onClick={handleToggle}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Processing..." : "Submit Promotion"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewPromotionModal;
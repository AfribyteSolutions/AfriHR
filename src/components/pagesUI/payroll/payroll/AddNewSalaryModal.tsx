"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import { IPaylist } from "@/interface/table.interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import { toast } from "sonner";
import { statePropsType } from "@/interface/common.interface";
import useAuth from "@/hooks/useAuth"; // must return { user: { uid, companyId } }

type Option = { 
  label: string; 
  value: string; 
  email?: string; 
  role?: string; 
  createdAt?: string;
};

interface AddNewSalaryModalProps extends statePropsType {
  onSuccess?: () => void;
}

const AddNewSalaryModal = ({ open, setOpen, onSuccess }: AddNewSalaryModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IPaylist>();

  const { user } = useAuth();
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      if (!user?.companyId) return;
      setFetchingUsers(true);
      try {
        const res = await fetch(
          `/api/user-data?companyId=${user.companyId}&roles=admin,employee`
        );
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch users");
        }

        // Map users to options with email, role, createdAt
        const opts: Option[] = json.users.map((u: any) => ({
          value: u.uid,
          label: u.fullName || u.name || u.email || `User ${u.uid.slice(0, 8)}`,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        }));

        setEmployeeOptions(opts);
      } catch (e: any) {
        console.error("Failed to load users:", e);
        toast.error(e.message || "Failed to load employees/admins.");
      } finally {
        setFetchingUsers(false);
      }
    };

    if (open) {
      loadUsers();
    }
  }, [user?.companyId, open]);

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      reset();
    }
  };

  const onSubmit = async (data: IPaylist) => {
    try {
      setSubmitting(true);

      if (!user?.companyId) {
        toast.error("Missing company information.");
        return;
      }
      if (!data?.employeeName) {
        toast.error("Please select an employee/admin.");
        return;
      }

      // Find full employee details
      const selectedEmployee = employeeOptions.find(
        (opt) => opt.value === data.employeeName
      );

      const payload = {
        companyId: user.companyId,
        createdBy: user.uid,

        // Employee details
        employeeUid: data.employeeName,
        employeeName: selectedEmployee?.label || "Unknown",
        employeeEmail: selectedEmployee?.email || "",
        employeeRole: selectedEmployee?.role || "",
        employeeJoinDate: selectedEmployee?.createdAt || "",

        employeeDisplay: {
          uid: data.employeeName,
          name: selectedEmployee?.label,
          email: selectedEmployee?.email,
          role: selectedEmployee?.role,
          joinDate: selectedEmployee?.createdAt,
        },

        // Earnings
        salaryMonthly: Number(data.salaryMonthly) || 0,
        dearnessAllowance: Number(data.dearnessAllowance) || 0,
        transportAllowance: Number(data.transportAllowance) || 0,
        mobileAllowance: Number(data.mobileAllowance) || 0,
        bonusAllowance: Number(data.bonusAllowance) || 0,
        others: Number((data as any).others) || 0,

        // Deductions
        providentFund: Number(data.providentFund) || 0,
        securityDeposit: Number(data.securityDeposit) || 0,
        personalLoan: Number(data.personalLoan) || 0,
        earlyLeaving: Number(data.earlyLeaving) || 0,

        // Totals
        totalEarnings:
          (Number(data.salaryMonthly) || 0) +
          (Number(data.dearnessAllowance) || 0) +
          (Number(data.transportAllowance) || 0) +
          (Number(data.mobileAllowance) || 0) +
          (Number(data.bonusAllowance) || 0) +
          (Number((data as any).others) || 0),

        totalDeductions:
          (Number(data.providentFund) || 0) +
          (Number(data.securityDeposit) || 0) +
          (Number(data.personalLoan) || 0) +
          (Number(data.earlyLeaving) || 0),

        netPay:
          ((Number(data.salaryMonthly) || 0) +
            (Number(data.dearnessAllowance) || 0) +
            (Number(data.transportAllowance) || 0) +
            (Number(data.mobileAllowance) || 0) +
            (Number(data.bonusAllowance) || 0) +
            (Number((data as any).others) || 0)) -
          ((Number(data.providentFund) || 0) +
            (Number(data.securityDeposit) || 0) +
            (Number(data.personalLoan) || 0) +
            (Number(data.earlyLeaving) || 0)),

        createdAt: new Date().toISOString(),
      };

      console.log("Submitting payroll payload:", payload);

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.status === 409) {
        toast.error(result.message || "Payroll already exists for this employee.");
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to save payroll");
      }

      toast.success("Payroll added successfully!");
      setOpen(false);
      reset();
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error("Error adding payroll:", error);
      toast.error(error?.message || "Failed to save payroll.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between">
          <h5 className="modal-title">Add Employee Salary</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>

      <DialogContent className="common-scrollbar overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 gap-y-2.5">
            {/* Employee/Admin Selector */}
            <div className="col-span-12">
              <div className="card__wrapper">
                <label className="form-label">Select Employee *</label>
                <select 
                  {...register("employeeName", {
                    required: "Please select an employee/admin"
                  })}
                  className="form-control"
                  disabled={fetchingUsers || submitting}
                >
                  <option value="">
                    {fetchingUsers ? "Loading employees..." : "Select Employee"}
                  </option>
                  {employeeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.employeeName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.employeeName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Earnings */}
            <div className="col-span-12">
              <div className="card__wrapper">
                <h6 className="card__sub-title mb-10">Earning</h6>
                <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Basic Salary (BASIC)"
                      id="salaryMonthly"
                      type="number"
                      register={register("salaryMonthly", {
                        required: "Basic Salary is required",
                        valueAsNumber: true,
                        min: { value: 0, message: "Salary cannot be negative" }
                      })}
                      error={errors.salaryMonthly as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Dearness Allowance (DA)"
                      id="dearnessAllowance"
                      type="number"
                      register={register("dearnessAllowance", { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={errors.dearnessAllowance as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Transport Allowance (TA)"
                      id="transportAllowance"
                      type="number"
                      register={register("transportAllowance", { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={errors.transportAllowance as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Mobile Allowance (MA)"
                      id="mobileAllowance"
                      type="number"
                      register={register("mobileAllowance", { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={errors.mobileAllowance as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Bonus Allowance (BA)"
                      id="bonusAllowance"
                      type="number"
                      register={register("bonusAllowance", { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={errors.bonusAllowance as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Others"
                      id="others"
                      type="number"
                      register={register("others" as any, { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={(errors as any).others}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="col-span-12">
              <div className="card__wrapper">
                <h6 className="card__sub-title mb-10">Deduction</h6>
                <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Provident Fund (PF)"
                      id="providentFund"
                      type="number"
                      register={register("providentFund", { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={errors.providentFund as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Security Deposit (SD)"
                      id="securityDeposit"
                      type="number"
                      register={register("securityDeposit", { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={errors.securityDeposit as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Personal Loan (PL)"
                      id="personalLoan"
                      type="number"
                      register={register("personalLoan", { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={errors.personalLoan as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Early Leaving (EL)"
                      id="earlyLeaving"
                      type="number"
                      register={register("earlyLeaving", { 
                        valueAsNumber: true,
                        min: { value: 0, message: "Amount cannot be negative" }
                      })}
                      error={errors.earlyLeaving as any}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="submit__btn text-center">
            <button 
              className="btn btn-primary" 
              type="submit" 
              disabled={fetchingUsers || submitting}
            >
              {submitting ? "Adding Payroll..." : fetchingUsers ? "Loading..." : "Submit"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewSalaryModal;

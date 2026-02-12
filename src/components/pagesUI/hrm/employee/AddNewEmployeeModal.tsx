/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { statePropsType } from "@/interface/common.interface";
import { employeeDesignationData } from "@/data/dropdown-data";
import { useForm, Controller } from "react-hook-form";
import { IEmployee } from "@/interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { toast } from "sonner";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

// 🔹 Enhanced Form Type to include Reporting Structure
type FormEmployee = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  userName: string;
  employeeID: string;
  address: string;
  designation: string;
  managerId: string; // Added for DB connection
  department: string; // Added for DB connection
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  photo?: FileList;
};

interface Manager {
  uid: string;
  fullName: string;
  position: string;
  department: string;
}

interface GroupedManagers {
  [department: string]: Manager[];
}

interface AddNewEmployeeModalProps extends statePropsType {
  onRefresh?: () => void;
}

const AddNewEmployeeModal = ({ open, setOpen, onRefresh }: AddNewEmployeeModalProps) => {
  const [user] = useAuthState(auth);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(new Date());
  const [fetchingManagers, setFetchingManagers] = useState(false);
  const [groupedManagers, setGroupedManagers] = useState<GroupedManagers>({});
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormEmployee>();

  const handleToggle = () => setOpen(!open);

  // 🔹 Fetch Company and Manager Data on Modal Open
  useEffect(() => {
    if (open && user) {
      const initData = async () => {
        setFetchingManagers(true);
        try {
          // 1. Get current user's company
          const res = await fetch(`/api/user-data?uid=${user.uid}`);
          const data = await res.json();
          const companyId = data?.user?.companyId;
          
          if (companyId) {
            setUserCompanyId(companyId);
            // 2. Fetch all employees in company to act as potential managers
            const mRes = await fetch(`/api/company-employees?companyId=${companyId}`);
            const mData = await mRes.json();

            if (mData.success) {
              const grouped = mData.employees.reduce((acc: GroupedManagers, emp: Manager) => {
                const dept = emp.department || "Unassigned";
                acc[dept] = acc[dept] || [];
                acc[dept].push(emp);
                return acc;
              }, {});
              setGroupedManagers(grouped);
            }
          }
        } catch (err) {
          toast.error("Failed to load reporting structure");
        } finally {
          setFetchingManagers(false);
        }
      };
      initData();
    }
  }, [open, user]);

  // 🔹 Submission Logic connected to your API
  const onSubmit = async (form: FormEmployee) => {
    if (!userCompanyId) {
      toast.error("Company session not found");
      return;
    }

    const toastId = toast.loading("Onboarding employee...");

    try {
      const payload = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        position: form.designation, // mapping designation to position
        department: form.department,
        managerId: form.managerId,
        companyId: userCompanyId,
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
        role: "employee",
        status: "active",
        dateOfJoining: selectStartDate ? selectStartDate.toISOString() : null,
        bankAccount: {
          accountHolderName: form.accountHolderName,
          accountNumber: form.accountNumber,
          bankName: form.bankName,
          branchName: form.branchName,
        }
      };

      const res = await fetch("/api/add-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success("Employee onboarded successfully", { id: toastId });
      reset();
      if (onRefresh) onRefresh();
      setTimeout(() => setOpen(false), 800);
    } catch (error) {
      toast.error("Failed to onboard employee", { id: toastId });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleToggle} 
      fullWidth 
      maxWidth="md"
      container={() => document.body}
      PaperProps={{
        className: "dark:!bg-[#1a222c] bg-white transition-colors duration-300 shadow-xl overflow-hidden"
      }}
    >
      <DialogTitle className="border-b border-slate-100 dark:border-slate-800 dark:!bg-[#1a222c] !p-5">
        <div className="flex justify-between items-center">
          <div>
            <h5 className="text-lg font-bold text-slate-800 dark:text-white">Employee Onboarding</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fill in the details to add a new member to the team</p>
          </div>
          <button onClick={handleToggle} type="button" className="text-slate-400 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>

      <DialogContent className="common-scrollbar !p-6 bg-[#f1f5f9] dark:!bg-[#1a222c]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            
            {/* Basic Information Section */}
            <div className="bg-white dark:!bg-[#24303f] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-6">Basic Information</h2>
              <div className="grid grid-cols-12 gap-y-6 gap-x-6">
                <div className="col-span-12 md:col-span-6">
                  <InputField label="First Name" id="firstName" register={register("firstName", { required: "Required" })} error={errors.firstName} />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField label="Last Name" id="lastName" register={register("lastName", { required: "Required" })} error={errors.lastName} />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField label="Email Address" type="email" id="email" register={register("email", { required: "Required" })} error={errors.email} />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField label="Contact Number" id="phone" register={register("phone", { required: "Required" })} error={errors.phone} />
                </div>
              </div>
            </div>

            {/* Reporting & Structure */}
            <div className="bg-white dark:!bg-[#24303f] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-6">Organization Structure</h2>
              <div className="grid grid-cols-12 gap-y-6 gap-x-6">
                <div className="col-span-12 md:col-span-6">
                  <InputField label="Department" id="department" register={register("department", { required: "Required" })} error={errors.department} />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <SelectBox id="designation" label="Designation" options={employeeDesignationData} control={control} isRequired />
                </div>
                
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Reports To (Manager) <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("managerId", { required: "Manager is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a222c] px-4 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Select a manager</option>
                    {Object.keys(groupedManagers).map((dept) => (
                      <optgroup key={dept} label={dept} className="dark:bg-[#24303f]">
                        {groupedManagers[dept].map((m) => (
                          <option key={m.uid} value={m.uid}>
                            {m.fullName} — {m.position}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.managerId && <p className="text-red-500 text-xs mt-1">{errors.managerId.message}</p>}
                </div>

                <div className="col-span-12 md:col-span-6">
                  <FormLabel label="Joining Date" id="selectJoiningDate" />
                  <div className="datepicker-style">
                    <DatePicker
                      id="selectJoiningDate"
                      selected={selectStartDate}
                      onChange={(date) => setSelectStartDate(date as Date | null)}
                      dateFormat="dd/MM/yyyy"
                      className="w-full bg-transparent dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white dark:!bg-[#24303f] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-6">Financial Information</h2>
              <div className="grid grid-cols-12 gap-y-6 gap-x-6">
                <div className="col-span-12 md:col-span-6">
                  <InputField label="Account Holder" id="accountHolderName" register={register("accountHolderName")} />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField label="Account Number" id="accountNumber" register={register("accountNumber")} />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField label="Bank Name" id="bankName" register={register("bankName")} />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField label="Branch" id="branchName" register={register("branchName")} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pb-4">
            <button 
              type="button" 
              onClick={handleToggle}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all"
            >
              {isSubmitting ? "Onboarding..." : "Onboard Employee"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewEmployeeModal;
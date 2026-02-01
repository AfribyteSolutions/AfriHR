"use client";
import React, { useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { IPaylist } from "@/interface/payroll.interface";
import { useForm } from "react-hook-form";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { employeeDropdownData } from "@/data/dropdown-data";
import InputField from "@/components/elements/SharedInputs/InputField";
import { toast } from "sonner";

interface EditSalaryModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editData: IPaylist | null;
  onSave: () => void; // Trigger a refresh in the parent
}

const EditSalaryModal = ({
  open,
  setOpen,
  editData,
  onSave,
}: EditSalaryModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IPaylist>();

  // This is the CRITICAL fix for the "doesn't show data" issue
  useEffect(() => {
    if (open && editData) {
      reset(editData);
    }
  }, [open, editData, reset]);

  const handleToggle = () => setOpen(false);

  const onSubmit = async (data: IPaylist) => {
    if (!editData?.id) {
      toast.error("No payroll record ID found.");
      return;
    }

    try {
      // Calculate totals accurately
      const totalEarnings =
        (Number(data.salaryMonthly) || 0) +
        (Number(data.dearnessAllowance) || 0) +
        (Number(data.transportAllowance) || 0) +
        (Number(data.mobileAllowance) || 0) +
        (Number(data.bonusAllowance) || 0) +
        (Number((data as any).others) || 0);

      const totalDeductions =
        (Number(data.providentFund) || 0) +
        (Number(data.securityDeposit) || 0) +
        (Number(data.personalLoan) || 0) +
        (Number(data.earlyLeaving) || 0);

      const netPay = totalEarnings - totalDeductions;

      const payload = {
        ...data,
        totalEarnings,
        totalDeductions,
        netPay,
        updatedAt: new Date().toISOString(),
      };

      // Perform the ACTUAL update call
      const response = await fetch(`/api/payroll?id=${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save changes to database");

      toast.success("Salary updated successfully");
      onSave(); // Refresh the table
      handleToggle(); // Close modal
    } catch (error: any) {
      console.error("Error updating salary:", error);
      toast.error(error?.message || "An error occurred while saving.");
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title">Edit Employee Salary</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="common-scrollbar overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
          <div className="grid grid-cols-12 gap-y-4">
            {/* Employee Name */}
            <div className="col-span-12">
              <div className="card__wrapper">
                <SelectBox
                  id="employeeName"
                  label="Employee Name"
                  // Pass the value explicitly so it shows the current selection
                  defaultValue={editData?.employeeName}
                  isRequired={true}
                  options={employeeDropdownData}
                  control={control}
                  error={errors.employeeName as any}
                />
              </div>
            </div>

            {/* Earnings */}
            <div className="col-span-12">
              <div className="card__wrapper">
                <h6 className="card__sub-title mb-10">Earnings</h6>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Basic Salary"
                      id="salaryMonthly"
                      type="number"
                      register={register("salaryMonthly")}
                      error={errors.salaryMonthly as any}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="DA Allowance"
                      id="dearnessAllowance"
                      type="number"
                      register={register("dearnessAllowance")}
                    />
                  </div>
                  {/* ... Add other earning fields similarly ... */}
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Others"
                      id="others"
                      type="number"
                      register={register("others" as any)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="col-span-12">
              <div className="card__wrapper">
                <h6 className="card__sub-title mb-10">Deductions</h6>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Provident Fund"
                      id="providentFund"
                      type="number"
                      register={register("providentFund")}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Security Deposit"
                      id="securityDeposit"
                      type="number"
                      register={register("securityDeposit")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="submit__btn text-center mt-10">
            <button className="btn btn-primary" type="submit">
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSalaryModal;
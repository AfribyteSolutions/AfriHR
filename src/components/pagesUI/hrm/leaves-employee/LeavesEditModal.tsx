"use client";
import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { IEmployeeLeave } from "@/interface/table.interface";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import DatePicker from "react-datepicker";
import { leaveEmployeeStatePropsType } from "@/interface/common.interface";
import { toast } from "sonner";

interface LeavesEditModalProps extends leaveEmployeeStatePropsType {
  onRefresh?: () => void;
}

const LeavesEditModal = ({
  open,
  setOpen,
  editData,
  onRefresh,
}: LeavesEditModalProps) => {
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(
    editData?.startDate ? new Date(editData.startDate) : new Date()
  );
  const [selectEndDate, setSelectEndDate] = useState<Date | null>(
    editData?.endDate ? new Date(editData.endDate) : new Date()
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IEmployeeLeave>({
    defaultValues: {
      leaveType: editData?.leaveType,
      leaveDuration: editData?.leaveDuration,
      reason: editData?.reason,
    },
  });
  const handleToggle = () => setOpen(!open);

  // Handle update leave
  const onSubmit = async (data: IEmployeeLeave) => {
    try {
      const updateData = {
        leaveType: data.leaveType,
        startDate: selectStartDate?.toISOString(),
        endDate: selectEndDate?.toISOString(),
        reason: data.reason,
        status: editData?.status || "pending",
      };

      const res = await fetch(`/api/leaves?id=${editData?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to update leave");
      }

      toast.success("Leave updated successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 800);
    } catch (error: any) {
      toast.error(
        error?.message ||
          "An error occurred while updating the leave. Please try again!"
      );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Employee Leave Edit</h5>
            <button
              onClick={handleToggle}
              type="button"
              className="bd-btn-close"
            >
              <i className="fa-solid fa-xmark-large"></i>
            </button>
          </div>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-12">
              <div className="col-span-12">
                <div className="card__wrapper mb-20">
                  <div className="grid grid-cols-12 gap-x-5 gap-y-5 maxXs:gap-x-0">
                    <div className="col-span-12 md:col-span-6">
                      <InputField
                        label="Leave Type"
                        id="leaveType"
                        type="text"
                        required={false}
                        register={register("leaveType")}
                        error={errors.leaveType}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <InputField
                        label="Leave Duration"
                        id="leaveDuration"
                        type="text"
                        required={false}
                        register={register("leaveDuration")}
                        error={errors.leaveDuration}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormLabel
                        label="Start Date"
                        id="selectStartDate"
                        optional
                      />
                      <div className="datepicker-style">
                        <DatePicker
                          id="selectStartDate"
                          selected={selectStartDate}
                          onChange={(date) => setSelectStartDate(date)}
                          showYearDropdown
                          showMonthDropdown
                          useShortMonthInDropdown
                          showPopperArrow={false}
                          peekNextMonth
                          dropdownMode="select"
                          isClearable
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Start date"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <FormLabel label="End Date" id="selectEndDate" optional />
                      <div className="datepicker-style">
                        <DatePicker
                          id="selectEndDate"
                          selected={selectEndDate}
                          onChange={(date) => setSelectEndDate(date)}
                          showYearDropdown
                          showMonthDropdown
                          useShortMonthInDropdown
                          showPopperArrow={false}
                          peekNextMonth
                          dropdownMode="select"
                          isClearable
                          dateFormat="dd/MM/yyyy"
                          placeholderText="End date"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="col-span-12">
                      <InputField
                        label="Reason"
                        id="reason"
                        isTextArea={true}
                        required={false}
                        register={register("reason")}
                        error={errors.reason}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="submit__btn text-center">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Submit"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeavesEditModal;

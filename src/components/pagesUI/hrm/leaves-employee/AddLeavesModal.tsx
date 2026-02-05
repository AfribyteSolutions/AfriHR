"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { IEmployeeLeave } from "@/interface/table.interface";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { statePropsType } from "@/interface/common.interface";
import { toast } from "sonner";
import { useAuthUserContext } from "@/context/UserAuthContext";

interface AddLeavesModalProps extends statePropsType {
  onRefresh?: () => void;
}

const AddLeavesModal = ({ open, setOpen, onRefresh }: AddLeavesModalProps) => {
  const { user: authUser } = useAuthUserContext();
  const [managerInfo, setManagerInfo] = useState<any>(null);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(
    new Date()
  );
  const [selectEndDate, setSelectEndDate] = useState<Date | null>(new Date());
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IEmployeeLeave>();

  // Fetch manager info for the employee
  useEffect(() => {
    const fetchManagerInfo = async () => {
      if (!authUser?.uid) return;

      try {
        // Get employee's manager from their profile
        const res = await fetch(`/api/user-data?uid=${authUser.uid}`);
        const data = await res.json();

        if (data.success && data.user?.managerId) {
          setManagerInfo({
            id: data.user.managerId,
            name: data.user.managerName,
          });
        }
      } catch (error) {
        console.error("Error fetching manager info:", error);
      }
    };

    fetchManagerInfo();
  }, [authUser]);

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: IEmployeeLeave) => {
    if (!authUser || !authUser.companyId) {
      toast.error("You must be logged in");
      return;
    }

    try {
      // Calculate days between dates
      const start = selectStartDate;
      const end = selectEndDate;
      const days = start && end
        ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1;

      const leaveData = {
        employeeId: authUser.uid,
        employeeName: authUser.displayName || authUser.email,
        leaveType: data.leaveType,
        leaveDuration: data.leaveDuration,
        startDate: selectStartDate?.toISOString(),
        endDate: selectEndDate?.toISOString(),
        days: days,
        reason: data.reason,
        companyId: authUser.companyId,
        managerId: managerInfo?.id,
      };

      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to submit leave request");
      }

      toast.success("Leave request submitted successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 800);
    } catch (error: any) {
      toast.error(
        error?.message ||
          "An error occurred while submitting the leave request. Please try again!"
      );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Add Employee Leave</h5>
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
                        register={register("leaveType", {
                          required: "Leave Type is required",
                        })}
                        error={errors.leaveType}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <InputField
                        label="Leave Duration"
                        id="leaveDuration"
                        type="text"
                        required={false}
                        register={register("leaveDuration", {
                          required: "Leave Duration is required",
                        })}
                        error={errors.leaveDuration}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormLabel label="Start Date" id="selectStartDate" />
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
                      <FormLabel label="End Date" id="selectEndDate" />
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
                        required={true}
                        register={register("reason", {
                          required: "Reason is required",
                        })}
                        error={errors.reason}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="submit__btn text-center">
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddLeavesModal;

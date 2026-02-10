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

// Predefined leave types
const leaveTypes = [
  { value: "Annual Leave", label: "Annual Leave" },
  { value: "Sick Leave", label: "Sick Leave" },
  { value: "Maternity Leave", label: "Maternity Leave" },
  { value: "Paternity Leave", label: "Paternity Leave" },
  { value: "Study Leave", label: "Study Leave" },
  { value: "Unpaid Leave", label: "Unpaid Leave" },
  { value: "Emergency Leave", label: "Emergency Leave" },
  { value: "Bereavement Leave", label: "Bereavement Leave" },
  { value: "Custom", label: "Other/Custom" },
];

// Predefined durations
const leaveDurations = [
  { value: "0.5", label: "Half Day" },
  { value: "1", label: "1 Day" },
  { value: "2", label: "2 Days" },
  { value: "3", label: "3 Days" },
  { value: "5", label: "1 Week (5 Days)" },
  { value: "10", label: "2 Weeks (10 Days)" },
  { value: "Custom", label: "Custom Duration" },
];

const AddLeavesModal = ({ open, setOpen, onRefresh }: AddLeavesModalProps) => {
  const { user: authUser } = useAuthUserContext();
  const [managerInfo, setManagerInfo] = useState<any>(null);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(
    new Date()
  );
  const [selectEndDate, setSelectEndDate] = useState<Date | null>(new Date());
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
  const [customLeaveType, setCustomLeaveType] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
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

  // Auto-calculate end date when duration is selected
  useEffect(() => {
    if (selectedDuration && selectedDuration !== "Custom" && selectStartDate) {
      const days = parseFloat(selectedDuration);
      const endDate = new Date(selectStartDate);

      if (days < 1) {
        // For half day, end date is same as start date
        setSelectEndDate(endDate);
      } else {
        // Add days (excluding weekends for business days)
        let addedDays = 0;
        while (addedDays < days - 1) {
          endDate.setDate(endDate.getDate() + 1);
          // Skip weekends (optional - remove this if you want to include weekends)
          if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
            addedDays++;
          }
        }
        setSelectEndDate(endDate);
      }
      setValue("leaveDuration", `${days} ${days === 0.5 ? "Half Day" : days === 1 ? "Day" : "Days"}`);
    }
  }, [selectedDuration, selectStartDate, setValue]);

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
        employeeName: (authUser as any).displayName || authUser.email,
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
                      <FormLabel label="Leave Type" id="leaveTypeSelect" />
                      <select
                        id="leaveTypeSelect"
                        className="form-control"
                        value={selectedLeaveType}
                        onChange={(e) => {
                          setSelectedLeaveType(e.target.value);
                          if (e.target.value !== "Custom") {
                            setValue("leaveType", e.target.value);
                          }
                        }}
                      >
                        <option value="">Select Leave Type</option>
                        {leaveTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.leaveType && (
                        <span className="text-red-500 text-sm">{errors.leaveType.message}</span>
                      )}
                    </div>

                    {selectedLeaveType === "Custom" && (
                      <div className="col-span-12 md:col-span-6">
                        <InputField
                          label="Custom Leave Type"
                          id="customLeaveType"
                          type="text"
                          value={customLeaveType}
                          onChange={(e) => {
                            setCustomLeaveType(e.target.value);
                            setValue("leaveType", e.target.value);
                          }}
                          required={true}
                          register={register("leaveType", {
                            required: "Custom leave type is required",
                          })}
                          error={errors.leaveType}
                        />
                      </div>
                    )}

                    <div className="col-span-12 md:col-span-6">
                      <FormLabel label="Duration" id="durationSelect" />
                      <select
                        id="durationSelect"
                        className="form-control"
                        value={selectedDuration}
                        onChange={(e) => {
                          setSelectedDuration(e.target.value);
                          if (e.target.value !== "Custom") {
                            const days = parseFloat(e.target.value);
                            setValue("leaveDuration", `${days} ${days === 0.5 ? "Half Day" : days === 1 ? "Day" : "Days"}`);
                          }
                        }}
                      >
                        <option value="">Select Duration</option>
                        {leaveDurations.map((duration) => (
                          <option key={duration.value} value={duration.value}>
                            {duration.label}
                          </option>
                        ))}
                      </select>
                      {errors.leaveDuration && (
                        <span className="text-red-500 text-sm">{errors.leaveDuration.message}</span>
                      )}
                    </div>

                    {selectedDuration === "Custom" && (
                      <div className="col-span-12 md:col-span-6">
                        <InputField
                          label="Custom Duration"
                          id="customDuration"
                          type="text"
                          placeholder="e.g., 3 Days, 1 Month"
                          required={true}
                          register={register("leaveDuration", {
                            required: "Custom duration is required",
                          })}
                          error={errors.leaveDuration}
                        />
                      </div>
                    )}

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

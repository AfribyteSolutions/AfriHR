"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, CircularProgress } from "@mui/material";
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
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(new Date());
  const [selectEndDate, setSelectEndDate] = useState<Date | null>(new Date());
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
  const [customLeaveType, setCustomLeaveType] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  
  // Track current employee leave metrics
  const [leaveBalance, setLeaveBalance] = useState<{
    total: number;
    remaining: number;
    taken: number;
    percentage: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<IEmployeeLeave>();

  // Fetch manager info and leave balance for the employee
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!authUser?.uid) return;

      try {
        setLoadingData(true);
        const res = await fetch(`/api/user-data?uid=${authUser.uid}`);
        const data = await res.json();

        if (data.success && data.user) {
          // Set Manager Info
          if (data.user.managerId) {
            setManagerInfo({
              id: data.user.managerId,
              name: data.user.managerName,
            });
          }

          // Set Leave Balance Info
          const total = Number(data.user.totalLeaveDays) || 0;
          const remaining = Number(data.user.remainingLeaveDays) || 0;
          const taken = Math.max(0, total - remaining);
          const percentage = total > 0 ? (taken / total) * 100 : 0;

          setLeaveBalance({
            total,
            remaining,
            taken,
            percentage,
          });
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (open) {
      fetchEmployeeData();
    }
  }, [authUser, open]);

  // Auto-calculate end date when duration is selected
  useEffect(() => {
    if (selectedDuration && selectedDuration !== "Custom" && selectStartDate) {
      const days = parseFloat(selectedDuration);
      const endDate = new Date(selectStartDate);

      if (days < 1) {
        setSelectEndDate(endDate);
      } else {
        let addedDays = 0;
        while (addedDays < days - 1) {
          endDate.setDate(endDate.getDate() + 1);
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

    // Calculate requested days
    const start = selectStartDate;
    const end = selectEndDate;
    const requestedDays = start && end
      ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1;

    // Validation: Check if requested days exceed remaining balance
    if (leaveBalance && requestedDays > leaveBalance.remaining) {
      toast.error(`Insufficient leave balance. You only have ${leaveBalance.remaining} days remaining.`);
      return;
    }

    try {
      const leaveData = {
        employeeId: authUser.uid,
        employeeName: (authUser as any).displayName || authUser.email,
        leaveType: data.leaveType,
        leaveDuration: data.leaveDuration,
        startDate: selectStartDate?.toISOString(),
        endDate: selectEndDate?.toISOString(),
        days: requestedDays,
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
        error?.message || "An error occurred while submitting the leave request. Please try again!"
      );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Add Employee Leave</h5>
            <button onClick={handleToggle} type="button" className="bd-btn-close">
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
                    
                    {/* 📊 Leave Balance Progress Tracker */}
                    <div className="col-span-12">
                      {loadingData ? (
                        <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <CircularProgress size={20} />
                          <span className="text-sm">Updating your leave balance...</span>
                        </div>
                      ) : leaveBalance && (
                        <div className="bg-slate-50 dark:bg-[#1a222c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-2">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-sm font-semibold text-slate-700 dark:text-white">Your Leave Balance</h6>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {leaveBalance.remaining} Days Remaining
                            </span>
                          </div>
                          
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full transition-all duration-300"
                              style={{ width: `${leaveBalance.percentage}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center mt-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>Total Entitlement: <strong>{leaveBalance.total}</strong></span>
                            <span>Used: <strong>{leaveBalance.taken}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>

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
                          const val = e.target.value;
                          setSelectedDuration(val);
                          if (val !== "Custom" && val !== "") {
                            const days = parseFloat(val);
                            setValue("leaveDuration", `${days} ${days === 0.5 ? "Half Day" : days === 1 ? "Day" : "Days"}`);
                          } else {
                            setValue("leaveDuration", "");
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
                          placeholder="e.g., 3 Days, 70 Days"
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
              <button type="submit" className="btn btn-primary" disabled={loadingData}>
                {loadingData ? "Updating Balance..." : "Submit Request"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddLeavesModal;
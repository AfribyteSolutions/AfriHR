"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, CircularProgress } from "@mui/material";
import InputField from "@/components/elements/SharedInputs/InputField";
import { IAdminLeave } from "@/interface/table.interface";
import { useForm } from "react-hook-form";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { statePropsType } from "@/interface/common.interface";
import { toast } from "sonner";
import { useAuthUserContext } from "@/context/UserAuthContext";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";

interface AddAdminLeaveModalProps extends statePropsType {
  onRefresh?: () => void;
}

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

const leaveDurations = [
  { value: "0.5", label: "Half Day" },
  { value: "1", label: "1 Day" },
  { value: "2", label: "2 Days" },
  { value: "3", label: "3 Days" },
  { value: "5", label: "1 Week (5 Days)" },
  { value: "10", label: "2 Weeks (10 Days)" },
  { value: "Custom", label: "Custom Duration" },
];

const AddAdminLeaveModal = ({
  open,
  setOpen,
  onRefresh,
}: AddAdminLeaveModalProps) => {
  const { user: authUser } = useAuthUserContext();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(new Date());
  const [selectEndDate, setSelectEndDate] = useState<Date | null>(new Date());
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
  const [customLeaveType, setCustomLeaveType] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  
  // Track selected employee leave metrics
  const [selectedEmployeeLeaveData, setSelectedEmployeeLeaveData] = useState<{
    total: number;
    remaining: number;
    taken: number;
    percentage: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<IAdminLeave>();

  // Watch selected employee name
  const watchedEmployeeId = watch("employeeName");

  // Fetch employees for the company
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!authUser?.companyId) return;

      try {
        setLoadingEmployees(true);
        const res = await fetch(
          `/api/company-employees?companyId=${authUser.companyId}`,
        );
        const data = await res.json();

        if (data.success && Array.isArray(data.employees)) {
          setEmployees(data.employees); // Save raw data to access stats
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to load employee list");
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (open) {
      fetchEmployees();
    }
  }, [authUser, open]);

  // Update visual progress when employee changes
  useEffect(() => {
    if (watchedEmployeeId && employees.length > 0) {
      const empData = employees.find(
        (emp) => (emp.uid || emp.id) === watchedEmployeeId
      );

      if (empData) {
        const total = Number(empData.totalLeaveDays) || 0;
        const remaining = Number(empData.remainingLeaveDays) || 0;
        const taken = Math.max(0, total - remaining);
        const percentage = total > 0 ? (taken / total) * 100 : 0;

        setSelectedEmployeeLeaveData({
          total,
          remaining,
          taken,
          percentage,
        });
      } else {
        setSelectedEmployeeLeaveData(null);
      }
    } else {
      setSelectedEmployeeLeaveData(null);
    }
  }, [watchedEmployeeId, employees]);

  // Map employees for dropdown
  const employeeOptions = employees.map((emp) => ({
    value: emp.uid || emp.id,
    label: emp.fullName || emp.name,
  }));

  // Auto-calculate end date when duration is selected
  useEffect(() => {
    // We only auto-calculate and set the form value if it's NOT custom.
    // If it IS custom, we let the user type manually in the InputField.
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
      setValue(
        "leaveDuration",
        `${days} ${days === 0.5 ? "Half Day" : days === 1 ? "Day" : "Days"}`,
      );
    }
  }, [selectedDuration, selectStartDate, setValue]);

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: IAdminLeave) => {
    if (!authUser || !authUser.companyId) {
      toast.error("You must be logged in");
      return;
    }

    try {
      const selectedEmployee = employeeOptions.find(
        (emp) => emp.value === data.employeeName,
      );

      const start = selectStartDate;
      const end = selectEndDate;
      
      // Calculate numeric days for backend logic
      const calculatedDays =
        start && end
          ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          : 1;

      const leaveData = {
        employeeId: data.employeeName,
        employeeName: selectedEmployee?.label || data.employeeName,
        leaveType: data.leaveType,
        leaveDuration: data.leaveDuration, // This will be the manual text if Custom was used
        startDate: selectStartDate?.toISOString(),
        endDate: selectEndDate?.toISOString(),
        days: calculatedDays,
        reason: data.reason,
        companyId: authUser.companyId,
        managerId: authUser.uid,
      };

      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create leave");
      }

      toast.success("Leave added successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 800);
    } catch (error: any) {
      toast.error(
        error?.message || "An error occurred while creating the leave. Please try again!",
      );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Add Admin Leave</h5>
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
                  <div className="grid grid-cols-12 gap-x-5 maxXs:gap-x-0 gap-y-5">
                    
                    <div className="col-span-12 md:col-span-6">
                      {loadingEmployees ? (
                        <div className="flex flex-col gap-2">
                          <FormLabel label="Select Employee" id="employeeLoading" />
                          <div className="flex items-center gap-2 form-control bg-slate-50 dark:bg-slate-800 border-none">
                            <CircularProgress size={16} />
                            <span className="text-sm text-slate-500">Fetching employees...</span>
                          </div>
                        </div>
                      ) : (
                        <SelectBox
                          id="employeeName"
                          label="Select Employee"
                          options={employeeOptions}
                          control={control}
                          error={errors.employeeName}
                          isRequired={true}
                        />
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

                    {selectedEmployeeLeaveData && !loadingEmployees && (
                      <div className="col-span-12 bg-slate-50 dark:bg-[#1a222c] p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-2 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-sm font-semibold text-slate-700 dark:text-white">Employee Leave Balance</h6>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {selectedEmployeeLeaveData.remaining} Days Left
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${selectedEmployeeLeaveData.percentage}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center mt-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>Total Allocation: <strong>{selectedEmployeeLeaveData.total}</strong></span>
                          <span>Used: <strong>{selectedEmployeeLeaveData.taken}</strong></span>
                        </div>
                      </div>
                    )}

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
                          // Clear the form value when switching to Custom to ensure user input is fresh
                          if (val === "Custom") {
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
                          label="Enter Custom Duration"
                          id="customDuration"
                          type="text"
                          placeholder="e.g., 70 Days, 3 Weeks"
                          required={true}
                          register={register("leaveDuration", {
                            required: "Please specify the duration",
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
                      <FormLabel label="Deadline" id="deadline" />
                      <div className="datepicker-style">
                        <DatePicker
                          id="deadline"
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
                          placeholderText="Deadline"
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
              <button type="submit" className="btn btn-primary" disabled={loadingEmployees}>
                {loadingEmployees ? "Please wait..." : "Submit"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddAdminLeaveModal;
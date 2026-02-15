import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import InputField from "@/components/elements/SharedInputs/InputField";
import SelectWithImage from "@/components/elements/SharedInputs/SelectWithImage";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import { toast } from "sonner";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { statePropsType } from "@/interface/common.interface";
import { IEmployee } from "@/interface";

interface MarkAttendanceModalProps extends statePropsType {
  selectedDate: string;
  onRefresh?: () => void;
}

interface AttendanceFormData {
  status: string;
  checkIn: string;
  checkOut: string;
  notes: string;
}

const statusOptions = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "leave", label: "On Leave" },
  { value: "weekend", label: "Weekend" },
  { value: "holiday", label: "Holiday" },
];

const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  open,
  setOpen,
  selectedDate,
  onRefresh,
}) => {
  const { user: authUser } = useAuthUserContext();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AttendanceFormData>({
    defaultValues: {
      status: "present",
      checkIn: "09:00",
      checkOut: "17:00",
    },
  });

  const checkInTime = watch("checkIn");
  const checkOutTime = watch("checkOut");

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!authUser?.companyId) return;

      try {
        const res = await fetch(
          `/api/company-employees?companyId=${authUser.companyId}`
        );
        const data = await res.json();

        if (data.success) {
          setEmployees(data.employees || []);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, [authUser?.companyId]);

  const calculateWorkHours = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;

    const [inHour, inMin] = checkIn.split(":").map(Number);
    const [outHour, outMin] = checkOut.split(":").map(Number);

    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;

    const diffMinutes = outMinutes - inMinutes;
    return diffMinutes / 60;
  };

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: AttendanceFormData) => {
    if (!authUser?.companyId || !selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    try {
      setSubmitting(true);

      const checkInDateTime = new Date(`${selectedDate}T${data.checkIn}:00`);
      const checkOutDateTime = data.checkOut
        ? new Date(`${selectedDate}T${data.checkOut}:00`)
        : null;

      const workHours = data.checkOut
        ? calculateWorkHours(data.checkIn, data.checkOut)
        : 0;

      const attendanceData = {
        companyId: authUser.companyId,
        employeeId: selectedEmployee.uid,
        employeeName: selectedEmployee.fullName,
        date: selectedDate,
        checkIn: checkInDateTime.toISOString(),
        checkOut: checkOutDateTime?.toISOString() || null,
        status: data.status,
        workHours: workHours,
        notes: data.notes || "",
        markedBy: authUser.uid,
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to mark attendance");
      }

      toast.success("Attendance marked successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 1000);
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to mark attendance. Please try again!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title font-bold text-lg">Mark Attendance</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large text-gray-500 text-xl"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6 mt-6">
            {/* Date (Read-only) */}
            <div className="col-span-12">
              <div className="from__input-box">
                <div className="form__input-title">
                  <label>Date</label>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <p className="font-medium">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Employee Selection */}
            <div className="col-span-12">
              <div className="from__input-box select-wrapper">
                <div className="form__input-title">
                  <label htmlFor="employee">
                    Employee <span>*</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="mz-default-select">
                    <SelectWithImage
                      data={employees}
                      selectedValue={selectedEmployee}
                      valueKey="fullName"
                      displayKey="fullName"
                      imageKey="profilePictureUrl"
                      placeholder="Select Employee"
                      onChange={setSelectedEmployee}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="col-span-12 md:col-span-6">
              <SelectBox
                id="status"
                label="Status"
                options={statusOptions}
                control={control}
                rules={{ required: "Status is required" }}
                error={errors.status}
              />
            </div>

            {/* Work Hours Display */}
            <div className="col-span-12 md:col-span-6">
              <div className="from__input-box">
                <div className="form__input-title">
                  <label>Work Hours</label>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <p className="font-medium">
                    {calculateWorkHours(checkInTime, checkOutTime).toFixed(1)} hours
                  </p>
                </div>
              </div>
            </div>

            {/* Check In Time */}
            <div className="col-span-12 md:col-span-6">
              <InputField
                label="Check In Time"
                id="checkIn"
                type="time"
                register={register("checkIn", {
                  required: "Check in time is required",
                })}
                error={errors.checkIn}
                required
              />
            </div>

            {/* Check Out Time */}
            <div className="col-span-12 md:col-span-6">
              <InputField
                label="Check Out Time"
                id="checkOut"
                type="time"
                register={register("checkOut")}
                error={errors.checkOut}
              />
            </div>

            {/* Notes */}
            <div className="col-span-12">
              <InputField
                label="Notes (Optional)"
                id="notes"
                isTextArea={true}
                placeholder="Add any additional notes..."
                register={register("notes")}
                error={errors.notes}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit__btn text-center mt-6">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Marking..." : "Mark Attendance"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAttendanceModal;

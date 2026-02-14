import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import InputField from "@/components/elements/SharedInputs/InputField";
import SelectWithImage from "@/components/elements/SharedInputs/SelectWithImage";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { useAuth } from "@/context/UserAuthContext";
import { statePropsType } from "@/interface/common.interface";
import { IEmployee } from "@/interface";

interface AddReportModalProps extends statePropsType {
  onRefresh?: () => void;
}

interface ReportFormData {
  reportType: string;
  title: string;
  content: string;
  rating?: number;
  status: string;
}

const reportTypes = [
  { value: "performance", label: "Performance Review" },
  { value: "review", label: "General Review" },
  { value: "warning", label: "Warning" },
  { value: "feedback", label: "Feedback" },
  { value: "termination", label: "Termination" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
];

const AddReportModal: React.FC<AddReportModalProps> = ({
  open,
  setOpen,
  onRefresh,
}) => {
  const { user: authUser } = useAuth();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [selectDate, setSelectDate] = useState<Date | null>(new Date());
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReportFormData>();

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

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: ReportFormData) => {
    if (!authUser?.companyId || !authUser?.id || !selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    try {
      setSubmitting(true);

      const reportData = {
        companyId: authUser.companyId,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.fullName,
        reportType: data.reportType,
        title: data.title,
        content: data.content,
        rating: data.rating || null,
        createdBy: authUser.id,
        createdByName: authUser.fullName,
        date: selectDate?.toISOString() || new Date().toISOString(),
        status: data.status || "draft",
        attachments: [],
        relatedDocuments: [],
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create report");
      }

      toast.success("Report created successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 1000);
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to create report. Please try again!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title font-bold text-lg">Create Employee Report</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large text-gray-500 text-xl"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6 mt-6">
            {/* Employee Selection */}
            <div className="col-span-12 md:col-span-6">
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

            {/* Report Type */}
            <div className="col-span-12 md:col-span-6">
              <SelectBox
                id="reportType"
                label="Report Type"
                options={reportTypes}
                control={control}
                rules={{ required: "Report type is required" }}
                error={errors.reportType}
              />
            </div>

            {/* Title */}
            <div className="col-span-12">
              <InputField
                label="Report Title"
                id="title"
                placeholder="Enter report title"
                register={register("title", {
                  required: "Title is required",
                })}
                error={errors.title}
                required
              />
            </div>

            {/* Rating (Optional) */}
            <div className="col-span-12 md:col-span-6">
              <InputField
                label="Rating (1-5)"
                id="rating"
                type="number"
                placeholder="Enter rating (optional)"
                register={register("rating", {
                  min: { value: 1, message: "Minimum rating is 1" },
                  max: { value: 5, message: "Maximum rating is 5" },
                })}
                error={errors.rating}
              />
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

            {/* Date */}
            <div className="col-span-12 md:col-span-6">
              <FormLabel label="Report Date" id="selectDate" />
              <div className="datepicker-style">
                <DatePicker
                  id="selectDate"
                  selected={selectDate}
                  onChange={(date) => setSelectDate(date)}
                  showYearDropdown
                  showMonthDropdown
                  useShortMonthInDropdown
                  showPopperArrow={false}
                  peekNextMonth
                  dropdownMode="select"
                  isClearable
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select date"
                  className="w-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="col-span-12">
              <InputField
                label="Report Content"
                id="content"
                isTextArea={true}
                placeholder="Enter detailed report content..."
                register={register("content", {
                  required: "Content is required",
                })}
                error={errors.content}
                required
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
              {submitting ? "Creating..." : "Create Report"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddReportModal;

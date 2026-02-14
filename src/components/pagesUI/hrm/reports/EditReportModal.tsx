import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { statePropsType } from "@/interface/common.interface";

interface EditReportModalProps extends statePropsType {
  editData: any;
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

const EditReportModal: React.FC<EditReportModalProps> = ({
  open,
  setOpen,
  editData,
  onRefresh,
}) => {
  const [selectDate, setSelectDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ReportFormData>();

  // Initialize form with editData
  useEffect(() => {
    if (editData) {
      setValue("reportType", editData.reportType);
      setValue("title", editData.title);
      setValue("content", editData.content);
      setValue("rating", editData.rating);
      setValue("status", editData.status);

      if (editData.date) {
        try {
          const date = editData.date.seconds
            ? new Date(editData.date.seconds * 1000)
            : new Date(editData.date);
          setSelectDate(date);
        } catch {
          setSelectDate(new Date());
        }
      }
    }
  }, [editData, setValue]);

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: ReportFormData) => {
    if (!editData?.id) {
      toast.error("Report ID is missing");
      return;
    }

    try {
      setSubmitting(true);

      const updateData: any = {
        reportType: data.reportType,
        title: data.title,
        content: data.content,
        rating: data.rating || null,
        status: data.status,
      };

      if (selectDate) {
        updateData.date = selectDate.toISOString();
      }

      const res = await fetch(`/api/reports?id=${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to update report");
      }

      toast.success("Report updated successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 1000);
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to update report. Please try again!"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title font-bold text-lg">Update Report</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large text-gray-500 text-xl"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6 mt-6">
            {/* Employee (Read-only) */}
            <div className="col-span-12">
              <div className="from__input-box">
                <div className="form__input-title">
                  <label>Employee</label>
                </div>
                <div className="bg-gray-100 p-3 rounded">
                  <p className="font-medium">{editData?.employeeName || "N/A"}</p>
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
                error={errors.reportType}
              />
            </div>

            {/* Status */}
            <div className="col-span-12 md:col-span-6">
              <SelectBox
                id="status"
                label="Status"
                options={statusOptions}
                control={control}
                error={errors.status}
              />
            </div>

            {/* Title */}
            <div className="col-span-12">
              <InputField
                label="Report Title"
                id="title"
                placeholder="Enter report title"
                register={register("title")}
                error={errors.title}
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

            {/* Date */}
            <div className="col-span-12 md:col-span-6">
              <FormLabel label="Report Date" id="selectDate" optional />
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
                register={register("content")}
                error={errors.content}
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
              {submitting ? "Updating..." : "Update Report"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditReportModal;

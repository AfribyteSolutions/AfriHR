import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import InputField from "@/components/elements/SharedInputs/InputField";
import { toast } from "sonner";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { statePropsType } from "@/interface/common.interface";

interface ReportFeedbackModalProps extends statePropsType {
  feedbackId: string;
  onRefresh?: () => void;
}

interface ReportFormData {
  reason: string;
  description: string;
}

const reportReasons = [
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "inaccurate", label: "Inaccurate Information" },
  { value: "spam", label: "Spam" },
  { value: "offensive", label: "Offensive Language" },
];

const ReportFeedbackModal: React.FC<ReportFeedbackModalProps> = ({
  open,
  setOpen,
  feedbackId,
  onRefresh,
}) => {
  const { user: authUser } = useAuthUserContext();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReportFormData>();

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: ReportFormData) => {
    if (!authUser?.id) {
      toast.error("Authentication required");
      return;
    }

    try {
      setSubmitting(true);

      const reportData = {
        feedbackId,
        reportedBy: authUser.id,
        reportedByName: authUser.fullName,
        reason: data.reason,
        description: data.description || "",
      };

      const res = await fetch("/api/feedback/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to report feedback");
      }

      toast.success("Feedback reported successfully. Admins have been notified.");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 1000);
    } catch (error: any) {
      toast.error(error?.message || "Failed to report feedback. Please try again!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title font-bold text-lg">Report Feedback</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large text-gray-500 text-xl"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 gap-y-6 mt-6">
            {/* Reason */}
            <div className="col-span-12">
              <SelectBox
                id="reason"
                label="Reason for Report"
                options={reportReasons}
                control={control}
                rules={{ required: "Please select a reason" }}
                error={errors.reason}
              />
            </div>

            {/* Description */}
            <div className="col-span-12">
              <InputField
                label="Additional Details (Optional)"
                id="description"
                isTextArea={true}
                placeholder="Provide more details about why you're reporting this feedback..."
                register={register("description")}
                error={errors.description}
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
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportFeedbackModal;

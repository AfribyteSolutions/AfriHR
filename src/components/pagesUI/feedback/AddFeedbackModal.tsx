"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { toast } from "sonner";
import { statePropsType } from "@/interface/common.interface";
import { useAuthUserContext } from "@/context/UserAuthContext";

interface AddFeedbackModalProps extends statePropsType {
  onRefresh?: () => void;
}

interface FeedbackFormData {
  toEmployeeId: string;
  feedbackType: string;
  category: string;
  rating: string | number;
  subject: string;
  message: string;
  isPrivate: boolean;
}

const feedbackTypes = [
  { value: "positive", label: "Positive" },
  { value: "constructive", label: "Constructive" },
  { value: "performance_review", label: "Performance Review" },
  { value: "general", label: "General" },
];

const categories = [
  { value: "performance", label: "Performance" },
  { value: "behavior", label: "Behavior" },
  { value: "skills", label: "Skills" },
  { value: "teamwork", label: "Teamwork" },
  { value: "communication", label: "Communication" },
  { value: "general", label: "General" },
];

const ratings = [
  { value: "1", label: "1 Star" },
  { value: "2", label: "2 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "5", label: "5 Stars" },
];

const AddFeedbackModal: React.FC<AddFeedbackModalProps> = ({
  open,
  setOpen,
  onRefresh,
}) => {
  const { user: authUser } = useAuthUserContext();
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FeedbackFormData>();

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!authUser?.companyId) return;

      try {
        const res = await fetch(
          `/api/company-employees?companyId=${authUser.companyId}`,
        );
        const data = await res.json();

        if (data.success && Array.isArray(data.employees)) {
          const employeeOptions = data.employees.map((emp: any) => ({
            value: emp.uid || emp.id,
            label: emp.fullName || emp.name,
          }));
          setEmployees(employeeOptions);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (open) fetchEmployees();
  }, [authUser, open]);

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: FeedbackFormData) => {
    if (!authUser) {
      toast.error("You must be logged in");
      return;
    }

    try {
      const selectedEmployee = employees.find(
        (emp) => emp.value === data.toEmployeeId,
      );

      const feedbackData = {
        toEmployeeId: data.toEmployeeId,
        toEmployeeName: selectedEmployee?.label || "Unknown",
        fromManagerId: authUser.uid,
        // Using fullName as per the sidebar changes update
        fromManagerName: (authUser as any).fullName || authUser.email || "Manager",
        feedbackType: data.feedbackType,
        category: data.category,
        rating: Number(data.rating),
        subject: data.subject,
        message: data.message,
        isPrivate: data.isPrivate,
        companyId: authUser.companyId,
      };

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      toast.success("Feedback submitted successfully! 🎉");
      reset();

      if (onRefresh) onRefresh();
      setTimeout(() => setOpen(false), 800);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between items-center">
          <h5 className="modal-title font-bold text-xl">Give Feedback</h5>
          <button onClick={handleToggle} type="button" className="text-gray-500 hover:text-red-500 transition-colors">
             <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="common-scrollbar overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
          <div className="grid grid-cols-12 gap-5">
            {/* Employee Selection */}
            <div className="col-span-12 md:col-span-6">
              <SelectBox
                id="toEmployeeId"
                label="Select Employee"
                options={employees}
                control={control}
                error={errors.toEmployeeId}
              />
            </div>

            {/* Feedback Type */}
            <div className="col-span-12 md:col-span-6">
              <SelectBox
                id="feedbackType"
                label="Feedback Type"
                options={feedbackTypes}
                control={control}
                error={errors.feedbackType}
              />
            </div>

            {/* Category */}
            <div className="col-span-12 md:col-span-6">
              <SelectBox
                id="category"
                label="Category"
                options={categories}
                control={control}
                error={errors.category}
              />
            </div>

            {/* Rating */}
            <div className="col-span-12 md:col-span-6">
              <SelectBox
                id="rating"
                label="Rating"
                options={ratings}
                control={control}
                error={errors.rating}
              />
            </div>

            {/* Subject */}
            <div className="col-span-12">
              <InputField
                label="Subject"
                id="subject"
                type="text"
                register={register("subject", { required: "Subject is required" })}
                error={errors.subject}
              />
            </div>

            {/* Message */}
            <div className="col-span-12">
              <label className="block mb-2 text-sm font-medium">Message <span className="text-red-500">*</span></label>
              <textarea
                id="message"
                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                rows={5}
                placeholder="Enter your feedback message..."
                {...register("message", { required: "Message is required" })}
              />
              {errors.message && <span className="text-red-500 text-xs mt-1">{errors.message.message}</span>}
            </div>

            {/* Private Checkbox */}
            <div className="col-span-12 flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                className="w-4 h-4 text-blue-600 rounded"
                {...register("isPrivate")}
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-600 cursor-pointer">
                Keep this feedback private (employee won&apos;t see it)
              </label>
            </div>
          </div>

          <div className="mt-8 mb-4 text-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all disabled:opacity-50"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFeedbackModal;
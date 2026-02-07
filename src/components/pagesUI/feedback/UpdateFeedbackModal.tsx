"use client";
import React from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { toast } from "sonner";
import { IFeedback } from "./FeedbackMainArea";

interface UpdateFeedbackModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editData: IFeedback;
  onRefresh?: () => void;
}

interface FeedbackUpdateData {
  feedbackType: string;
  category: string;
  rating: number;
  subject: string;
  message: string;
  isPrivate: boolean;
  status: string;
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

const statusOptions = [
  { value: "sent", label: "Sent" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "archived", label: "Archived" },
];

const UpdateFeedbackModal: React.FC<UpdateFeedbackModalProps> = ({
  open,
  setOpen,
  editData,
  onRefresh,
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackUpdateData>({
    defaultValues: {
      feedbackType: editData.feedbackType,
      category: editData.category,
      rating: editData.rating || 3,
      subject: editData.subject,
      message: editData.message,
      isPrivate: editData.isPrivate,
      status: editData.status,
    },
  });

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: FeedbackUpdateData) => {
    try {
      const updateData = {
        feedbackType: data.feedbackType,
        category: data.category,
        rating: parseInt(data.rating.toString()),
        subject: data.subject,
        message: data.message,
        isPrivate: data.isPrivate,
        status: data.status,
      };

      const res = await fetch(`/api/feedback?id=${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to update feedback");
      }

      toast.success("Feedback updated successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 800);
    } catch (error: any) {
      toast.error(error.message || "Failed to update feedback");
      console.error("Error updating feedback:", error);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between">
          <h5 className="modal-title">Update Feedback</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="common-scrollbar overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
            <div className="col-span-12">
              <div className="card__wrapper mb-20">
                {/* Display Employee Info (Read-only) */}
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        To Employee:
                      </p>
                      <p className="font-semibold">{editData.toEmployeeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        From Manager:
                      </p>
                      <p className="font-semibold">
                        {editData.fromManagerName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
                  {/* Feedback Type */}
                  <div className="col-span-12 md:col-span-6">
                    <SelectBox
                      id="feedbackType"
                      label="Feedback Type"
                      options={feedbackTypes}
                      control={control}
                      error={errors.feedbackType}
                      isRequired={true}
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
                      isRequired={true}
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

                  {/* Subject */}
                  <div className="col-span-12">
                    <InputField
                      label="Subject"
                      id="subject"
                      type="text"
                      register={register("subject", {
                        required: "Subject is required",
                      })}
                      error={errors.subject}
                      required={true}
                    />
                  </div>

                  {/* Message */}
                  <div className="col-span-12">
                    <div className="from__input-box">
                      <div className="form__input-title">
                        <label htmlFor="message">
                          Message <span>*</span>
                        </label>
                      </div>
                      <div className="form__input">
                        <textarea
                          id="message"
                          className="form-control"
                          rows={5}
                          placeholder="Enter your feedback message..."
                          {...register("message", {
                            required: "Message is required",
                          })}
                        />
                        {errors.message && (
                          <span className="text-red-500 text-sm">
                            {errors.message.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Private Checkbox */}
                  <div className="col-span-12">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isPrivate"
                        {...register("isPrivate")}
                      />
                      <label className="form-check-label" htmlFor="isPrivate">
                        Keep this feedback private (employee won&apos;t see it)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="submit__btn text-center">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Feedback"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateFeedbackModal;

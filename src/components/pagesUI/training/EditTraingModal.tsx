import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { trainingStatuses } from "@/data/dropdown-data";
import { ITraining } from "@/interface/table.interface";
import { useForm } from "react-hook-form";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { traineeStatePropsType } from "@/interface/common.interface";

interface EditTrainingModalProps extends traineeStatePropsType {
  onRefresh?: () => void;
}

const EditTraingModal = ({
  open,
  setOpen,
  editData,
  onRefresh,
}: EditTrainingModalProps) => {
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(null);
  const [selectEndDate, setSelectEndDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ITraining>();

  // Initialize form with editData
  useEffect(() => {
    if (editData) {
      setValue("title", editData.title);
      setValue("description", editData.description);
      setValue("status", editData.status);
      setValue("duration", editData.duration);
      setValue("cost", editData.cost);
      setValue("location", editData.location);

      if (editData.startDate) {
        setSelectStartDate(new Date(editData.startDate));
      }
      if (editData.endDate) {
        setSelectEndDate(new Date(editData.endDate));
      }
    }
  }, [editData, setValue]);

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: ITraining) => {
    if (!editData?.id) {
      toast.error("Training ID is missing");
      return;
    }

    try {
      setSubmitting(true);

      const updateData: any = {
        status: data.status,
      };

      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.duration) updateData.duration = data.duration;
      if (data.cost !== undefined) updateData.cost = data.cost;
      if (data.location) updateData.location = data.location;
      if (selectStartDate) updateData.startDate = selectStartDate.toISOString();
      if (selectEndDate) updateData.endDate = selectEndDate.toISOString();

      const res = await fetch(`/api/training?id=${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to update training");
      }

      toast.success("Training updated successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 1000);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update training. Please try again!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
        <DialogTitle>
          <div className="flex justify-between items-center">
            <h5 className="modal-title font-bold text-lg">Update Training</h5>
            <button
              onClick={handleToggle}
              type="button"
              className="bd-btn-close"
            >
              <i className="fa-solid fa-xmark-large text-gray-500 text-xl"></i>
            </button>
          </div>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6 mt-6">
              {/* Training Title */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Training Title"
                  id="title"
                  placeholder="Enter training title"
                  register={register("title")}
                  error={errors.title}
                />
              </div>

              {/* Status */}
              <div className="col-span-12 md:col-span-6">
                <SelectBox
                  id="status"
                  label="Status"
                  isRequired={false}
                  options={trainingStatuses}
                  control={control}
                  error={errors.status}
                />
              </div>

              {/* Start Date */}
              <div className="col-span-12 md:col-span-6">
                <FormLabel label="Start Date" id="selectStartDate" optional />
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

              {/* End Date */}
              <div className="col-span-12 md:col-span-6">
                <FormLabel label="End Date" id="selectEndDate" optional />
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

              {/* Duration */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Duration"
                  id="duration"
                  placeholder="e.g., 5 days, 2 weeks"
                  register={register("duration")}
                  error={errors.duration}
                />
              </div>

              {/* Cost */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Cost"
                  id="cost"
                  type="number"
                  placeholder="Enter cost"
                  register={register("cost")}
                  error={errors.cost}
                />
              </div>

              {/* Location */}
              <div className="col-span-12">
                <InputField
                  label="Location"
                  id="location"
                  placeholder="Enter location"
                  register={register("location")}
                  error={errors.location}
                />
              </div>

              {/* Description */}
              <div className="col-span-12">
                <InputField
                  label="Description"
                  id="description"
                  isTextArea={true}
                  required={false}
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
                {submitting ? "Updating..." : "Update Training"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditTraingModal;

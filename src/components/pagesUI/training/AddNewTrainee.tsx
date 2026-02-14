import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { trainingStatuses, trainingTitles } from "@/data/dropdown-data";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import { ITraining } from "@/interface/table.interface";
import { IEmployee } from "@/interface";
import { useForm } from "react-hook-form";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import InputField from "@/components/elements/SharedInputs/InputField";
import SelectWithImage from "@/components/elements/SharedInputs/SelectWithImage";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { statePropsType } from "@/interface/common.interface";
import { useAuth } from "@/context/UserAuthContext";

interface AddNewTraineeProps extends statePropsType {
  onRefresh?: () => void;
}

const AddNewTrainee = ({ open, setOpen, onRefresh }: AddNewTraineeProps) => {
  const { user: authUser } = useAuth();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<IEmployee | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<IEmployee[]>([]);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(new Date());
  const [selectEndDate, setSelectEndDate] = useState<Date | null>(new Date());
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ITraining>();

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!authUser?.companyId) return;

      try {
        const res = await fetch(`/api/company-employees?companyId=${authUser.companyId}`);
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

  const onSubmit = async (data: ITraining) => {
    if (!authUser?.companyId || !selectedTrainer) {
      toast.error("Please select a trainer");
      return;
    }

    if (!selectStartDate || !selectEndDate) {
      toast.error("Please select start and end dates");
      return;
    }

    try {
      setSubmitting(true);

      const trainingData = {
        companyId: authUser.companyId,
        title: data.trainingTitle,
        description: data.description || "",
        trainerId: selectedTrainer.id,
        trainerName: selectedTrainer.fullName,
        trainerEmail: selectedTrainer.email,
        category: data.category || "General",
        startDate: selectStartDate.toISOString(),
        endDate: selectEndDate.toISOString(),
        duration: data.duration || "",
        cost: data.cost || 0,
        location: data.location || "",
        maxParticipants: data.maxParticipants || 0,
        enrolledEmployees: selectedEmployees.map((emp) => emp.id) || [],
        status: data.status || "upcoming",
        materials: [],
        createdBy: authUser.id,
        createdByName: authUser.fullName,
      };

      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trainingData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create training");
      }

      toast.success("Training created successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 1000);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create training. Please try again!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
        <DialogTitle>
          <div className="flex justify-between items-center">
            <h5 className="modal-title font-bold text-lg">Create New Training</h5>
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
            <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6 mt-10">
              {/* Training Title */}
              <div className="col-span-12 md:col-span-6">
                <SelectBox
                  id="trainingTitle"
                  label="Training Title"
                  options={trainingTitles}
                  control={control} // Validation rule
                  error={errors.trainingTitle}
                />
              </div>

              {/* Trainer Name */}
              <div className="col-span-12 md:col-span-6">
                <div className="from__input-box select-wrapper">
                  <div className="form__input-title">
                    <label htmlFor="trainer">
                      Trainer <span>*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <div className="mz-default-select">
                      <SelectWithImage
                        data={employees}
                        selectedValue={selectedTrainer}
                        valueKey="fullName"
                        displayKey="fullName"
                        imageKey="profilePictureUrl"
                        placeholder="Select Trainer"
                        onChange={setSelectedTrainer}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Duration (e.g., 5 days, 2 weeks)"
                  id="duration"
                  placeholder="Enter training duration"
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
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Location"
                  id="location"
                  placeholder="Enter location"
                  register={register("location")}
                  error={errors.location}
                />
              </div>

              {/* Start Date */}
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
              {/* End Date */}
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

              {/* Status */}
              <div className="col-span-12 md:col-span-6">
                <SelectBox
                  id="status"
                  label="Status"
                  options={trainingStatuses}
                  control={control} // Validation rule
                  error={errors.status}
                />
              </div>

              {/* Description */}
              <div className="col-span-12">
                <InputField
                  label="Description"
                  id="description"
                  isTextArea={true}
                  required={true}
                  register={register("description", {
                    required: "Description is required",
                  })}
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
                {submitting ? "Creating..." : "Create Training"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddNewTrainee;

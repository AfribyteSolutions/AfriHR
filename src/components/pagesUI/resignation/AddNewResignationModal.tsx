"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { ITrainer } from "@/interface/dropdown.interface";
import { IResignation } from "@/interface/table.interface";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import SelectWithImage from "@/components/elements/SharedInputs/SelectWithImage";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { statePropsType } from "@/interface/common.interface";
import { useAuthUserContext } from "@/context/UserAuthContext";

interface AddNewResignationModalProps extends statePropsType {
  onRefresh?: () => void;
}

const AddNewResignationModal = ({ open, setOpen, onRefresh }: AddNewResignationModalProps) => {
  const { user: authUser } = useAuthUserContext();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<ITrainer | null>(null);
  const [selectResignationDate, setSelectResignationDate] =
    useState<Date | null>(new Date());
  const [selectLastWorkingDate, setSelectLastWorkingDate] =
    useState<Date | null>(new Date());
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IResignation>();

  // Fetch employees for the company
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!authUser?.companyId) return;

      try {
        const res = await fetch(`/api/company-employees?companyId=${authUser.companyId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.employees)) {
          setEmployees(data.employees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, [authUser]);

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: IResignation) => {
    if (!authUser || !authUser.companyId) {
      toast.error("You must be logged in");
      return;
    }

    if (!selectedOwner) {
      toast.error("Please select an employee");
      return;
    }

    try {
      const resignationData = {
        employeeId: selectedOwner.uid || selectedOwner.id,
        employeeName: selectedOwner.fullName || selectedOwner.name,
        resignationDate: selectResignationDate?.toISOString(),
        lastWorkingDay: selectLastWorkingDate?.toISOString(),
        reason: data.reason,
        description: data.description,
        companyId: authUser.companyId,
        submittedBy: authUser.uid,
      };

      const res = await fetch("/api/resignation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resignationData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to submit resignation");
      }

      toast.success("Resignation submitted successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 800);
    } catch (error: any) {
      toast.error(
        error?.message ||
          "An error occurred while submitting the resignation. Please try again!"
      );
    }
  };
  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Create New Resignation</h5>
            <button
              onClick={handleToggle}
              type="button"
              className="bd-btn-close"
            >
              <i className="fa-solid fa-xmark-large"></i>
            </button>
          </div>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card__wrapper">
              <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
                <div className="col-span-12">
                  <div className="from__input-box select-wrapper">
                    <div className="form__input-title">
                      <label htmlFor="lastname">
                        Employee Name <span>*</span>
                      </label>
                    </div>
                    <div className="relative">
                      <div className="mz-default-select">
                        <SelectWithImage
                          data={employees}
                          selectedValue={selectedOwner}
                          valueKey="fullName"
                          displayKey="fullName"
                          imageKey="profilePictureUrl"
                          placeholder="Select Employee"
                          onChange={setSelectedOwner}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <FormLabel
                    label="Resignation Date"
                    id="selectResignationDate"
                  />
                  <div className="datepicker-style">
                    <DatePicker
                      id="selectResignationDate"
                      selected={selectResignationDate}
                      onChange={(date) => setSelectResignationDate(date)}
                      showYearDropdown
                      showMonthDropdown
                      useShortMonthInDropdown
                      showPopperArrow={false}
                      peekNextMonth
                      dropdownMode="select"
                      isClearable
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Resignation date"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <FormLabel
                    label="Last Working Date"
                    id="selectLastWorkingDate"
                  />
                  <div className="datepicker-style">
                    <DatePicker
                      id="selectLastWorkingDate"
                      selected={selectLastWorkingDate}
                      onChange={(date) => setSelectLastWorkingDate(date)}
                      showYearDropdown
                      showMonthDropdown
                      useShortMonthInDropdown
                      showPopperArrow={false}
                      peekNextMonth
                      dropdownMode="select"
                      isClearable
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Last Working date"
                      className="w-full"
                    />
                  </div>
                </div>

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
            </div>
            <div className="submit__btn flex items-center justify-end gap-[10px]">
              <button className="btn btn-danger" onClick={handleToggle}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                Submit
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddNewResignationModal;

"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import { ITermination } from "@/interface/table.interface";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { trainersData, trainingStatuses } from "@/data/dropdown-data";
import InputField from "@/components/elements/SharedInputs/InputField";
import { ITrainer } from "@/interface";
import SelectWithImage from "@/components/elements/SharedInputs/SelectWithImage";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { statePropsType } from "@/interface/common.interface";
import { useAuthUserContext } from "@/context/UserAuthContext";

interface AddNewTerminationModalProps extends statePropsType {
  onRefresh?: () => void;
}

const AddNewTerminationModal = ({ open, setOpen, onRefresh }: AddNewTerminationModalProps) => {
  const { user: authUser } = useAuthUserContext();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<ITrainer | null>(null);
  const [selectNoticeDate, setSelectNoticeDate] = useState<Date | null>(
    new Date()
  );
  const [selectTerminationDate, setSelectTerminationDate] =
    useState<Date | null>(new Date());
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ITermination>();

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

  const onSubmit = async (data: ITermination) => {
    if (!authUser || !authUser.companyId) {
      toast.error("You must be logged in");
      return;
    }

    if (!selectedOwner) {
      toast.error("Please select an employee");
      return;
    }

    try {
      const terminationData = {
        employeeId: selectedOwner.uid || selectedOwner.id,
        employeeName: selectedOwner.name,
        terminationType: data.terminationType,
        noticeDate: selectNoticeDate?.toISOString(),
        terminationDate: selectTerminationDate?.toISOString(),
        reason: data.terminationType,
        description: data.description,
        companyId: authUser.companyId,
        createdBy: authUser.uid,
      };

      const res = await fetch("/api/termination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(terminationData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create termination");
      }

      toast.success("Termination added successfully!");

      if (onRefresh) {
        onRefresh();
      }

      setTimeout(() => setOpen(false), 800);
    } catch (error: any) {
      toast.error(
        error?.message ||
          "An error occurred while creating the termination. Please try again!"
      );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Add Termination</h5>
            <button
              onClick={handleToggle}
              type="button"
              className="bd-btn-close"
            >
              <i className="fa-solid fa-xmark-large"></i>
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="common-scrollbar overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
              <div className="col-span-12">
                <div className="card__wrapper mb-20">
                  <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
                    <div className="col-span-12 md:col-span-6">
                      <div className="from__input-box select-wrapper">
                        <div className="form__input-title">
                          <label htmlFor="lastname">
                            Employee Name <span>*</span>
                          </label>
                        </div>
                        <div className="relative">
                          <div className="mz-default-select">
                            <SelectWithImage
                              data={trainersData}
                              selectedValue={selectedOwner}
                              valueKey="name"
                              displayKey="name"
                              imageKey="userImg"
                              placeholder="Select Owner"
                              onChange={setSelectedOwner}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <SelectBox
                        id="terminationType"
                        label="Termination Type"
                        options={trainingStatuses}
                        control={control} // Validation rule
                        error={errors.terminationType}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormLabel label="Notice Date" id="selectNoticeDate" />
                      <div className="datepicker-style">
                        <DatePicker
                          id="selectNoticeDate"
                          selected={selectNoticeDate}
                          onChange={(date) => setSelectNoticeDate(date)}
                          showYearDropdown
                          showMonthDropdown
                          useShortMonthInDropdown
                          showPopperArrow={false}
                          peekNextMonth
                          dropdownMode="select"
                          isClearable
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Notice date"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <FormLabel
                        label="Termination Date"
                        id="selectTerminationDate"
                      />
                      <div className="datepicker-style">
                        <DatePicker
                          id="selectTerminationDate"
                          selected={selectTerminationDate}
                          onChange={(date) => setSelectTerminationDate(date)}
                          showYearDropdown
                          showMonthDropdown
                          useShortMonthInDropdown
                          showPopperArrow={false}
                          peekNextMonth
                          dropdownMode="select"
                          isClearable
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Termination date"
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
              </div>
            </div>
            <div className="submit__btn text-center">
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

export default AddNewTerminationModal;

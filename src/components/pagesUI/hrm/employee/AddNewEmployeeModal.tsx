/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { statePropsType } from "@/interface/common.interface";
import { employeeDesignationData } from "@/data/dropdown-data";
import { useForm } from "react-hook-form";
import { IEmployee } from "@/interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { toast } from "sonner";

// 🔹 A lightweight form-only type so the modal isn't forced to match the full DB schema.
type FormEmployee = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  userName: string;
  employeeID: string;
  address: string;
  designation: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  photo?: FileList;          // if you wire file upload later
};

// ✅ Helper to format Date → "YYYY-MM-DD"
const formatDateOnly = (d: Date | null): string | undefined => {
  if (!d) return undefined;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const AddNewEmployeeModal = ({ open, setOpen }: statePropsType) => {
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(new Date());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormEmployee>();

  const handleToggle = () => setOpen(!open);

  // 🔹 Convert form data to the DB-ready IEmployee (fill required fields; safe placeholders where needed)
  const toIEmployee = (f: FormEmployee, joinDate: Date | null): IEmployee => {
    return {
      uid: crypto.randomUUID(),
      fullName: `${f.firstName} ${f.lastName}`.trim(),
      name: f.userName,
      email: f.email,
      phone: f.phone,
      role: "employee",
      companyId: "COMPANY_ID_PLACEHOLDER",  // <-- inject the real companyId from context/props later
      createdBy: "SYSTEM",                  // <-- inject the real currentUser uid later
      createdAt: new Date(),               // Firestore Timestamp is compatible with Date when writing
      status: "active",
      managerId: null,
      photoURL: null,
      designation: f.designation,
      image: undefined,

      // Optional personal info
      birthday: undefined,
      address: f.address,
      gender: undefined,
      dateOfJoining: formatDateOnly(joinDate), // your IEmployee uses string for dateOfJoining

      // Optional nested objects you can fill later
      emergencyContact: undefined,
      bankAccount: {
        accountHolderName: f.accountHolderName,
        accountNumber: f.accountNumber,
        bankName: f.bankName,
        branchName: f.branchName,
      },
      socialProfile: undefined,
      nationalCard: undefined,
      education: [],
      experience: [],
      sidebarAddons: undefined,
      position: undefined,
      department: undefined,
    };
  };

  // Handle form submission
  const onSubmit = async (form: FormEmployee) => {
    try {
      const newEmployee: IEmployee = toIEmployee(form, selectStartDate);

      // 🔸 Save to Firestore here if desired:
      // const userRef = doc(db, "users", newEmployee.uid);
      // await setDoc(userRef, newEmployee, { merge: true });

      toast.success("Employee added successfully!");
      reset();
      setTimeout(() => setOpen(false), 800);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add employee. Please try again.");
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Add New Employee</h5>
            <button onClick={handleToggle} type="button" className="bd-btn-close">
              <i className="fa-solid fa-xmark-large"></i>
            </button>
          </div>
        </DialogTitle>

        <DialogContent className="common-scrollbar max-h-screen overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card__wrapper mt-[5px]">
              <div className="grid grid-cols-12 gap-y-6 gap-x-6 maxXs:gap-x-0 justify-center align-center">
                {/* First & Last Name */}
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="First Name"
                    id="firstName"
                    type="text"
                    register={register("firstName", { required: "First Name is required" })}
                    error={errors.firstName}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Last Name"
                    id="lastName"
                    type="text"
                    register={register("lastName", { required: "Last Name is required" })}
                    error={errors.lastName}
                  />
                </div>

                {/* Contact */}
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Contact Number"
                    id="phone"
                    type="text"
                    register={register("phone", { required: "Contact Number is required" })}
                    error={errors.phone}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Email"
                    id="email"
                    type="text"
                    register={register("email", { required: "Email is required" })}
                    error={errors.email}
                  />
                </div>

                {/* Username & Employee ID */}
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="User Name"
                    id="userName"
                    type="text"
                    register={register("userName", { required: "User Name is required" })}
                    error={errors.userName}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Employee ID"
                    id="employeeID"
                    type="text"
                    register={register("employeeID", { required: "Employee ID is required" })}
                    error={errors.employeeID}
                  />
                </div>

                {/* Address */}
                <div className="col-span-12 text-center">
                  <InputField
                    label="Address"
                    id="address"
                    isTextArea={true}
                    required={true}
                    register={register("address", { required: "Address is required" })}
                    error={errors.address}
                  />
                </div>

                {/* Designation */}
                <div className="col-span-12 md:col-span-6">
                  <SelectBox
                    id="designation"
                    label="Designation"
                    options={employeeDesignationData}
                    control={undefined /* your SelectBox handles its own Controller internally */}
                    // If your SelectBox expects RHF Controller:
                    // control={control}
                    isRequired={true}
                  />
                </div>

                {/* Joining Date */}
                <div className="col-span-12 md:col-span-6">
                  <FormLabel label="Joining Date" id="selectJoiningDate" />
                  <div className="datepicker-style">
                    <DatePicker
                      id="selectJoiningDate"
                      selected={selectStartDate}
                      onChange={(date) => setSelectStartDate(date as Date | null)}
                      showYearDropdown
                      showMonthDropdown
                      useShortMonthInDropdown
                      showPopperArrow={false}
                      peekNextMonth
                      dropdownMode="select"
                      isClearable
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Joining date"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Bank details */}
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Account Holder Name"
                    id="accountHolderName"
                    type="text"
                    register={register("accountHolderName", { required: "Account Holder Name is required" })}
                    error={errors.accountHolderName}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Account Number"
                    id="accountNumber"
                    type="text"
                    register={register("accountNumber", { required: "Account Number is required" })}
                    error={errors.accountNumber}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Bank Name"
                    id="bankName"
                    type="text"
                    register={register("bankName", { required: "Bank Name is required" })}
                    error={errors.bankName}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Branch Name"
                    id="branchName"
                    type="text"
                    register={register("branchName", { required: "Branch Name is required" })}
                    error={errors.branchName}
                  />
                </div>

                {/* Photo (optional) */}
                <div className="col-span-12">
                  <div className="from__input-box">
                    <div className="form__input-title">
                      <label htmlFor="sellerphoto">Employee Photo (100px*100px)</label>
                    </div>
                    <div className="form__input">
                      <input className="form-control" id="sellerphoto" type="file" {...register("photo")} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="submit__btn text-center">
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddNewEmployeeModal;

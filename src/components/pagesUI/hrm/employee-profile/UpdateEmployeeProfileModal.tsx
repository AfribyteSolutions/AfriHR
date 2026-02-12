"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { IEmployeeProfileDetails } from "@/interface";
import { genderData } from "@/data/dropdown-data";
import { useForm, Controller } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { toast } from "sonner";
import { employeestatePropsType } from "@/interface/common.interface";

const UpdateEmployeeProfileModal = ({
  open,
  setOpen,
  data,
}: employeestatePropsType) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(null);
  const [selectDateOfBirth, setSelectDateOfBirth] = useState<Date | null>(null);
  const [managerOptions, setManagerOptions] = useState<{ label: string, value: string }[]>([]);

  const { register, handleSubmit, control, setValue } =
    useForm<IEmployeeProfileDetails>();

  const handleToggle = () => setOpen(!open);

  // Fetch company employees for "Reports To"
  useEffect(() => {
    const fetchManagers = async () => {
      if (!data?.companyId) return;
      try {
        const response = await fetch(`/api/company-employees?companyId=${data.companyId}&limit=100`);
        const result = await response.json();
        if (result.success && Array.isArray(result.employees)) {
          const options = result.employees
            .filter((emp: any) => emp.uid !== data.uid)
            .map((emp: any) => ({
              label: `${emp.fullName} — ${emp.position || 'N/A'}`,
              value: emp.uid
            }));
          setManagerOptions(options);
        }
      } catch (error) {
        console.error("Failed to load managers", error);
      }
    };

    if (open) fetchManagers();
  }, [open, data?.companyId, data?.uid]);

  // Pre-fill form data
  useEffect(() => {
    if (data) {
      setValue("firstName", data.fullName?.split(" ")[0] || "");
      setValue("lastName", data.fullName?.split(" ").slice(1).join(" ") || "");
      setValue("email", data.email || "");
      setValue("contactNumber", data.phone || "");
      setValue("address", data.address || "");
      setValue("employeeId", data.employeeId || "");
      setValue("gender", data.gender || "");
      setValue("department", data.department || "");
      // @ts-ignore
      setValue("position", data.position || ""); 
      // @ts-ignore
      setValue("managerId", data.managerId || ""); 
  
      setSelectDateOfBirth(data.birthday ? new Date(data.birthday) : null);
      setSelectStartDate(data.dateOfJoining ? new Date(data.dateOfJoining) : null);
      setUploadedImage(data.photoURL || null);
    }
  }, [data, setValue]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setUploadedImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (formData: IEmployeeProfileDetails) => {
    try {
      if (!data?.uid) {
        toast.error("User ID missing.");
        return;
      }
  
      const updatedData = {
        uid: data.uid,
        fullName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
        email: formData.email,
        phone: formData.contactNumber,
        department: formData.department,
        position: (formData as any).position || "",
        managerId: (formData as any).managerId || "", 
        employeeId: formData.employeeId || "",
        gender: formData.gender || "",
        birthday: selectDateOfBirth ? selectDateOfBirth.toISOString() : null,
        dateOfJoining: selectStartDate ? selectStartDate.toISOString() : null,
        address: formData.address,
        // Crucial: send the base64 image or keep the existing photoURL
        photoURL: uploadedImage || data.photoURL || null,
        companyId: data.companyId,
      };
  
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
  
      const result = await response.json();
  
      if (result.success) {
        toast.success("Profile updated and synced! 🎉");
        setOpen(false);
        window.location.reload(); 
      } else {
        toast.error(result.message || "Failed to update");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred during save.");
    }
  };

  // Helper to find hidden validation errors
  const onInvalid = (errors: any) => {
    console.error("Form Validation Errors:", errors);
    toast.error("Please check the form for missing required fields.");
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between">
          <h5 className="modal-title">Edit Profile Information</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="common-scrollbar max-h-screen overflow-y-auto">
        {/* Added onInvalid to catch silent errors */}
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="card__wrapper">
            <div className="col-span-12 mb-6">
              <div className="employee__profile-chnage">
                <div className="employee__profile-edit">
                  <input type="file" id="imageUpload" accept=".png, .jpg, .jpeg" onChange={handleImageUpload} />
                  <label htmlFor="imageUpload"></label>
                </div>
                <div className="employee__profile-preview">
                  <div 
                    className="employee__profile-preview-box" 
                    style={{ 
                      backgroundImage: `url(${uploadedImage || "/assets/images/default-avatar.png"})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-x-6 gap-y-6">
              <div className="col-span-12 md:col-span-6">
                <InputField label="First Name" id="firstName" register={register("firstName", { required: true })} />
              </div>
              <div className="col-span-12 md:col-span-6">
                <InputField label="Last Name" id="lastName" register={register("lastName", { required: true })} />
              </div>

              <div className="col-span-12 md:col-span-6">
                <FormLabel label="Date Of Birth" id="dob" optional />
                <div className="datepicker-style">
                  <DatePicker selected={selectDateOfBirth} onChange={(date) => setSelectDateOfBirth(date)} dateFormat="dd/MM/yyyy" className="w-full" />
                </div>
              </div>

              <div className="col-span-12 md:col-span-6">
                <SelectBox id="gender" label="Gender" options={genderData} control={control} />
              </div>

              <div className="col-span-12 md:col-span-6">
                <InputField label="Employee ID" id="employeeId" register={register("employeeId")} />
              </div>

              <div className="col-span-12 md:col-span-6">
                <FormLabel label="Joining Date" id="joining" optional />
                <div className="datepicker-style">
                  <DatePicker selected={selectStartDate} onChange={(date) => setSelectStartDate(date)} dateFormat="dd/MM/yyyy" className="w-full" />
                </div>
              </div>

              <div className="col-span-12 md:col-span-6">
                <InputField label="Contact Number" id="contactNumber" register={register("contactNumber")} />
              </div>

              <div className="col-span-12 md:col-span-6">
                <InputField label="Email" id="email" register={register("email", { required: true })} />
              </div>

              <div className="col-span-12">
                <InputField label="Address" id="address" isTextArea={true} register={register("address")} />
              </div>

              <div className="col-span-12 md:col-span-6">
                <InputField label="Department" id="department" register={register("department")} />
              </div>
              <div className="col-span-12 md:col-span-6">
                <InputField label="Position" id="position" register={register("position")} />
              </div>

              <div className="col-span-12">
                <FormLabel id="managerId" label="Reports To (Manager)" />
                <Controller
                  name={"managerId" as any}
                  control={control}
                  render={({ field }) => (
                    <div className="select-wrapper">
                      <select
                        {...field}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        style={{ height: '45px', fontSize: '14px' }}
                      >
                        <option value="">None (Top Level)</option>
                        {managerOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="submit__btn text-center mt-[30px]">
              <button 
                className="btn btn-primary px-10 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-all" 
                type="submit"
              >
                Update Profile
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateEmployeeProfileModal;
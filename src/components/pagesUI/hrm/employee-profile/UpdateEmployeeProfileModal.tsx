"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, CircularProgress } from "@mui/material";
import { IEmployeeProfileDetails } from "@/interface";
import { genderData } from "@/data/dropdown-data";
import { useForm, Controller } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { toast } from "sonner";
import { employeestatePropsType } from "@/interface/common.interface";

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
  });
};

const UpdateEmployeeProfileModal = ({
  open,
  setOpen,
  data,
}: employeestatePropsType) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(null);
  const [selectDateOfBirth, setSelectDateOfBirth] = useState<Date | null>(null);
  const [managerOptions, setManagerOptions] = useState<{ label: string, value: string }[]>([]);
  const [loadingManagers, setLoadingManagers] = useState<boolean>(false);

  const { register, handleSubmit, control, setValue, watch } = useForm<any>();

  const watchedTotal = watch("totalLeaveDays");
  const watchedRemaining = watch("remainingLeaveDays");

  const handleToggle = () => setOpen(!open);

  // FIXED: Improved fetching logic for "Reports To"
  useEffect(() => {
    const fetchManagers = async () => {
      const companyId = data?.companyId;
      if (!companyId) return;

      try {
        setLoadingManagers(true);
        const response = await fetch(`/api/company-employees?companyId=${companyId}`);
        const result = await response.json();

        if (result.success && Array.isArray(result.employees)) {
          const currentUserId = data.uid || data.id;
          
          const options = result.employees
            .filter((emp: any) => {
              const empId = emp.uid || emp.id;
              // Don't let an employee report to themselves
              return empId !== currentUserId;
            })
            .map((emp: any) => ({
              label: `${emp.fullName || emp.name} (${emp.position || 'Staff'})`,
              value: emp.uid || emp.id
            }));
          
          setManagerOptions(options);
        }
      } catch (error) {
        console.error("Failed to load company employees:", error);
        toast.error("Could not load employee list for 'Reports To'");
      } finally {
        setLoadingManagers(false);
      }
    };

    if (open) fetchManagers();
  }, [open, data?.companyId, data?.uid, data?.id]);

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
      setValue("position", data.position || ""); 
      setValue("managerId", data.managerId || ""); 
      setValue("totalLeaveDays", data.totalLeaveDays || 0);
      setValue("remainingLeaveDays", data.remainingLeaveDays || 0);
  
      setSelectDateOfBirth(data.birthday ? new Date(data.birthday) : null);
      setSelectStartDate(data.dateOfJoining ? new Date(data.dateOfJoining) : null);
      setUploadedImage(data.photoURL || null);
    }
  }, [data, setValue]);

  const calculatedUsed = Math.max(0, (Number(watchedTotal) || 0) - (Number(watchedRemaining) || 0));

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image too large! Please choose a file under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => { if (reader.readyState === 2) setUploadedImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (formData: any) => {
    try {
      if (!data?.uid) return;
      let finalPhotoURL = uploadedImage;
      if (uploadedImage && uploadedImage.startsWith("data:image")) {
        finalPhotoURL = await compressImage(uploadedImage);
      }
  
      const updatedData = {
        uid: data.uid,
        fullName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
        email: formData.email,
        phone: formData.contactNumber,
        department: formData.department,
        position: formData.position || "",
        managerId: formData.managerId || "", 
        employeeId: formData.employeeId || "",
        gender: formData.gender || "",
        birthday: selectDateOfBirth ? selectDateOfBirth.toISOString() : null,
        dateOfJoining: selectStartDate ? selectStartDate.toISOString() : null,
        address: formData.address,
        photoURL: finalPhotoURL || data.photoURL || null,
        companyId: data.companyId,
        totalLeaveDays: Number(formData.totalLeaveDays),
        remainingLeaveDays: Number(formData.remainingLeaveDays),
      };
  
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
  
      const result = await response.json();
      if (result.success) {
        toast.success("Profile updated successfully!");
        setOpen(false);
        window.location.reload(); 
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred during save.");
    }
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card__wrapper">
            <div className="col-span-12 mb-6 text-center">
              <div className="employee__profile-chnage inline-block">
                <div className="employee__profile-edit">
                  <input type="file" id="imageUpload" accept=".png, .jpg, .jpeg" onChange={handleImageUpload} />
                  <label htmlFor="imageUpload"></label>
                </div>
                <div className="employee__profile-preview mx-auto">
                  <div 
                    className="employee__profile-preview-box" 
                    style={{ backgroundImage: `url(${uploadedImage || "/assets/images/default-avatar.png"})`, backgroundSize: 'cover' }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-x-6 gap-y-6">
              <div className="col-span-12 md:col-span-6"><InputField label="First Name" id="firstName" register={register("firstName", { required: true })} /></div>
              <div className="col-span-12 md:col-span-6"><InputField label="Last Name" id="lastName" register={register("lastName", { required: true })} /></div>
              
              <div className="col-span-12 md:col-span-6">
                <FormLabel label="Date Of Birth" id="dob" optional />
                <DatePicker selected={selectDateOfBirth} onChange={(date) => setSelectDateOfBirth(date)} dateFormat="dd/MM/yyyy" className="form-control w-full border border-gray-300 rounded-md p-2 h-[45px]" />
              </div>

              <div className="col-span-12 md:col-span-6"><SelectBox id="gender" label="Gender" options={genderData} control={control} /></div>

              <div className="col-span-12 md:col-span-6"><InputField label="Employee ID" id="employeeId" register={register("employeeId")} /></div>

              <div className="col-span-12 md:col-span-6">
                <FormLabel label="Joining Date" id="joining" optional />
                <DatePicker selected={selectStartDate} onChange={(date) => setSelectStartDate(date)} dateFormat="dd/MM/yyyy" className="form-control w-full border border-gray-300 rounded-md p-2 h-[45px]" />
              </div>

              <div className="col-span-12 md:col-span-6"><InputField label="Contact Number" id="contactNumber" register={register("contactNumber")} /></div>
              <div className="col-span-12 md:col-span-6"><InputField label="Email" id="email" register={register("email", { required: true })} /></div>
              <div className="col-span-12"><InputField label="Address" id="address" isTextArea={true} register={register("address")} /></div>

              <div className="col-span-12 md:col-span-6"><InputField label="Department" id="department" register={register("department")} /></div>
              <div className="col-span-12 md:col-span-6"><InputField label="Position" id="position" register={register("position")} /></div>

              {/* 📊 LEAVE MANAGEMENT */}
              <div className="col-span-12">
                <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700">
                  <h6 className="text-sm font-bold mb-3 text-blue-800 dark:text-blue-300">Leave Balance Configuration</h6>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-4">
                      <InputField label="Total Days" id="totalLeaveDays" type="number" register={register("totalLeaveDays")} />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <InputField label="Remaining Days" id="remainingLeaveDays" type="number" register={register("remainingLeaveDays")} />
                    </div>
                    <div className="col-span-12 md:col-span-4 flex items-end pb-[4px]">
                       <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md p-2 text-center h-[48px] flex flex-col justify-center">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Calculated Used</span>
                          <span className="text-md font-extrabold text-blue-700">{calculatedUsed} Days</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 👥 REPORTS TO / MANAGER SELECTION */}
              <div className="col-span-12">
                <FormLabel id="managerId" label="Reports To (Manager)" />
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <select 
                        {...field} 
                        disabled={loadingManagers}
                        className="form-control w-full border border-gray-300 rounded-md p-2 h-[45px] dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">None (Top Level)</option>
                        {managerOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {loadingManagers && (
                        <div className="absolute right-8 top-3">
                          <CircularProgress size={20} />
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="submit__btn text-center mt-[30px]">
              <button className="btn btn-primary px-10 py-3 rounded-lg" type="submit">Update Profile</button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateEmployeeProfileModal;
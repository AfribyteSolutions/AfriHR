import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { IEmployeeProfileDetails } from "@/interface";
import { employeeDesignationData, genderData } from "@/data/dropdown-data";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { toast } from "sonner";
import { employeestatePropsType } from "@/interface/common.interface";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const UpdateEmployeeProfileModal = ({
  open,
  setOpen,
  data,
}: employeestatePropsType) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectStartDate, setSelectStartDate] = useState<Date | null>(null);
  const [selectDateOfBirth, setSelectDateOfBirth] = useState<Date | null>(null);

  const { register, handleSubmit, control, reset, setValue } =
    useForm<IEmployeeProfileDetails>();

  const handleToggle = () => setOpen(!open);

  // Pre-fill form when modal opens
  useEffect(() => {
    if (data) {
      // Split full name into first and last
      setValue("firstName", data.fullName?.split(" ")[0] || "");
      setValue("lastName", data.fullName?.split(" ").slice(1).join(" ") || "");
      setValue("email", data.email || "");
      setValue("contactNumber", data.phone || "");
      setValue("address", data.address || "");
      setValue("department", data.department || "");
      setValue("designation", data.position || ""); // map DB position → form designation
      setValue("employeeId", data.employeeId || "");
      setValue("gender", data.gender || "");
  
      setSelectDateOfBirth(data.birthday ? new Date(data.birthday) : null);
      setSelectStartDate(data.dateOfJoining ? new Date(data.dateOfJoining) : null);
      setUploadedImage(data.photoURL || null);
    }
  }, [data, setValue]);
  

  // handle image upload
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

  // handle submit form
  const onSubmit = async (formData: IEmployeeProfileDetails) => {
    try {
      if (!data?.uid) {
        toast.error("User ID missing. Cannot update profile.");
        return;
      }
  
      const updatedData = {
        fullName: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
        email: formData.email,
        phone: formData.contactNumber,
        department: formData.department,
        position: formData.designation || "", // map form designation → DB position
        employeeId: formData.employeeId || "",
        gender: formData.gender || "",
        birthday: selectDateOfBirth ? selectDateOfBirth.toISOString() : null,
        dateOfJoining: selectStartDate ? selectStartDate.toISOString() : null,
        address: formData.address,
        photoURL: uploadedImage || null,
      };
  
      console.log("Updating employee:", data.uid, updatedData);
  
      await updateDoc(doc(db, "users", data.uid), updatedData);
  
      toast.success("Profile updated successfully! 🎉");
      reset();
      setSelectDateOfBirth(null);
      setSelectStartDate(null);
      setUploadedImage(null);
      setTimeout(() => setOpen(false), 2000);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    }
  };
  

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between">
          <h5 className="modal-title">Profile Information</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="common-scrollbar max-h-screen overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card__wrapper">
            <div className="col-span-12">
              <div className="employee__profile-chnage">
                <div className="employee__profile-edit">
                  <input
                    type="file"
                    id="imageUpload"
                    accept=".png, .jpg, .jpeg"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="imageUpload"></label>
                </div>
                <div className="employee__profile-preview">
                  <div
                    className="employee__profile-preview-box"
                    id="imagePreview"
                    style={{
                      backgroundImage: `url(${uploadedImage || ""})`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6">
              <div className="col-span-12 md:col-span-6 ">
                <InputField
                  label="First Name"
                  id="firstName"
                  type="text"
                  register={register("firstName")}
                  required={false}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Last Name"
                  id="lastName"
                  type="text"
                  register={register("lastName")}
                  required={false}
                />
              </div>

              <div className="col-span-12 md:col-span-6">
                <FormLabel label="Date Of Birth" id="selectStartDate" optional />
                <div className="datepicker-style">
                  <DatePicker
                    id="selectStartDate"
                    selected={selectDateOfBirth}
                    onChange={(date) => setSelectDateOfBirth(date)}
                    showYearDropdown
                    showMonthDropdown
                    useShortMonthInDropdown
                    showPopperArrow={false}
                    peekNextMonth
                    dropdownMode="select"
                    isClearable
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Date Of Birth"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-span-12 md:col-span-6">
                <SelectBox
                  id="gender"
                  label="Gender"
                  options={genderData}
                  control={control}
                  isRequired={false}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Employee ID"
                  id="employeeId"
                  type="text"
                  register={register("employeeId")}
                  required={false}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <FormLabel label="Joining Date" id="selectJoiningDate" optional />
                <div className="datepicker-style">
                  <DatePicker
                    id="selectJoiningDate"
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
                    placeholderText="Joining date"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Contact Number"
                  id="contactNumber"
                  type="text"
                  register={register("contactNumber")}
                  required={false}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Email"
                  id="email"
                  type="text"
                  register={register("email")}
                  required={false}
                />
              </div>
              <div className="col-span-12 text-center">
                <InputField
                  label="Address"
                  id="address"
                  isTextArea={true}
                  register={register("address")}
                  required={false}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <SelectBox
                  id="department"
                  label="Department"
                  options={employeeDesignationData}
                  control={control}
                  isRequired={false}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <SelectBox
                  id="designation"
                  label="Designation"
                  options={employeeDesignationData}
                  control={control}
                  isRequired={false}
                />
              </div>
            </div>
            <div className="submit__btn text-center mt-[20px]">
              <button className="btn btn-primary" type="submit">
                Submit
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateEmployeeProfileModal;

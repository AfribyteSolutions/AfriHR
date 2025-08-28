"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { countriesData } from "@/data/country-data";
import { useForm, Controller } from "react-hook-form";
import { IPassport, IEmployee } from "@/interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";

interface PropsType {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: IEmployee;
  passport: IPassport | null;
}

const UpdatePassportModal = ({ open, setOpen, data, passport }: PropsType) => {
  const [loading, setLoading] = useState(false);
  const { 
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IPassport>({
    defaultValues: {
      ...passport,
      // Convert Firestore Timestamp to Date object for DatePicker
      issueDate: passport?.issueDate?.toDate?.() || null,
      expiryDate: passport?.expiryDate?.toDate?.() || null,
    },
  });

  const handleToggle = () => setOpen(!open);

  // Reset form when passport prop changes
  useEffect(() => {
    reset({
      ...passport,
      issueDate: passport?.issueDate?.toDate?.() || null,
      expiryDate: passport?.expiryDate?.toDate?.() || null,
    });
  }, [passport, reset]);

  const onSubmit = async (formData: IPassport) => { 
    try {
      setLoading(true);

      if (!data?.uid) {
        throw new Error("User UID is missing");
      }
      
      const userRef = doc(db, "users", data.uid);

      await updateDoc(userRef, {
        passport: {
          passportNumber: formData.passportNumber?.trim() || "",
          nationality: formData.nationality?.trim() || "",
          issueDate: formData.issueDate || null,
          expiryDate: formData.expiryDate || null,
          scanCopyUrl: formData.scanCopyUrl || "",
        },
        updatedAt: new Date(),
      });
      
      toast.success("Passport information updated successfully!");
      
      setTimeout(() => {
        setOpen(false);
      }, 1500);

    } catch (error: any) {
      console.error("Error updating passport:", error);
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. You may not have access to update this information.");
      } else if (error.code === 'not-found') {
        // If the user document doesn't exist, we can create it
        const userRef = doc(db, "users", data.uid);
        await setDoc(userRef, {
            ...data,
            passport: formData,
            updatedAt: new Date(),
        }, { merge: true });
        toast.success("Passport information updated successfully!");
        setOpen(false);
      } else {
        toast.error(`Update failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            width: "500px",
          },
        }}>
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Passport Information</h5>
            <button
              onClick={handleToggle}
              type="button"
              className="bd-btn-close"
            >
              <i className="fa-solid fa-xmark-large"></i>
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="common-scrollbar max-h-screen overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="card__wrapper mb-[20px]">
              <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6 items-center justify-center">
                <div className="col-span-12">
                  <InputField
                    label="Passport Number"
                    id="passportNumber"
                    type="text"
                    required={false}
                    register={register("passportNumber")}
                    error={errors.passportNumber}
                  />
                </div>
                <div className="col-span-12">
                  <SelectBox
                    id="nationality"
                    label="Nationality"
                    isRequired={false}
                    options={countriesData}
                    control={control}
                    error={errors.nationality}
                  />
                </div>
                <div className="col-span-12">
                  <FormLabel label="Issue Date" id="issueDate" optional={true}/>
                  <div className="datepicker-style">
                    <Controller
                      name="issueDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          id="issueDate"
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          showYearDropdown
                          showMonthDropdown
                          useShortMonthInDropdown
                          showPopperArrow={false}
                          peekNextMonth
                          dropdownMode="select"
                          isClearable
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Issue date"
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="col-span-12">
                  <FormLabel label="Expiry Date" id="expiryDate" optional={true}/>
                  <div className="datepicker-style">
                    <Controller
                      name="expiryDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          id="expiryDate"
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          showYearDropdown
                          showMonthDropdown
                          useShortMonthInDropdown
                          showPopperArrow={false}
                          peekNextMonth
                          dropdownMode="select"
                          isClearable
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Expiry date"
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="submit__btn text-center">
              <button 
                className="btn btn-primary" 
                type="submit"
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin mr-2"></i>
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdatePassportModal;
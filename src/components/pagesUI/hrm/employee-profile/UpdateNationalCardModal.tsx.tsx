// components/employee/UpdateNationalCardModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { IEmployee, INationalCard } from "@/interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { doc, updateDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PropsType {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: IEmployee;
  nationalCard: INationalCard | null;
}

const UpdateNationalCardModal = ({ open, setOpen, data, nationalCard }: PropsType) => {
  const [loading, setLoading] = useState(false);

  // Helper function to convert various date formats to Date object
  const convertToDate = (date: any): Date | null => {
    if (!date) return null;
    
    // Handle Date objects
    if (date instanceof Date) {
      return date;
    }
    
    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return (date as Timestamp).toDate();
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) ? parsedDate : null;
    }
    
    return null;
  };

  const { 
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<INationalCard>({
    defaultValues: {
      ...nationalCard,
      // Use the helper function to convert dates
      issueDate: convertToDate(nationalCard?.issueDate),
      expiryDate: convertToDate(nationalCard?.expiryDate),
    },
  });

  const handleToggle = () => setOpen(!open);

  // Reset form when nationalCard prop changes
  useEffect(() => {
    reset({
      ...nationalCard,
      // Use the helper function to convert dates
      issueDate: convertToDate(nationalCard?.issueDate),
      expiryDate: convertToDate(nationalCard?.expiryDate),
    });
  }, [nationalCard, reset]);

  const onSubmit = async (formData: INationalCard) => { 
    try {
      setLoading(true);

      if (!data?.uid) {
        throw new Error("User UID is missing");
      }
      
      const userRef = doc(db, "users", data.uid);

      // ✅ Fix: Convert Date objects to Firestore Timestamp before updating
      const nationalCardData = {
        cardNumber: formData.cardNumber?.trim() || "",
        issueDate: formData.issueDate instanceof Date ? Timestamp.fromDate(formData.issueDate) : null,
        expiryDate: formData.expiryDate instanceof Date ? Timestamp.fromDate(formData.expiryDate) : null,
      };

      await updateDoc(userRef, {
        nationalCard: nationalCardData,
        updatedAt: new Date(),
      });
      
      toast.success("National card information updated successfully!");
      
      setTimeout(() => {
        setOpen(false);
      }, 1500);

    } catch (error: any) {
      console.error("Error updating national card:", error);
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. You may not have access to update this information.");
      } else if (error.code === 'not-found') {
        // If the user document doesn't exist, create it
        const userRef = doc(db, "users", data.uid);

        // ✅ Fix: Use Timestamp for initial creation as well
        const nationalCardData = {
          cardNumber: formData.cardNumber?.trim() || "",
          issueDate: formData.issueDate instanceof Date ? Timestamp.fromDate(formData.issueDate) : null,
          expiryDate: formData.expiryDate instanceof Date ? Timestamp.fromDate(formData.expiryDate) : null,
        };

        await setDoc(userRef, {
            ...data,
            nationalCard: nationalCardData,
            updatedAt: new Date(),
        }, { merge: true });
        toast.success("National card information updated successfully!");
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
            <h5 className="modal-title">National Card Information</h5>
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
                    label="Card Number"
                    id="cardNumber"
                    type="text"
                    required={false}
                    register={register("cardNumber")}
                    error={errors.cardNumber}
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
                          selected={convertToDate(field.value)}  
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
                          selected={convertToDate(field.value)}  
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

export default UpdateNationalCardModal;
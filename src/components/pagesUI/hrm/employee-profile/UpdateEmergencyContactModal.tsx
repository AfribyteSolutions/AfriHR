import React, { useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import { IEmergencyContact, IEmployee } from "@/interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import { toast } from "sonner";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Adjust import path as needed

// Define the form data structure
interface EmergencyContactFormData {
  // Primary contact
  primaryName: string;
  primaryRelationship: string;
  primaryPhone: string;
  primaryEmail: string;
  primaryAddress: string;
  
  // Secondary contact
  secondaryName: string;
  secondaryRelationship: string;
  secondaryPhone: string;
  secondaryEmail: string;
  secondaryAddress: string;
}

interface PropsType {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: IEmployee;
}

const UpdateEmergencyContactModal = ({ open, setOpen, data }: PropsType) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<EmergencyContactFormData>();

  const handleToggle = () => setOpen(!open);

  // Pre-populate form with existing data
  useEffect(() => {
    if (data?.emergencyContact) {
      const { primary, secondary } = data.emergencyContact;
      
      // Set primary contact values
      if (primary) {
        setValue("primaryName", primary.name || "");
        setValue("primaryRelationship", primary.relationship || "");
        setValue("primaryPhone", primary.phone || "");
        setValue("primaryEmail", primary.email || "");
        setValue("primaryAddress", primary.address || "");
      }
      
      // Set secondary contact values
      if (secondary) {
        setValue("secondaryName", secondary.name || "");
        setValue("secondaryRelationship", secondary.relationship || "");
        setValue("secondaryPhone", secondary.phone || "");
        setValue("secondaryEmail", secondary.email || "");
        setValue("secondaryAddress", secondary.address || "");
      }
    }
  }, [data, setValue]);

  // Handle submit
  const onSubmit = async (formData: EmergencyContactFormData) => {
    try {
      // Validate that we have a valid uid
      if (!data?.uid) {
        throw new Error("Employee UID is missing");
      }

      console.log("=== DEBUG INFO ===");
      console.log("Employee data:", data);
      console.log("Employee UID:", data.uid);

      // Prepare the emergency contact data structure
      const emergencyContactData = {
        primary: {
          name: formData.primaryName || "",
          relationship: formData.primaryRelationship || "",
          phone: formData.primaryPhone || "",
          email: formData.primaryEmail || "",
          address: formData.primaryAddress || "",
        },
        secondary: {
          name: formData.secondaryName || "",
          relationship: formData.secondaryRelationship || "",
          phone: formData.secondaryPhone || "",
          email: formData.secondaryEmail || "",
          address: formData.secondaryAddress || "",
        },
      };

      console.log("Emergency contact data to update:", emergencyContactData);

      // Use 'users' collection instead of 'employees'
      const userRef = doc(db, "users", data.uid);
      console.log("Document reference path:", userRef.path);

      // Check if the document exists
      console.log("Checking if user document exists...");
      const docSnap = await getDoc(userRef);
      console.log("Document exists:", docSnap.exists());
      
      if (docSnap.exists()) {
        console.log("Current document data:", docSnap.data());
        
        // Update the existing document
        console.log("Attempting to update user document...");
        await updateDoc(userRef, {
          emergencyContact: emergencyContactData,
          updatedAt: new Date(),
        });

        console.log("Update successful!");
        toast.success("Emergency contact updated successfully!");
        
      } else {
        throw new Error("User document not found in database");
      }
      
      setTimeout(() => {
        setOpen(false);
      }, 1500);
      
    } catch (error: any) {
      console.error("=== ERROR DETAILS ===");
      console.error("Full error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Your role may not allow this update.");
      } else if (error.code === 'not-found') {
        toast.error("User record not found in database.");
      } else if (error.message.includes("UID is missing")) {
        toast.error("Employee ID is missing. Please refresh and try again.");
      } else {
        toast.error(`Update failed: ${error.message}`);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Emergency Contact</h5>
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
              <h6 className="card__sub-title mb-2.5">Primary Contact</h6>
              <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6">
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Full Name"
                    id="primaryName"
                    type="text"
                    required={false}
                    register={register("primaryName")}
                    error={errors.primaryName}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Relationship"
                    id="primaryRelationship"
                    type="text"
                    required={false}
                    register={register("primaryRelationship")}
                    error={errors.primaryRelationship}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Phone"
                    id="primaryPhone"
                    type="tel"
                    required={false}
                    register={register("primaryPhone")}
                    error={errors.primaryPhone}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Email Address"
                    id="primaryEmail"
                    type="email"
                    required={false}
                    register={register("primaryEmail")}
                    error={errors.primaryEmail}
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="Address"
                    id="primaryAddress"
                    type="text"
                    required={false}
                    register={register("primaryAddress")}
                    error={errors.primaryAddress}
                  />
                </div>
              </div>
            </div>

            <div className="card__wrapper mt-6">
              <h6 className="card__sub-title mb-2.5">Secondary Contact</h6>
              <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6">
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Full Name"
                    id="secondaryName"
                    type="text"
                    register={register("secondaryName")}
                    required={false}
                    error={errors.secondaryName}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Relationship"
                    id="secondaryRelationship"
                    type="text"
                    register={register("secondaryRelationship")}
                    required={false}
                    error={errors.secondaryRelationship}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Phone"
                    id="secondaryPhone"
                    type="tel"
                    required={false}
                    register={register("secondaryPhone")}
                    error={errors.secondaryPhone}
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <InputField
                    label="Email Address"
                    id="secondaryEmail"
                    type="email"
                    required={false}
                    register={register("secondaryEmail")}
                    error={errors.secondaryEmail}
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="Address"
                    id="secondaryAddress"
                    type="text"
                    required={false}
                    register={register("secondaryAddress")}
                    error={errors.secondaryAddress}
                  />
                </div>
              </div>
            </div>

            <div className="submit__btn text-center mt-6">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Emergency Contact"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateEmergencyContactModal;
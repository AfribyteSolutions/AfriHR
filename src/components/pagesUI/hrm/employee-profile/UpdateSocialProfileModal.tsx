"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import { IEmployee, ISocialProfile } from "@/interface";
import { toast } from "sonner";
import InputField from "@/components/elements/SharedInputs/InputField";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PropsType {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: IEmployee;
  socialProfile: ISocialProfile | null;
}

const UpdateSocialProfileModal = ({ open, setOpen, data, socialProfile }: PropsType) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ISocialProfile>({
    defaultValues: socialProfile || {}
  });

  const handleToggle = () => setOpen(!open);

  // Reset form when socialProfile prop changes
  useEffect(() => {
    reset(socialProfile || {});
  }, [socialProfile, reset]);

  const onSubmit = async (formData: ISocialProfile) => {
    try {
      setLoading(true);

      if (!data?.uid) {
        throw new Error("User UID is missing. Cannot update social profile.");
      }

      // Filter out empty fields and trim whitespace
      const updatedSocialProfile: ISocialProfile = {};
      (Object.keys(formData) as (keyof ISocialProfile)[]).forEach(key => {
        const value = formData[key]?.trim();
        if (value) {
          updatedSocialProfile[key] = value;
        }
      });
      
      const userRef = doc(db, "users", data.uid);

      await updateDoc(userRef, {
        socialProfile: updatedSocialProfile,
        updatedAt: new Date(),
      });

      toast.success("Social profile updated successfully!");

      setTimeout(() => {
        setOpen(false);
      }, 1500);
      
    } catch (error: any) {
      console.error("Error updating social profile:", error);
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. You may not have access to update this information.");
      } else if (error.code === 'not-found') {
        const userRef = doc(db, "users", data.uid);
        await setDoc(userRef, {
            ...data,
            socialProfile: formData,
            updatedAt: new Date(),
        }, { merge: true });
        toast.success("Social profile updated successfully!");
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
        }}
      >
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Social Profile</h5>
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
                    label="LinkedIn Profile"
                    id="linkedin"
                    type="text"
                    required={false}
                    groupInput={true}
                    groupText="in/"
                    register={{ ...register("linkedin") }}
                    error={errors.linkedin}
                    placeholder="your-profile-name"
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="X (Twitter) Handle"
                    id="twitter"
                    type="text"
                    required={false}
                    groupInput={true}
                    groupText="@"
                    register={{ ...register("twitter") }}
                    error={errors.twitter}
                    placeholder="your-handle"
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="Facebook Profile"
                    id="facebook"
                    type="text"
                    required={false}
                    groupInput={true}
                    groupText="fb.com/"
                    register={{ ...register("facebook") }}
                    error={errors.facebook}
                    placeholder="your-username"
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="Instagram Handle"
                    id="instagram"
                    type="text"
                    required={false}
                    groupInput={true}
                    groupText="@"
                    register={{ ...register("instagram") }}
                    error={errors.instagram}
                    placeholder="your-handle"
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="WhatsApp Number"
                    id="whatsapp"
                    type="text"
                    required={false}
                    register={{ ...register("whatsapp") }}
                    error={errors.whatsapp}
                    placeholder="e.g., 1234567890"
                  />
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

export default UpdateSocialProfileModal;
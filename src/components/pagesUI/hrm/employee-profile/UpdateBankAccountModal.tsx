import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import { IBankAccount, IEmployee } from "@/interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import { toast } from "sonner";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PropsType {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: IEmployee;
  bankAccount: IBankAccount | null;
}

const UpdateBankAccountModal = ({ open, setOpen, data, bankAccount }: PropsType) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IBankAccount>({
    defaultValues: bankAccount || {}
  });

  const handleToggle = () => setOpen(!open);

  // Reset form when bankAccount prop changes
  useEffect(() => {
    reset(bankAccount || {});
  }, [bankAccount, reset]);

  //handle submit form
  const onSubmit = async (formData: IBankAccount) => {
    try {
      setLoading(true);

      if (!data?.uid) {
        throw new Error("User UID is missing");
      }

      const userRef = doc(db, "users", data.uid);

      await updateDoc(userRef, {
        bankAccount: {
          accountHolderName: formData.accountHolderName.trim(),
          accountNumber: formData.accountNumber.trim(),
          bankName: formData.bankName.trim(),
          branchName: formData.branchName.trim(),
          swiftCode: formData.swiftCode?.trim() || "",
        },
        updatedAt: new Date(),
      });
      
      toast.success("Bank Account updated successfully!");
      
      setTimeout(() => {
        setOpen(false);
      }, 1500);

    } catch (error: any) {
      console.error("Error updating bank account:", error);
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. You may not have access to update this information.");
      } else if (error.code === 'not-found') {
        // If the user document doesn't exist, we can create it with the bank account data
        // This is a safeguard; in most cases, the user document should already exist.
        const userRef = doc(db, "users", data.uid);
        await setDoc(userRef, {
            ...data,
            bankAccount: formData,
            updatedAt: new Date(),
        }, { merge: true });
        toast.success("Bank Account updated successfully!");
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
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="sm">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Bank Account Information</h5>
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
              <div className="grid grid-cols-12 gap-y-6 justify-center align-center">
                <div className="col-span-12">
                  <InputField
                    label="Account Holder Name"
                    id="accountHolderName"
                    type="text"
                    required={false}
                    register={register("accountHolderName")}
                    error={errors.accountHolderName}
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="Account Number"
                    id="accountNumber"
                    type="text"
                    required={false}
                    register={register("accountNumber")}
                    error={errors.accountNumber}
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="Bank Name"
                    id="bankName"
                    type="text"
                    required={false}
                    register={register("bankName")}
                    error={errors.bankName}
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="Branch Name"
                    id="branchName"
                    type="text"
                    required={false}
                    register={register("branchName")}
                    error={errors.branchName}
                  />
                </div>
                <div className="col-span-12">
                  <InputField
                    label="SWIFT Code"
                    id="swiftCode"
                    type="text"
                    required={false}
                    register={register("swiftCode")}
                    error={errors.swiftCode}
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

export default UpdateBankAccountModal;
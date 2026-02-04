"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { IExpese } from "@/interface/table.interface";
import { useForm } from "react-hook-form";
import InputField from "@/components/elements/SharedInputs/InputField";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";
import { purchaseStatusOptions } from "@/data/dropdown-data";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { useAuthUserContext } from "@/context/UserAuthContext";

interface AddExpenseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddExpenseModal = ({ open, setOpen, onSuccess }: AddExpenseModalProps) => {
  const { user } = useAuthUserContext();
  const [selectPurchaseDate, setSelectPurchaseDate] = useState<Date | null>(new Date());
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset, // Added reset to handle async user data
    formState: { errors },
  } = useForm<IExpese>({
    defaultValues: {
      purchasedBy: user?.fullName || "",
      status: "Unpaid"
    }
  });

  // Sync the form with user data once the auth context loads
  useEffect(() => {
    if (user) {
      reset({
        purchasedBy: user.fullName,
        status: "Unpaid"
      });
    }
  }, [user, reset]);

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: IExpese) => {
    if (!user?.companyId) {
      toast.error("Company ID not found");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user.companyId,
          invoiceNumber: data.invoiceNumber,
          itemName: data.itemName,
          purchasedBy: user.fullName, // Always use context value for security
          purchasedById: user.id,
          purchaseDate: selectPurchaseDate
            ? selectPurchaseDate.toISOString()
            : new Date().toISOString(),
          amount: data.amount,
          status: data.status || "Unpaid",
          employeeImg: user.photoURL || "",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Expense added successfully!");
        if (onSuccess) onSuccess();
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to add expense");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between">
          <h5 className="modal-title">Add New Expense</h5>
          <button onClick={handleToggle} type="button" className="bd-btn-close">
            <i className="fa-solid fa-xmark-large"></i>
          </button>
        </div>
      </DialogTitle>
      <DialogContent className="common-scrollbar overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-12 gap-y-5 gap-x-5">
            <div className="col-span-12">
              <div className="card__wrapper mb-20">
                <div className="grid grid-cols-12 gap-y-5 gap-x-5">
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Invoice Number"
                      id="invoiceNumber"
                      type="text"
                      register={register("invoiceNumber", { required: "Required" })}
                      error={errors.invoiceNumber}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Item Name"
                      id="itemName"
                      type="text"
                      register={register("itemName", { required: "Required" })}
                      error={errors.itemName}
                    />
                  </div>

                  {/* FIXED SECTION: Removed value and disabled props */}
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Purchased By (Auto-filled)"
                      id="purchasedBy"
                      type="text"
                      register={register("purchasedBy")}
                      error={errors.purchasedBy}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <FormLabel label="Purchase Date" id="selectPurchaseDate" />
                    <div className="datepicker-style">
                      <DatePicker
                        id="selectPurchaseDate"
                        selected={selectPurchaseDate}
                        onChange={(date) => setSelectPurchaseDate(date)}
                        dateFormat="dd/MM/yyyy"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Purchase Amount"
                      id="amount"
                      type="number"
                      register={register("amount")}
                      error={errors.amount}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <SelectBox
                      id="status"
                      label="Purchase Status"
                      options={purchaseStatusOptions}
                      control={control}
                      error={errors.status}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="submit__btn text-center mt-4">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
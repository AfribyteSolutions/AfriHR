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

interface UpdateExpenseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editData: IExpese | null;
  onSuccess?: () => void;
}

const UpdateExpenseModal = ({
  open,
  setOpen,
  editData,
  onSuccess,
}: UpdateExpenseModalProps) => {
  const [selectPurchaseDate, setSelectPurchaseDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IExpese>();

  // ✅ Effect to populate form when editData changes or modal opens
  useEffect(() => {
    if (editData && open) {
      // Reset the form with current expense data
      reset({
        invoiceNumber: editData.invoiceNumber,
        itemName: editData.itemName,
        purchasedBy: editData.purchasedBy,
        amount: editData.amount,
        status: editData.status,
      });

      // Handle the date string from DB
      if (editData.purchaseDate) {
        setSelectPurchaseDate(new Date(editData.purchaseDate));
      }
    }
  }, [editData, open, reset]);

  const handleToggle = () => setOpen(!open);

  const onSubmit = async (data: IExpese) => {
    if (!editData?.id) {
      toast.error("Expense ID not found");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/expense", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editData.id,
          invoiceNumber: data.invoiceNumber,
          itemName: data.itemName,
          purchaseDate: selectPurchaseDate
            ? selectPurchaseDate.toISOString()
            : editData.purchaseDate,
          amount: data.amount,
          status: data.status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Expense updated successfully!");
        if (onSuccess) onSuccess();
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to update expense");
      }
    } catch (error: any) {
      toast.error(error?.message || "An error occurred while updating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex justify-between">
          <h5 className="modal-title">Edit Expense</h5>
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

                  {/* ✅ Fixed: Removed 'defaultValue' and 'disabled' props causing TS errors */}
                  <div className="col-span-12 md:col-span-6">
                    <InputField
                      label="Purchased By"
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
          <div className="submit__btn text-center">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Expense"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateExpenseModal;
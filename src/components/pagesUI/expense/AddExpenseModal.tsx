"use client";
import React, { useState } from "react";
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
import { Timestamp } from "firebase/firestore";

interface AddExpenseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddExpenseModal = ({ open, setOpen, onSuccess }: AddExpenseModalProps) => {
  const { user } = useAuthUserContext();
  const [selectPurchaseDate, setSelectPurchaseDate] = useState<Date | null>(
    new Date()
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IExpese>();

  const handleToggle = () => setOpen(!open);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: IExpese) => {
    if (!user?.companyId) {
      toast.error("Company ID not found");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: user.companyId,
          invoiceNumber: data.invoiceNumber,
          itemName: data.itemName,
          purchasedBy: user.fullName,
          purchasedById: user.id,
          purchaseDate: selectPurchaseDate
            ? Timestamp.fromDate(selectPurchaseDate)
            : Timestamp.now(),
          amount: data.amount,
          status: data.status || "Unpaid",
          employeeImg: user.photoURL || "",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Expense added successfully!");
        if (onSuccess) onSuccess();
        setTimeout(() => setOpen(false), 1000);
      } else {
        toast.error(result.error || "Failed to add expense");
      }
    } catch (error: any) {
      toast.error(
        error?.message || "An error occurred while adding the expense."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleToggle} fullWidth maxWidth="md">
        <DialogTitle>
          <div className="flex justify-between">
            <h5 className="modal-title">Add New Expense</h5>
            <button
              onClick={handleToggle}
              type="button"
              className="bd-btn-close"
            >
              <i className="fa-solid fa-xmark-large"></i>
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="common-scrollbar overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
              <div className="col-span-12">
                <div className="card__wrapper mb-20">
                  <div className="grid grid-cols-12 gap-y-5 gap-x-5 maxXs:gap-x-0">
                    <div className="col-span-12 md:col-span-6">
                      <InputField
                        label="Invoice Number"
                        id="invoiceNumber"
                        type="text"
                        register={register("invoiceNumber", {
                          required: "Invoice Number is required",
                        })}
                        error={errors.invoiceNumber}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <InputField
                        label="Item Name"
                        id="itemName"
                        type="text"
                        register={register("itemName", {
                          required: "Item Name is required",
                        })}
                        error={errors.itemName}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <InputField
                        label="Purchased By"
                        id="purchasedBy"
                        type="text"
                        value={user?.fullName || ""}
                        disabled={true}
                        register={register("purchasedBy")}
                        error={errors.purchasedBy}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormLabel
                        label="Purchase Date"
                        id="selectPurchaseDate"
                      />
                      <div className="datepicker-style">
                        <DatePicker
                          id="selectPurchaseDate"
                          selected={selectPurchaseDate}
                          onChange={(date) => setSelectPurchaseDate(date)}
                          showYearDropdown
                          showMonthDropdown
                          useShortMonthInDropdown
                          showPopperArrow={false}
                          peekNextMonth
                          dropdownMode="select"
                          isClearable
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Purchase date"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <InputField
                        label="Purchase Amount"
                        id="amount"
                        type="number"
                        required={false}
                        register={register("amount")}
                        error={errors.purchaseDate}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <SelectBox
                        id="status"
                        label="Purchase Status"
                        options={purchaseStatusOptions}
                        control={control} // Validation rule
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
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddExpenseModal;

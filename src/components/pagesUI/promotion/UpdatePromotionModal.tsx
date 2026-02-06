"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { IPromotion } from "@/interface/table.interface";
import { promotionstatePropsType } from "@/interface/common.interface";
import InputField from "@/components/elements/SharedInputs/InputField";
import FormLabel from "@/components/elements/SharedInputs/FormLabel";

const UpdatePromotionModal = ({ open, setOpen, editData }: promotionstatePropsType) => {
  const [loading, setLoading] = useState(false);
  const [selectDate, setSelectDate] = useState<Date | null>(new Date());
  const [isManager, setIsManager] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IPromotion>();

  useEffect(() => {
    if (editData) {
      reset(editData);
      setIsManager(!!editData.isManagerPromotion);
      if (editData.promotionDate) setSelectDate(new Date(editData.promotionDate));
    }
  }, [editData, reset]);

  const onSubmit = async (data: IPromotion) => {
    if (!editData?.id) return;
    setLoading(true);
    try {
      const payload = {
        ...data,
        promotionDate: selectDate?.toISOString(),
        isManagerPromotion: isManager,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/promotions?id=${editData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");
      toast.success("Updated!");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error("Error updating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle className="font-bold">Edit Promotion</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-5 pt-4">
          <div className="col-span-12 md:col-span-6">
            <InputField label="Designation" id="designation" register={register("designation", { required: true })} error={errors.designation} />
          </div>
          <div className="col-span-12 md:col-span-6">
            <InputField label="Promotion Title" id="promotionTitle" register={register("promotionTitle", { required: true })} error={errors.promotionTitle} />
          </div>
          <div className="col-span-12 md:col-span-6">
            <FormLabel label="Date" id="date" />
            <DatePicker selected={selectDate} onChange={setSelectDate} className="w-full border p-2 rounded h-[45px]" />
          </div>
          <div className="col-span-12">
            <div className="flex items-center gap-3 p-3 bg-blue-50 border rounded">
              <input type="checkbox" checked={isManager} onChange={(e) => setIsManager(e.target.checked)} className="w-5 h-5" />
              <label className="font-bold">Manager Role?</label>
            </div>
          </div>
          <div className="col-span-12">
            <InputField label="Description" id="description" isTextArea register={register("description", { required: true })} error={errors.description} />
          </div>
          <div className="col-span-12 flex justify-end gap-3">
            <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>Save</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePromotionModal;
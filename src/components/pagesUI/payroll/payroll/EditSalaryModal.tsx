"use client";
import React, { useEffect } from "react";
import { Dialog } from "@mui/material";
import { IPaylist } from "@/interface/payroll.interface";
import { IPayrollLineItem } from "@/interface/table.interface";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

const EditSalaryModal = ({ open, setOpen, editData, onSave }: any) => {
  const { register, handleSubmit, control, reset, watch } = useForm<IPaylist>();

  const { fields: addFields, append: appendAdd, remove: removeAdd } = useFieldArray({ control, name: "additions" });
  const { fields: dedFields, append: appendDed, remove: removeDed } = useFieldArray({ control, name: "deductions" });

  useEffect(() => {
    if (open && editData) {
      reset({
        ...editData,
        // Ensure arrays exist so useFieldArray can map them
        additions: editData.additions || [],
        deductions: editData.deductions || [],
      });
    }
  }, [open, editData, reset]);

  // Watch values to update the "Revised Net Total" live in the UI
  const watchedValues = watch();
  
  const calculateNetPay = (): number => {
    const basic = Number(watchedValues.salaryMonthly) || 0;
    const adds = (watchedValues.additions as IPayrollLineItem[])?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
    const dels = (watchedValues.deductions as IPayrollLineItem[])?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
    return (basic + adds) - dels;
  };

  const onSubmit = async (data: IPaylist) => {
    const loadingToast = toast.loading("Updating salary record...");
    try {
      const netPay = calculateNetPay();
      
      // Clean the payload
      const payload = {
        ...data,
        salaryMonthly: Number(data.salaryMonthly),
        netPay: netPay,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/payroll?id=${editData?.id}`, {
        method: "PATCH", // CHANGED: Use PATCH or ensure your route handler supports PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Payroll record updated successfully", { id: loadingToast });
        onSave(); // Refresh the table
        setOpen(false);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update database", { id: loadingToast });
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const labelClass = "block mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500";

  return (
    <Dialog 
      open={open} 
      onClose={() => setOpen(false)} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        style: { borderRadius: '2.5rem' },
        className: "dark:bg-[#1e293b] border dark:border-slate-800 shadow-2xl"
      }}
    >
      <div className="p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Edit Salary Record</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Modifying payroll for: <span className="text-blue-600 dark:text-blue-400 font-bold">{editData?.employeeName}</span></p>
          </div>
          <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="p-8 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="max-w-md mx-auto text-center">
              <label className={labelClass}>Monthly Base Salary</label>
              <div className="relative">
                <input 
                  type="number" 
                  {...register("salaryMonthly", { valueAsNumber: true })} 
                  className={`${inputClass} text-center text-xl font-bold`} 
                  placeholder="0" 
                />
                <span className="absolute right-4 top-4 text-[10px] font-black text-slate-400">FCFA</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Earnings Section */}
            <div className="space-y-6">
               <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                 <h6 className="text-[12px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                   <i className="fa-solid fa-plus-circle"></i> Earnings
                 </h6>
                 <button type="button" className="p-1 px-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all" onClick={() => appendAdd({ label: "", amount: 0 })}>
                    ADD ITEM
                 </button>
               </div>
               {addFields.map((f, i) => (
                 <div key={f.id} className="flex gap-3 items-center">
                   <input className={inputClass} placeholder="Label" {...register(`additions.${i}.label` as any)} />
                   <input className={`${inputClass} w-36`} type="number" {...register(`additions.${i}.amount` as any, { valueAsNumber: true })} />
                   <button type="button" className="text-slate-300 hover:text-rose-500 p-2" onClick={() => removeAdd(i)}>
                     <i className="fa-solid fa-trash-can"></i>
                   </button>
                 </div>
               ))}
            </div>

            {/* Deductions Section */}
            <div className="space-y-6">
               <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                 <h6 className="text-[12px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                   <i className="fa-solid fa-minus-circle"></i> Deductions
                 </h6>
                 <button type="button" className="p-1 px-3 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all" onClick={() => appendDed({ label: "", amount: 0 })}>
                    ADD ITEM
                 </button>
               </div>
               {dedFields.map((f, i) => (
                 <div key={f.id} className="flex gap-3 items-center">
                   <input className={inputClass} placeholder="Label" {...register(`deductions.${i}.label` as any)} />
                   <input className={`${inputClass} w-36`} type="number" {...register(`deductions.${i}.amount` as any, { valueAsNumber: true })} />
                   <button type="button" className="text-slate-300 hover:text-rose-500 p-2" onClick={() => removeDed(i)}>
                     <i className="fa-solid fa-trash-can"></i>
                   </button>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-blue-600 p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="text-center md:text-left">
               <span className="text-[10px] font-black text-blue-300 dark:text-blue-100 uppercase tracking-[0.3em]">Revised Net Total</span>
               <h3 className="text-4xl font-black text-white mt-1 tracking-tight">
                 {calculateNetPay().toLocaleString()} <span className="text-sm font-bold opacity-60">FCFA</span>
               </h3>
             </div>
             <div className="flex gap-4 w-full md:w-auto">
                <button type="button" onClick={() => setOpen(false)} className="px-8 py-5 text-white/70 font-bold hover:text-white">
                  Discard
                </button>
                <button type="submit" className="px-12 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl">
                  Save Changes
                </button>
             </div>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default EditSalaryModal;
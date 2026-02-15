"use client";
import React, { useEffect, useState } from "react";
import { Dialog } from "@mui/material";
import { useForm, useFieldArray } from "react-hook-form";
import { IPayrollLineItem } from "@/interface/table.interface";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuthUserContext } from "@/context/UserAuthContext";

const AddNewSalaryModal = ({ open, setOpen, onSuccess }: any) => {
  const { user } = useAuthUserContext();
  const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, control, reset, watch } = useForm({
    defaultValues: {
      employeeUid: "",
      salaryMonthly: 0,
      additions: [{ label: "Transport", amount: 0 }] as IPayrollLineItem[],
      deductions: [{ label: "Late Penalty", amount: 0 }] as IPayrollLineItem[]
    }
  });

  const { fields: addFields, append: appendAdd, remove: removeAdd } = useFieldArray({ control, name: "additions" });
  const { fields: dedFields, append: appendDed, remove: removeDed } = useFieldArray({ control, name: "deductions" });

  const watched = watch();

  const calculateNetPay = (): number => {
    const basic = Number(watched.salaryMonthly) || 0;
    const adds = watched.additions?.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0) || 0;
    const dels = watched.deductions?.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0) || 0;
    return (basic + adds) - dels;
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user?.companyId) return;
      try {
        // Fetching from 'employees' collection to get employeeId and email
        const q = query(collection(db, "employees"), where("companyId", "==", user.companyId));
        const snapshot = await getDocs(q);
        const formatted = snapshot.docs.map(doc => ({
          value: doc.data().userId || doc.id,
          label: doc.data().fullName || "Unnamed",
          email: doc.data().email || "",
          employeeId: doc.data().employeeId || "N/A"
        }));
        setEmployeeOptions(formatted);
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };
    if (open) fetchEmployees();
  }, [open, user?.companyId]);

  const onSubmit = async (data: any) => {
    if (!user?.companyId) return toast.error("User session not found");
    setSubmitting(true);
    
    const selectedEmp = employeeOptions.find(o => o.value === data.employeeUid);
    const now = new Date();
    
    const payload = {
      ...data,
      companyId: user.companyId,
      employeeName: selectedEmp?.label || "Unknown",
      employeeEmail: selectedEmp?.email || "",
      employeeId: selectedEmp?.employeeId || "N/A", 
      netPay: calculateNetPay(),
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear().toString(),
      salaryMonth: now.getMonth() + 1, 
      salaryYear: now.getFullYear(),   
      createdAt: now.toISOString(),
      status: "Unpaid"
    };

    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Payroll Created Successfully");
        onSuccess?.();
        setOpen(false);
        reset();
      }
    } catch (err) {
      toast.error("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const labelClass = "block mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500";

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md" PaperProps={{ className: "dark:bg-[#1e293b] rounded-[2.5rem] border dark:border-slate-800 shadow-2xl" }}>
      <div className="p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Generate Payroll</h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Capture salary and employee metadata.</p>
          </div>
          <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="relative">
              <label className={labelClass}>Select Employee</label>
              <select {...register("employeeUid", { required: true })} className={inputClass}>
                <option value="" className="dark:bg-slate-900">Choose an employee...</option>
                {employeeOptions.map(opt => <option key={opt.value} value={opt.value} className="dark:bg-slate-900">{opt.label} ({opt.employeeId})</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Base Salary (Monthly)</label>
              <input type="number" {...register("salaryMonthly")} className={inputClass} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
               <h6 className="text-[12px] font-black text-emerald-500 uppercase tracking-widest border-b dark:border-slate-800 pb-3 flex justify-between">Earnings <button type="button" onClick={() => appendAdd({ label: "", amount: 0 })} className="text-[10px]">+ Add</button></h6>
               {addFields.map((f, i) => (
                 <div key={f.id} className="flex gap-3"><input className={inputClass} {...register(`additions.${i}.label` as any)} /><input className={`${inputClass} w-24`} type="number" {...register(`additions.${i}.amount` as any)} /></div>
               ))}
            </div>
            <div className="space-y-6">
               <h6 className="text-[12px] font-black text-rose-500 uppercase tracking-widest border-b dark:border-slate-800 pb-3 flex justify-between">Deductions <button type="button" onClick={() => appendDed({ label: "", amount: 0 })} className="text-[10px]">+ Add</button></h6>
               {dedFields.map((f, i) => (
                 <div key={f.id} className="flex gap-3"><input className={inputClass} {...register(`deductions.${i}.label` as any)} /><input className={`${inputClass} w-24`} type="number" {...register(`deductions.${i}.amount` as any)} /></div>
               ))}
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-blue-600 p-10 rounded-[2.5rem] flex justify-between items-center text-white">
             <div><span className="text-[10px] font-black uppercase opacity-60">Total Pay</span><h3 className="text-4xl font-black">{calculateNetPay().toLocaleString()} FCFA</h3></div>
             <button type="submit" disabled={submitting} className="px-12 py-5 bg-white text-slate-900 font-black rounded-2xl hover:scale-105 transition-all shadow-xl">{submitting ? "Processing..." : "Generate Record"}</button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default AddNewSalaryModal;
"use client";

import ErrorMessage from "@/components/error-message/ErrorMessage";
import { IForgotForm } from "@/interface";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";

export default function ForgotBasicForm() {
  const [loading,setLoading]=useState(false);
  const {register,handleSubmit,formState:{errors}}=useForm<IForgotForm>();
  const onSubmit=async(data:IForgotForm)=>{
    setLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      await base44.auth.resetPasswordRequest(email);
      toast.success("If the account exists, a reset link has been sent. Check your inbox and spam folder.");
    } catch(error:any) {
      toast.error(error?.status===429?"Too many requests. Please wait and try again.":"Unable to request a reset right now.");
    } finally { setLoading(false); }
  };
  return <form onSubmit={handleSubmit(onSubmit)}>
    <div className="from__input-box"><div className="form__input-title"><label htmlFor="email">Email</label></div>
      <div className="form__input"><input className="form-control" id="email" type="email" autoComplete="email" {...register("email",{required:"Email is required",pattern:{value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,message:"Invalid email address"}})}/><ErrorMessage error={errors.email}/></div>
    </div>
    <div className="mb-4"><button disabled={loading} className="btn btn-primary w-full" type="submit">{loading?"Sending…":"Send reset link"}</button></div>
    <div className="text-center"><Link className="back-to-btn" href="/auth/signin-basic">Back to login</Link></div>
  </form>;
}

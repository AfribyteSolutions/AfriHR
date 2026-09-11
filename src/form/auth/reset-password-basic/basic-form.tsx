"use client";

import ErrorMessage from "@/components/error-message/ErrorMessage";
import { IResetPasswordForm } from "@/interface";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { base44 } from "@/lib/base44";

export default function ResetPasswordBasicForm({oobCode}:{oobCode:string}) {
  const [loading,setLoading]=useState(false);
  const router=useRouter();
  const {register,handleSubmit,watch,formState:{errors}}=useForm<IResetPasswordForm>();
  const onSubmit=async(data:IResetPasswordForm)=>{
    if(!oobCode)return toast.error("Reset token is missing or invalid.");
    setLoading(true);
    try {
      await base44.auth.resetPassword({resetToken:oobCode,newPassword:data.password});
      toast.success("Password reset. You can now sign in.");
      router.replace("/auth/signin-basic");
    } catch(error:any) {
      toast.error(error?.status===400?"This reset link is invalid or expired.":error?.message||"Password reset failed.");
    } finally {setLoading(false);}
  };
  return <form onSubmit={handleSubmit(onSubmit)}>
    <div className="from__input-box"><div className="form__input-title"><label htmlFor="passwordInput">New password</label></div><div className="form__input"><input className="form-control" type="password" id="passwordInput" autoComplete="new-password" {...register("password",{required:"Password is required",minLength:{value:8,message:"Password must be at least 8 characters"}})}/><ErrorMessage error={errors.password}/></div></div>
    <div className="from__input-box"><div className="form__input-title"><label htmlFor="passwordInput2">Confirm password</label></div><div className="form__input"><input className="form-control" type="password" id="passwordInput2" autoComplete="new-password" {...register("password2",{required:"Please confirm your password",validate:value=>value===watch("password")||"Passwords do not match"})}/><ErrorMessage error={errors.password2}/></div></div>
    <div className="mb-4"><button disabled={loading} className="btn btn-primary w-full" type="submit">{loading?"Updating…":"Set new password"}</button></div>
    <div className="text-center"><Link href="/auth/signin-basic">Back to login</Link></div>
  </form>;
}

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import ErrorMessage from "@/components/error-message/ErrorMessage";
import { ISignInForm } from "@/interface";
import { base44 } from "@/lib/base44";
import { useAuthUserContext } from "@/context/UserAuthContext";

const SignInBasicForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ISignInForm>();
  const { refreshUser } = useAuthUserContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSubmit = async (data: ISignInForm) => {
    setIsLoading(true);
    try {
      const result = await base44.auth.loginViaEmailPassword(data.email.trim().toLowerCase(), data.password);
      const user = result.user;
      if (["suspended", "offboarded"].includes(user?.employment_status)) {
        await base44.auth.logout("/auth/signin-basic?reason=account-disabled");
        toast.error("This account has been disabled. Contact your HR administrator.");
        return;
      }
      await refreshUser();
      toast.success(`Welcome back, ${user.full_name || "User"}!`);
      const requested = searchParams.get("redirect") || searchParams.get("returnUrl");
      const safePath = requested && requested.startsWith("/") && !requested.startsWith("//")
        ? requested
        : "/hrm/recruitment-flow";
      router.replace(safePath);
      router.refresh();
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      toast.error(status === 401 ? "Invalid email or password." : status === 403 ? "Please verify your email before signing in." : error?.message || "Sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="from__input-box">
        <div className="form__input-title"><label htmlFor="nameEmail">Email</label></div>
        <div className="form__input">
          <input className="form-control" id="nameEmail" type="email" autoComplete="email"
            {...register("email", { required: "Email is required" })} />
          <ErrorMessage error={errors.email} />
        </div>
      </div>
      <div className="from__input-box">
        <div className="form__input-title flex justify-between">
          <label htmlFor="passwordInput">Password</label>
          <Link href="/auth/forgot-password-basic"><small>Forgot Password?</small></Link>
        </div>
        <div className="form__input">
          <input className="form-control" type={isPasswordVisible ? "text" : "password"} id="passwordInput"
            autoComplete="current-password" {...register("password", { required: "Password is required" })} />
          <ErrorMessage error={errors.password} />
          <button type="button" aria-label="Toggle password visibility" className="pass-icon"
            onClick={() => setIsPasswordVisible(v => !v)}>
            <i className={`fa-sharp fa-light ${isPasswordVisible ? "fa-eye" : "fa-eye-slash"}`} />
          </button>
        </div>
      </div>
      <div className="mb-4">
        <button className="btn btn-primary w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
};

export default SignInBasicForm;

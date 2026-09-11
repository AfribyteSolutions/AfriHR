"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Checkbox, FormControlLabel } from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ErrorMessage from "@/components/error-message/ErrorMessage";
import { ISignInForm } from "@/interface";

const SignInBasicForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ISignInForm>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect');

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  const onSubmit = async (data: ISignInForm) => {
    setIsLoading(true);

    try {
      const user = await login(data.email, data.password);

      toast.success(`Welcome back, ${user.full_name || "User"}!`);

      // Redirect based on role
      const dashboardPath = getDashboardPath(user.app_role || user.role);

      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push(dashboardPath);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || "Invalid email or password";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  function getDashboardPath(role: string): string {
    switch (role) {
      case "platform_admin":
        return "/super-admin/dashboard";
      case "tenant_admin":
      case "hr_manager":
        return "/dashboard/hrm-dashboard";
      case "manager":
        return "/dashboard/hrm-dashboard";
      case "recruiter":
        return "/hrm/recruitment-flow";
      case "employee":
        return "/dashboard/employee-dashboard";
      case "auditor":
        return "/dashboard/hrm-dashboard";
      default:
        return "/dashboard";
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="from__input-box">
        <div className="form__input-title">
          <label htmlFor="nameEmail">Email</label>
        </div>
        <div className="form__input">
          <input
            className="form-control"
            id="nameEmail"
            type="email"
            {...register("email", { required: "Email is required" })}
          />
          <ErrorMessage error={errors.email} />
        </div>
      </div>

      <div className="from__input-box">
        <div className="form__input-title flex justify-between">
          <label htmlFor="passwordInput">Password</label>
          <Link href="/auth/forgot-password-basic">
            <small>Forgot Password?</small>
          </Link>
        </div>
        <div className="form__input">
          <input
            className="form-control"
            type={isPasswordVisible ? "text" : "password"}
            id="passwordInput"
            {...register("password", { required: "Password is required" })}
          />
          <ErrorMessage error={errors.password} />
          <div className="pass-icon" onClick={togglePasswordVisibility}>
            <i className={`fa-sharp fa-light ${isPasswordVisible ? "fa-eye" : "fa-eye-slash"}`}></i>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <FormControlLabel
          control={<Checkbox className="custom-checkbox" {...register("rememberMe")} />}
          label="Remember Me"
        />
      </div>

      <div className="mb-4">
        <button
          className="btn btn-primary w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
};

export default SignInBasicForm;

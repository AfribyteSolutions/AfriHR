"use client";

import ErrorMessage from "@/components/error-message/ErrorMessage";
import { IResetPasswordForm } from "@/interface";
import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";

// ✅ Declare props interface
interface ResetPasswordBasicFormProps {
  oobCode: string;
}

const ResetPasswordBasicForm: React.FC<ResetPasswordBasicFormProps> = ({ oobCode }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IResetPasswordForm>();

  const onSubmit = async (data: IResetPasswordForm) => {
    if (!oobCode) {
      toast.error("Reset code is missing or invalid.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      toast.success("Password reset successfully. You can now log in.");
      router.push("/auth/signin-basic");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="from__input-box">
        <div className="form__input-title">
          <label htmlFor="passwordInput">New Password</label>
        </div>
        <div className="form__input">
          <input
            className="form-control"
            type={isPasswordVisible ? "text" : "password"}
            id="passwordInput"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            })}
          />
          <ErrorMessage error={errors.password} />
          <div className="pass-icon" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
            <i className={`fa-sharp fa-light ${isPasswordVisible ? "fa-eye" : "fa-eye-slash"}`}></i>
          </div>
        </div>
      </div>

      <div className="from__input-box">
        <div className="form__input-title">
          <label htmlFor="passwordInput2">Confirm Password</label>
        </div>
        <div className="form__input">
          <input
            className="form-control"
            type={isConfirmPasswordVisible ? "text" : "password"}
            id="passwordInput2"
            {...register("password2", {
              required: "Please confirm your password",
              validate: (value) => value === watch("password") || "Passwords do not match",
            })}
          />
          <ErrorMessage error={errors.password2} />
          <div className="pass-icon" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
            <i className={`fa-sharp fa-light ${isConfirmPasswordVisible ? "fa-eye" : "fa-eye-slash"}`}></i>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <button className="btn btn-primary w-full" type="submit">
          Set new password
        </button>
      </div>
      <div className="text-center">
        <Link href="/auth/signin-basic">Back to login</Link>
      </div>
    </form>
  );
};

export default ResetPasswordBasicForm;

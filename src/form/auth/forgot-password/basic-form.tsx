"use client";

import ErrorMessage from '@/components/error-message/ErrorMessage';
import { IForgotForm } from '@/interface';
import Link from 'next/link';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ForgotBasicForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IForgotForm>();

  const onSubmit = async (data: IForgotForm) => {
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast.success("Reset link sent successfully. Check your email.");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        toast.error("No user found with this email.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else {
        toast.error("Failed to send reset link. Try again later.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="from__input-box">
        <div className="form__input-title">
          <label htmlFor="email">Email</label>
        </div>
        <div className="form__input">
          <input
            className="form-control"
            id="email"
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address",
              },
            })}
          />
          <ErrorMessage error={errors.email} />
        </div>
      </div>
      <div className="mb-4">
        <button className="btn btn-primary w-full" type="submit">Send Reset Link</button>
      </div>
      <div className="text-center">
        <Link className="back-to-btn" href="/auth/signin-basic">Back to login</Link>
      </div>
    </form>
  );
};

export default ForgotBasicForm;

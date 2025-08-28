"use client";

import ErrorMessage from '@/components/error-message/ErrorMessage';
import { ISignInForm } from '@/interface';
import { Checkbox, FormControlLabel } from '@mui/material';
import Link from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const SignInCoverForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ISignInForm>();

  const onSubmit = async (data: ISignInForm) => {
    const { name, password } = data;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, name, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const role = userDoc.exists() ? userDoc.data()?.role : 'user';

      toast.success(`Signed in as ${role}`);

      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('No account found with this email.');
          break;
        case 'auth/wrong-password':
          toast.error('Incorrect password.');
          break;
        case 'auth/invalid-credential':
          toast.error('Invalid email or password.');
          break;
        default:
          toast.error('Sign-in failed. Please try again.');
          break;
      }
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
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
            {...register("name", { required: "Email is required" })}
          />
          <ErrorMessage error={errors.name} />
        </div>
      </div>

      <div className="from__input-box">
        <div className="form__input-title flex justify-between">
          <label htmlFor="passwordInput">Password</label>
          <Link href="/auth/auth-forgot-password-basic">
            <small>Forgot Password?</small>
          </Link>
        </div>
        <div className="form__input relative">
          <input
            className="form-control"
            type={isPasswordVisible ? "text" : "password"}
            id="passwordInput"
            {...register("password", { required: "Password is required" })}
          />
          <ErrorMessage error={errors.password} />
          <div className="pass-icon absolute top-3 right-3 cursor-pointer" onClick={togglePasswordVisibility}>
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
        <button className="btn btn-primary w-full" type="submit">Sign in</button>
      </div>
    </form>
  );
};

export default SignInCoverForm;

"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox, FormControlLabel } from "@mui/material";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import ErrorMessage from "@/components/error-message/ErrorMessage";
import { ISignInForm } from "@/interface";

const SignInBasicForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ISignInForm>();
  const router = useRouter();

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  const onSubmit = async (data: ISignInForm) => {
    try {
      console.log("🔐 Starting sign-in process...");
      
      // 1. Sign in to Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      console.log("✅ Firebase Auth successful, UID:", user.uid);

      // 2. Get user data from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        toast.error("No user data found in database.");
        return;
      }

      const userData = userSnap.data();
      console.log("✅ User data:", userData);

      // 3. Set cookies with multiple approaches for debugging
      console.log("🍪 Setting role cookie:", userData.role);
      
      // Method 1: Using document.cookie (most reliable for client-side)
      document.cookie = `role=${userData.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      
      // Method 2: Also try setting with different name for debugging
      document.cookie = `userRole=${userData.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      
      // Method 3: Set additional user info
      document.cookie = `userId=${user.uid}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = `userEmail=${userData.email}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // 4. Verify cookies were set
      console.log("🍪 All cookies after setting:", document.cookie);
      
      // 5. Get company data using companyId
      if (!userData.companyId) {
        toast.error("No company ID found for this user.");
        return;
      }

      const companyDocRef = doc(db, "companies", userData.companyId);
      const companySnap = await getDoc(companyDocRef);

      if (!companySnap.exists()) {
        toast.error("Company not found.");
        return;
      }

      const companyData = companySnap.data();
      console.log("🏢 Company data:", companyData);

      // 6. Build dashboard path based on role + subdomain
      const subdomain = companyData.subdomain;
      if (!subdomain) {
        toast.error("Company subdomain not configured. Contact admin.");
        return;
      }

      let dashboardPath = "";
      if (process.env.NODE_ENV === "development") {
        switch (userData.role) {
          case "admin":
          case "manager":
            dashboardPath = `http://${subdomain}.localhost:3000/dashboard/hrm-dashboard`;
            break;
          case "employee":
            dashboardPath = `http://${subdomain}.localhost:3000/dashboard/employee-dashboard`;
            break;
          case "super-admin":
            dashboardPath = `http://${subdomain}.localhost:3000/super-admin/dashboard`;
            break;
          default:
            toast.error("Unknown role. Contact admin.");
            return;
        }
      } else {
        switch (userData.role) {
          case "admin":
            dashboardPath = `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}/dashboard/hrm-dashboard`;
            break;
          case "manager":
            dashboardPath = `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}/dashboard/employee-dashboard`;
            break;
          case "employee":
            dashboardPath = `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}/dashboard/employee-dashboard`;
            break;
          case "super-admin":
            dashboardPath = `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}/super-admin/dashboard`;
            break;
          default:
            toast.error("Unknown role. Contact admin.");
            return;
        }
      }

      console.log("🔄 Redirecting to:", dashboardPath);
      toast.success(`Welcome back, ${userData.fullName || "User"}!`);

      // 7. Add a small delay to ensure cookies are set before redirect
      setTimeout(() => {
        console.log("🍪 Final cookies before redirect:", document.cookie);
        window.location.href = dashboardPath;
      }, 500);

    } catch (error: any) {
      console.error("❌ Sign-in error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Please check your account permissions.");
        return;
      }

      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No user found with this email.");
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password.");
          break;
        case "auth/invalid-credential":
          toast.error("Invalid email or password.");
          break;
        default:
          toast.error("Something went wrong. Please try again.");
      }
    }
  };

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
        <button className="btn btn-primary w-full" type="submit">
          Sign in
        </button>
      </div>
    </form>
  );
};

export default SignInBasicForm;
"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ISignInForm>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get returnUrl from URL params for redirect after login
  const returnUrl = searchParams.get('returnUrl');

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  const onSubmit = async (data: ISignInForm) => {
    setIsLoading(true);

    try {
      console.log("🔐 Starting sign-in process...");
      
      // 1. Sign in to Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      console.log("✅ Firebase Auth successful, UID:", user.uid);

      // 2. Get Firebase ID token (this is what we'll use for auth)
      const idToken = await user.getIdToken();

      // 3. Get user data from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        toast.error("No user data found in database.");
        await auth.signOut();
        return;
      }

      const userData = userSnap.data();
      console.log("✅ User data:", userData);

      // 4. Get company data
      if (!userData.companyId) {
        toast.error("No company ID found for this user.");
        await auth.signOut();
        return;
      }

      const companyDocRef = doc(db, "companies", userData.companyId);
      const companySnap = await getDoc(companyDocRef);

      if (!companySnap.exists()) {
        toast.error("Company not found.");
        await auth.signOut();
        return;
      }

      const companyData = companySnap.data();
      const subdomain = companyData.subdomain;

      if (!subdomain) {
        toast.error("Company subdomain not configured. Contact admin.");
        await auth.signOut();
        return;
      }

      // 5. Determine the base URL for the company subdomain
      const baseUrl = process.env.NODE_ENV === "development"
        ? `http://${subdomain}.localhost:3000`
        : `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`;

      // Check if we're already on the correct subdomain
      const currentHostname = window.location.hostname;
      const isOnCorrectSubdomain = currentHostname.includes(subdomain);

      if (isOnCorrectSubdomain) {
        // We're on the correct subdomain, set cookies directly
        console.log("🍪 Setting cookies via API (already on correct subdomain)...");
        const setCookieResponse = await fetch("/api/auth/set-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: idToken,
            role: userData.role,
            userId: user.uid,
            email: userData.email,
            subdomain: subdomain,
            rememberMe: data.rememberMe || false
          }),
        });

        if (!setCookieResponse.ok) {
          const errorData = await setCookieResponse.json();
          toast.error(errorData.error || "Failed to set session");
          await auth.signOut();
          return;
        }

        console.log("✅ Cookies set successfully");

        // Build dashboard path
        let dashboardPath = "";
        switch (userData.role) {
          case "admin":
          case "manager":
            dashboardPath = "/dashboard/hrm-dashboard";
            break;
          case "employee":
            dashboardPath = "/dashboard/employee-dashboard";
            break;
          case "super-admin":
            dashboardPath = "/super-admin/dashboard";
            break;
          default:
            toast.error("Unknown role. Contact admin.");
            await auth.signOut();
            return;
        }

        toast.success(`Welcome back, ${userData.fullName || "User"}!`);

        // Redirect to dashboard
        if (returnUrl) {
          const decodedReturnUrl = decodeURIComponent(returnUrl);
          router.push(decodedReturnUrl);
        } else {
          router.push(dashboardPath);
        }
      } else {
        // We need to redirect to the correct subdomain with a session token
        console.log("🔄 Creating session token for subdomain redirect...");

        // Create a one-time session token
        const sessionTokenResponse = await fetch("/api/auth/create-session-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: idToken,
            role: userData.role,
            userId: user.uid,
            email: userData.email,
            subdomain: subdomain,
            rememberMe: data.rememberMe || false
          }),
        });

        if (!sessionTokenResponse.ok) {
          const errorData = await sessionTokenResponse.json();
          toast.error(errorData.error || "Failed to create session");
          await auth.signOut();
          return;
        }

        const { sessionToken } = await sessionTokenResponse.json();
        console.log("✅ Session token created");

        toast.success(`Welcome back, ${userData.fullName || "User"}! Redirecting...`);

        // Redirect to the subdomain's session restore page
        const restoreUrl = `${baseUrl}/auth/session-restore?token=${sessionToken}`;
        console.log("🔄 Redirecting to:", restoreUrl);
        window.location.href = restoreUrl;
      }

    } catch (error: any) {
      console.error("❌ Sign-in error:", error);
      
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
        case "auth/too-many-requests":
          toast.error("Too many failed attempts. Please try again later.");
          break;
        default:
          toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
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
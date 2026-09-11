"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { base44 } from "@/lib/base44";
import logoSvg from "../../../../public/assets/images/logo/logo.svg";
import logoWhite from "../../../../public/assets/images/logo/logo-white.svg";
import SignInBasicForm from "@/form/auth/SignIn/basic-form";

export default function SignInBasicMain() {
  const router = useRouter();

  useEffect(() => {
    base44.auth.isAuthenticated()
      .then(async ok => {
        if (!ok) return;
        const user = await base44.auth.me();
        if (["suspended", "offboarded"].includes(user?.employment_status)) {
          await base44.auth.logout("/auth/signin-basic?reason=account-disabled");
          return;
        }
        router.replace("/hrm/recruitment-flow");
      })
      .catch(() => undefined);
  }, [router]);

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper basic-authentication">
        <div className="authentication-inner">
          <div className="card__wrapper">
            <div className="authentication-top text-center mb-[20px]">
              <Link href="/" className="authentication-logo logo-black">
                <Image style={{ width: "100%", height: "auto" }} src={logoSvg} alt="AfriHR" />
              </Link>
              <Link href="/" className="authentication-logo logo-white">
                <Image style={{ width: "100%", height: "auto" }} src={logoWhite} alt="AfriHR" />
              </Link>
              <h4 className="mb-[15px]">Welcome to AfriHR</h4>
              <p className="mb-[15px]">Sign in to manage your people lifecycle.</p>
            </div>
            <SignInBasicForm />
            <p className="text-center">
              <span>Use the credentials registered in Base44.</span><br />
              <Link href="/auth/forgot-password-basic"><span>Forgot Password?</span></Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

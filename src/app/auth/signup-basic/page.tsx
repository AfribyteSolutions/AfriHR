"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { base44 } from "@/lib/base44";
import logoSvg from "../../../../public/assets/images/logo/logo.svg";
import logoWhite from "../../../../public/assets/images/logo/logo-white.svg";
import SignUpBasicForm from "@/form/auth/SignUp/basic-form";

export default function SignUpBasicMain() {
  const router = useRouter();
  useEffect(() => {
    base44.auth.isAuthenticated().then(ok => { if (ok) router.replace("/hrm/employee"); }).catch(() => undefined);
  }, [router]);

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
    <div className="authentication-top text-center mb-6">
      <Link href="/" className="authentication-logo logo-black"><Image src={logoSvg} style={{width:"100%",height:"auto"}} alt="AfriHR"/></Link>
      <Link href="/" className="authentication-logo logo-white"><Image src={logoWhite} style={{width:"100%",height:"auto"}} alt="AfriHR"/></Link>
      <h1 className="text-2xl font-black mt-5">Create your AfriHR workspace</h1>
      <p className="mt-2 text-slate-500">Register, verify your email, and provision your company securely on Base44.</p>
    </div>
    <SignUpBasicForm/>
  </div>;
}

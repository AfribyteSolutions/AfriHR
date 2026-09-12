"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { base44 } from "@/lib/base44";

export default function SessionRestorePage() {
  const router=useRouter();
  const params=useSearchParams();
  useEffect(()=>{
    const next=params.get("redirect");
    const safe=next?.startsWith("/")&&!next.startsWith("//")?next:"/hrm/employee";
    base44.auth.isAuthenticated()
      .then(ok=>router.replace(ok?safe:"/auth/signin-basic?redirect="+encodeURIComponent(safe)))
      .catch(()=>router.replace("/auth/signin-basic"));
  },[params,router]);
  return <div className="min-h-screen grid place-items-center bg-slate-50"><p className="font-bold text-slate-600">Checking your Base44 session…</p></div>;
}

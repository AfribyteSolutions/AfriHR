"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import RecruitmentDashboard from "@/components/recruitment/RecruitmentDashboard";
import { useAuthUserContext } from "@/context/UserAuthContext";

export default function RecruitmentFlow() {
  const { user, loading } = useAuthUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/signin-basic?redirect=/hrm/recruitment-flow");
  }, [loading, user, router]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center bg-slate-50">Loading AfriHR…</div>;
  const allowed = ["platform_admin", "tenant_admin", "hr_manager", "recruiter"].includes(user.appRole);
  if (!allowed) return <div className="min-h-screen grid place-items-center p-6"><div><h1 className="text-xl font-bold">Access denied</h1><p>Your role cannot manage recruitment.</p></div></div>;
  return <RecruitmentDashboard userData={user} />;
}

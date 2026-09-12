"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuthUserContext} from "@/context/UserAuthContext";
const HR=new Set(["tenant_admin","hr_manager","recruiter","manager","payroll_manager","finance_manager"]);
export default function DashboardPage(){
 const {user,loading}=useAuthUserContext(),router=useRouter();
 useEffect(()=>{if(loading)return;if(!user){router.replace("/auth/signin-basic?redirect=/dashboard");return}if(user.appRole==="platform_admin")router.replace("/super-admin/dashboard");else if(HR.has(user.appRole))router.replace("/dashboard/hrm-dashboard");else router.replace("/dashboard/employee-dashboard")},[user,loading,router]);
 return <div className="min-h-screen grid place-items-center">Opening your AfriHR workspace…</div>;
}

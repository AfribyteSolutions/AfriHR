"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { base44 } from "@/lib/base44";

const links = [
  ["/hrm/recruitment-flow", "Recruitment"],
  ["/hrm/employee", "Employees"],
  ["/hrm/onboarding", "Onboarding"],
  ["/hrm/leaves", "Leave"]
];

export default function NativeHrShell({ title, subtitle, children, action }: {
  title: string; subtitle: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  const pathname = usePathname();
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black">{title}</h1><p className="text-xs text-slate-500">{subtitle}</p></div>
        <div className="flex items-center gap-2">{action}<button onClick={() => base44.auth.logout("/auth/signin-basic")} className="p-2 rounded-xl border border-slate-200" title="Sign out"><LogOut size={18}/></button></div>
      </div>
      <nav className="px-5 md:px-8 flex gap-5 overflow-x-auto">
        {links.map(([href,label]) => <Link key={href} href={href} className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 ${pathname === href ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}>{label}</Link>)}
      </nav>
    </header>
    {children}
  </div>;
}

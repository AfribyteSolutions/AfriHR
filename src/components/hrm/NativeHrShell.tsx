"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { base44 } from "@/lib/base44";
import { useAuthUserContext } from "@/context/UserAuthContext";

type HrLink = [href: string, label: string, permission: string, selfService?: boolean];

const links: HrLink[] = [
  ["/hrm/recruitment-flow", "Recruitment", "recruitment.view"],
  ["/hrm/employee", "Employees", "employees.view"],
  ["/hrm/organization", "Organization", "organization.view"],
  ["/hrm/onboarding", "Onboarding", "employees.view"],
  ["/hrm/leaves", "Leave", "leave.view", true],
  ["/hrm/attendance", "Time", "time.view", true],
  ["/hrm/workforce-operations", "Workforce Ops", "workforce.view", true],
  ["/payroll/payroll", "Payroll", "payroll.view", true],
  ["/payroll/statutory", "Statutory", "payroll.view"],
  ["/hrm/performance", "Performance", "performance.view", true],
  ["/hrm/training", "Learning", "learning.view", true],
  ["/hrm/employee-relations", "Employee Relations", "relations.view", true],
  ["/hrm/documents", "Documents", "documents.view", true],
  ["/hrm/reports", "Reports", "reports.view"],
  ["/hrm/offboarding", "Offboarding", "offboarding.view", true],
  ["/hrm/access-control", "Access", "access.manage"]
];

const legacyRolePermissions: Record<string, string[]> = {
  hr_manager: links.map(([, , permission]) => permission).filter((permission) => permission !== "access.manage"),
  recruiter: ["recruitment.view", "employees.view"],
  payroll_manager: ["employees.view", "payroll.view", "reports.view", "workforce.view"],
  finance_manager: ["employees.view", "payroll.view", "reports.view", "workforce.view"],
  manager: ["employees.view", "leave.view", "time.view", "performance.view", "learning.view"]
};

export default function NativeHrShell({ title, subtitle, children, action }: {
  title: string; subtitle: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthUserContext();
  const rolePermissions = new Set(legacyRolePermissions[user?.appRole || ""] || []);
  const visibleLinks = links.filter(([, , permission, selfService]) =>
    user?.appRole === "platform_admin" ||
    user?.appRole === "tenant_admin" ||
    user?.permissions.includes(permission) ||
    rolePermissions.has(permission) ||
    Boolean(selfService)
  );
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-black">{title}</h1><p className="text-xs text-slate-500">{subtitle}</p></div>
        <div className="flex items-center gap-2">{action}<button onClick={() => base44.auth.logout("/auth/signin-basic")} className="p-2 rounded-xl border border-slate-200" title="Sign out"><LogOut size={18}/></button></div>
      </div>
      <nav className="px-5 md:px-8 flex gap-5 overflow-x-auto">
        {visibleLinks.map(([href,label]) => <Link key={href} href={href} className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 ${pathname === href ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}>{label}</Link>)}
      </nav>
    </header>
    {children}
  </div>;
}

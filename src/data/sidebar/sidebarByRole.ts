export type UserRole = "super-admin" | "admin" | "manager" | "employee";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: string;
}

export const sidebarByRole: Record<UserRole, SidebarItem[]> = {
  "super-admin": [
    { label: "Dashboard", href: "/dashboard", icon: "icon-house" },
    { label: "Companies", href: "/companies", icon: "icon-briefcase" },
  ],

  admin: [
    { label: "Dashboard", href: "/dashboard/hrm-dashboard", icon: "icon-house" },
    { label: "Employees", href: "/employees", icon: "icon-users" },
    { label: "Payroll", href: "/payroll", icon: "icon-wallet" },
  ],

  manager: [
    { label: "Dashboard", href: "/dashboard", icon: "icon-house" },
    { label: "Team", href: "/team", icon: "icon-users" },
  ],

  employee: [
    { label: "Dashboard", href: "/dashboard", icon: "icon-house" },
    { label: "Profile", href: "/profile", icon: "icon-user" },
  ],
};

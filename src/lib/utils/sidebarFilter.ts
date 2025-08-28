// utils/sidebarFilter.ts
import { SidebarCategory } from "@/interface";

export type UserRole = "super-admin" | "admin" | "manager" | "employee";

// Define which menu items each role can access
const rolePermissions: Record<UserRole, number[]> = {
  "super-admin": [
    // Super admin has access to everything
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31
  ],
  "admin": [
    // Admin has access to most features except super-admin specific ones
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
  ],
  "manager": [
    // Manager has access to department management and some HR features
    1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 14, 15, 16, 19, 20, 21, 24, 25, 26, 27, 28, 29, 30
  ],
  "employee": [
    // Employee has access to basic features and self-service
    1, 4, 5, 6, 9, 10, 11, 16, 19, 20, 21, 24, 25, 26, 27, 28, 29, 30
  ]
};

// Define which dashboard links each role should see
const roleDashboards: Record<UserRole, string[]> = {
  "super-admin": [
    "Super-Admin Dashboard",
    "HRM Dashboard",
    "Employee Dashboard",
    "CRM Analytics"
  ],
  "admin": [
    "HRM Dashboard",
    "Employee Dashboard",
    "CRM Analytics"
  ],
  "manager": [
    "HRM Dashboard",
    "Employee Dashboard",
    "CRM Analytics"
  ],
  "employee": [
    "Employee Dashboard"
  ]
};

// Define which HRM features each role can access
const roleHRMFeatures: Record<UserRole, string[]> = {
  "super-admin": [
    "Employee", "Employee Profile", "Designations", "Admin Attendance", 
    "Employee Attendance", "Biometric Attendance", "Office Loan", "Personal Loan",
    "Employee leaves", "Admin leaves", "Holidays", "Time Sheet", "Schedule",
    "Overtime", "Warning"
  ],
  "admin": [
    "Employee", "Employee Profile", "Designations", "Admin Attendance", 
    "Employee Attendance", "Biometric Attendance", "Office Loan", "Personal Loan",
    "Employee leaves", "Admin leaves", "Holidays", "Time Sheet", "Schedule",
    "Overtime", "Warning"
  ],
  "manager": [
    "Employee", "Employee Profile", "Employee Attendance", "Employee leaves",
    "Holidays", "Time Sheet", "Schedule", "Overtime"
  ],
  "employee": [
    "Employee Profile", "Employee Attendance", "Employee leaves", "Holidays", "Time Sheet"
  ]
};

// Define which company features each role can access
const roleCompanyFeatures: Record<UserRole, string[]> = {
  "super-admin": ["Company List", "Company Details"],
  "admin": ["Company Details"],
  "manager": ["Company Details"],
  "employee": []
};

// Define which payroll features each role can access
const rolePayrollFeatures: Record<UserRole, string[]> = {
  "super-admin": ["Pay List", "Payslip"],
  "admin": ["Pay List", "Payslip"],
  "manager": ["Pay List", "Payslip"],
  "employee": ["Payslip"]
};

/**
 * Filters sidebar data based on user role
 * @param sidebarData - Original sidebar data
 * @param userRole - Current user's role
 * @returns Filtered sidebar data
 */
export const filterSidebarByRole = (sidebarData: SidebarCategory[], userRole: UserRole): SidebarCategory[] => {
  const allowedItemIds = rolePermissions[userRole];
  
  return sidebarData.map(category => ({
    ...category,
    items: category.items
      .filter(item => allowedItemIds.includes(item.id))
      .map(item => {
        // Special filtering for specific menu items
        if (item.label === "Dashboards" && item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(subItem => 
              roleDashboards[userRole].includes(subItem.label)
            )
          };
        }
        
        if (item.label === "HRM" && item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(subItem => 
              roleHRMFeatures[userRole].includes(subItem.label)
            )
          };
        }
        
        if (item.label === "Company" && item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(subItem => 
              roleCompanyFeatures[userRole].includes(subItem.label)
            )
          };
        }
        
        if (item.label === "Payroll" && item.subItems) {
          return {
            ...item,
            subItems: item.subItems.filter(subItem => 
              rolePayrollFeatures[userRole].includes(subItem.label)
            )
          };
        }
        
        // For Authentication, filter based on role (employees might not need all auth options)
        if (item.label === "Authentication" && item.subItems && userRole === "employee") {
          return {
            ...item,
            subItems: item.subItems.filter(subItem => 
              !["Sign Up", "Reset Password"].includes(subItem.label)
            )
          };
        }
        
        return item;
      })
  })).filter(category => category.items.length > 0); // Remove empty categories
};

/**
 * Check if user has access to a specific menu item
 * @param itemId - Menu item ID
 * @param userRole - User's role
 * @returns boolean
 */
export const hasAccessToMenuItem = (itemId: number, userRole: UserRole): boolean => {
  return rolePermissions[userRole].includes(itemId);
};

/**
 * Get default dashboard path for user role
 * @param userRole - User's role
 * @param subdomain - Company subdomain
 * @returns Dashboard path
 */
export const getDefaultDashboardPath = (userRole: UserRole, subdomain: string): string => {
  const baseUrl = process.env.NODE_ENV === "development" 
    ? `http://${subdomain}.localhost:3000` 
    : `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`;
    
  switch (userRole) {
    case "super-admin":
      return `${baseUrl}/super-admin/dashboard`;
    case "admin":
    case "manager":
      return `${baseUrl}/dashboard/hrm-dashboard`;
    case "employee":
      return `${baseUrl}/dashboard/employee-dashboard`;
    default:
      return `${baseUrl}/dashboard/employee-dashboard`;
  }
};
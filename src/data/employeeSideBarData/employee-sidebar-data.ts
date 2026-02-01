// data/employee-sidebar-data.ts

export interface EmployeeSidebarItem {
    id: number;
    label: string;
    link: string;
    icon: string;
  }
  
  export const defaultEmployeeSidebar: EmployeeSidebarItem[] = [
    {
      id: 1,
      label: "Dashboard",
      link: "/dashboard/employee-dashboard",
      icon: "icon-house",
    },
    {
      id: 2,
      label: "Attendance",
      link: "/hrm/employee-attendance",
      icon: "icon-clock",
    },
    {
      id: 3,
      label: "Leaves",
      link: "/hrm/leaves-employee",
      icon: "icon-calendar",
    },
    {
      id: 4,
      label: "Payslip",
      link: "/payroll/payroll-payslip",
      icon: "icon-wallet",
    },
    {
      id: 5,
      label: "Training",
      link: "/hrm/training",
      icon: "icon-book",
    },
    {
      id: 6,
      label: "Announcements",
      link: "/announcement",
      icon: "icon-announcement",
    },

    
  ];
  
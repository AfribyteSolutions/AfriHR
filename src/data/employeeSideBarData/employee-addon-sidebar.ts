// data/employee-addon-sidebar.ts

export interface EmployeeSidebarAddon {
    id: number;
    label: string;
    link: string;
    icon: string;
    permissionKey: string; // <-- This fixes the underline issue
  }
  
export const employeeSidebarAddons = [
    {
      id: 101,
      label: "Employee Directory",
      link: "/hrm/employee",
      icon: "icon-users",
      permissionKey: "view_employees"
    },
    {
      id: 102,
      label: "Set Meetings",
      link: "/meeting",
      icon: "icon-calendar",
      permissionKey: "set_meetings"
    },
    {
      id: 103,
      label: "Performance Reports",
      link: "/reports/performance",
      icon: "icon-apexcharts",
      permissionKey: "view_reports"
    }
  ];
  
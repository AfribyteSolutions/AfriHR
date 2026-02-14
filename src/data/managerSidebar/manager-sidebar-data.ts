// src/data/managerSidebar/manager-sidebar-data.ts
import sidebarData from "@/data/sidebar-data";

export interface SidebarMenuItem {
  id: number;
  label: string;
  link?: string;
  icon?: string;
  subItems?: SidebarMenuItem[];
}

const allowedManagerItems = [
  "Dashboards",
  "HRM",
  "Chat",
  "Payroll",
  "Expense",
  "Company",
  "Projects",
  "Resignation",
  "Promotion",
  "Termination",
  "Document",
  "Announcement",
  "Invoice",
  "Company Organogram",
  "Feedback"
];

// Accept any item shape that might come from sidebarData
function addIdsRecursively(
  items: { label: string; link?: string; icon?: string; subItems?: any[] }[],
  startId = 1
): SidebarMenuItem[] {
  let currentId = startId;
  return items.map((item) => {
    const newItem: SidebarMenuItem = {
      id: currentId++,
      label: item.label,
      link: item.link,
      icon: item.icon,
      subItems: item.subItems ? addIdsRecursively(item.subItems, currentId) : undefined
    };
    return newItem;
  });
}

export default function getManagerSidebarData(
  departmentId?: string,
  branchId?: string
): SidebarMenuItem[] {
  const filtered = sidebarData
    .map((category: any) => ({
      ...category,
      items: category.items?.filter((item: any) =>
        allowedManagerItems.includes(item.label)
      )
    }))
    .filter((category: any) => category.items && category.items.length > 0)
    .flatMap((category: any) => category.items || []);

  // Add IDs to all items and normalize shape
  return addIdsRecursively(filtered);
}

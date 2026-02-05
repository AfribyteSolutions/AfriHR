"use client";
import Link from "next/link";
import { sidebarByRole, UserRole } from "@/data/sidebar/sidebarByRole";
import { useResponsiveSidebar } from "@/hooks/useResponsiveSidebar";

interface Props {
  role: UserRole;
}

const AppSidebar = ({ role }: Props) => {
  const { isCollapse, isMobile, closeOnMobile } = useResponsiveSidebar();
  const items = sidebarByRole[role] ?? [];

  return (
    <>
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-white
          transition-transform duration-300
          ${isCollapse && isMobile ? "-translate-x-full" : "translate-x-0"}
        `}
      >
        <div className="h-16 flex items-center px-4 font-semibold">
          Your App
        </div>

        <nav className="px-2 space-y-1">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeOnMobile}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              {item.icon && <i className={item.icon}></i>}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile overlay only */}
      {isMobile && !isCollapse && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={closeOnMobile}
        />
      )}
    </>
  );
};

export default AppSidebar;

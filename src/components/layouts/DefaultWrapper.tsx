"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import Preloader from "@/common/Preloader/Preloader";
import BackToTop from "@/common/BackToTop/BackToTop";
import DashboardHeader from "./header/DashboardHeader";
import DashboardFooter from "./footer/FooterOne";
import useGlobalContext from "@/hooks/use-context";

// Sidebars
import DashBoardSidebar from "./sidebar/DashBoardSidebar";
import HRMSidebar from "./sidebar/HRMSidebar";
import EmployeeSidebar from "./sidebar/EmployeeSidebar";
import ManagerSidebar from "./sidebar/ManagerSidebar";
import SuperAdminSidebar from "./sidebar/SuperAdminSidebar";

import { useUserRole } from "@/hooks/useUserRole";

interface WrapperProps {
  children: React.ReactNode;
}

const Wrapper: React.FC<WrapperProps> = ({ children }) => {
  const { theme, isCollapse } = useGlobalContext();
  const [uiReady, setUiReady] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const [mounted, setMounted] = useState(false);
  const [forceUnauthenticated, setForceUnauthenticated] = useState(false);
  const { userRole, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    const timer = setTimeout(() => setUiReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const isLoading = !uiReady || authLoading || (user && roleLoading) || !mounted;

  const renderSidebar = () => {
    if (isLoading) return null;
    const effectiveUser = forceUnauthenticated ? null : user;

    if (!effectiveUser && isLocalhost && process.env.NODE_ENV === "development") {
      return <DashBoardSidebar />;
    }
    if (!effectiveUser) return null;

    switch (userRole) {
      case "super-admin": return <SuperAdminSidebar />;
      case "admin": return <HRMSidebar />;
      case "manager": return <ManagerSidebar />;
      case "employee": return <EmployeeSidebar />;
      default: return <DashBoardSidebar />;
    }
  };

  return (
    <div className={`page__full-wrapper ${theme === "dark" ? "dark" : "light"}`}>
      {isLoading ? (
        <Preloader />
      ) : (
        <>
          {renderSidebar()}
          {/* FIX: Added responsive padding. 
              On desktop (xl:), it stays at 280px (open) or 80px (collapsed).
              This prevents the dashboard content from shifting "under" the sidebar.
          */}
          <div className={`page__body-wrapper transition-all duration-300 ${
            isCollapse ? "xl:pl-[80px]" : "xl:pl-[280px]"
          } pl-0`}>
            <BackToTop />
            <DashboardHeader />
            <div className="min-h-screen">
                {children}
            </div>
            <DashboardFooter />
          </div>
        </>
      )}
    </div>
  );
};

export default Wrapper;
"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  fullHeight?: boolean;
}

const Wrapper: React.FC<WrapperProps> = ({ children, fullHeight = false }) => {
  const { theme, isCollapse } = useGlobalContext();
  const [uiReady, setUiReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { userRole, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    const timer = setTimeout(() => setUiReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoading = !uiReady || authLoading || (isAuthenticated && roleLoading) || !mounted;

  const renderSidebar = () => {
    if (isLoading) return null;
    if (!isAuthenticated) return null;

    switch (userRole) {
      case "super-admin": return <SuperAdminSidebar />;
      case "admin": return <HRMSidebar />;
      case "manager": return <ManagerSidebar />;
      case "employee": return <EmployeeSidebar />;
      default: return <DashBoardSidebar />;
    }
  };

  return (
    <div className={`page__full_wrapper ${theme === "dark" ? "dark" : "light"}`}>
      {isLoading ? (
        <Preloader />
      ) : (
        <>
          {renderSidebar()}
          <div className={`page__body-wrapper transition-all duration-300 ${
            isCollapse ? "xl:pl-[80px]" : "xl:pl-[280px]"
          } pl-0${fullHeight ? " flex flex-col h-screen overflow-hidden" : ""}`}>
            <BackToTop />
            <DashboardHeader />
            <div className={fullHeight ? "flex-1 overflow-hidden" : "min-h-screen"}>
                {children}
            </div>
            {!fullHeight && <DashboardFooter />}
          </div>
        </>
      )}
    </div>
  );
};

export default Wrapper;

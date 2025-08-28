"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
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
import SuperAdminSidebar from "./sidebar/SuperAdminSidebar";

// Role hook
import { useUserRole } from "@/hooks/useUserRole";

interface WrapperProps {
  children: React.ReactNode;
}

const Wrapper: React.FC<WrapperProps> = ({ children }) => {
  const { theme } = useGlobalContext();
  const pathName = usePathname();
  const [uiReady, setUiReady] = useState(false);
  const [user, authLoading] = useAuthState(auth);
  const [mounted, setMounted] = useState(false);
  const [forceUnauthenticated, setForceUnauthenticated] = useState(false);
  const {
    userRole,
    isLoading: roleLoading,
    isAuthenticated,
  } = useUserRole();

  useEffect(() => {
    const timer = setTimeout(() => setUiReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  // Combined loading state
  const isLoading = !uiReady || authLoading || (user && roleLoading) || !mounted;

  // Development helper function to sign out
  const handleDevSignOut = async () => {
    try {
      await signOut(auth);
      setForceUnauthenticated(true);
      console.log("🚪 Signed out for development");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderSidebar = () => {
    if (isLoading) return null;

    const effectiveUser = forceUnauthenticated ? null : user;

    // Localhost dev without authentication
    if (!effectiveUser && isLocalhost && process.env.NODE_ENV === "development") {
      return <DashBoardSidebar />;
    }

    if (!effectiveUser) return null;

    switch (userRole) {
      case "super-admin":
        return <SuperAdminSidebar />;
      case "admin":
        return <HRMSidebar />;
      case "manager": // managers now share employee sidebar
      case "employee":
        return <EmployeeSidebar />;
      default:
        return <DashBoardSidebar />;
    }
  };

  return (
    <div className={`page__full-wrapper ${theme === "dark" ? "dark" : "light"}`}>
      {/* Dev sign out for localhost */}
      {isLocalhost && process.env.NODE_ENV === "development" && user && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            zIndex: 9999,
            background: "#ff4444",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          }}
          onClick={handleDevSignOut}
        >
          🚪 DEV: Sign Out
        </div>
      )}

      {isLoading ? (
        <Preloader />
      ) : (
        <>
          {renderSidebar()}
          <div className="page__body-wrapper">
            <BackToTop />
            <DashboardHeader />
            {children}
            <DashboardFooter />
          </div>
        </>
      )}
    </div>
  );
};

export default Wrapper;

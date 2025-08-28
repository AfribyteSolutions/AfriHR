"use client";

import React, { createContext, useState, useEffect } from "react";
import { AppContextType } from "@/interface/common.interface";

export const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [scrollDirection, setScrollDirection] = useState("up");
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(false);
  const [isCollapse, setIsCollapse] = useState<boolean>(false);

  // ✅ Add missing states for user & company
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDarkMode ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const sidebarHandle = () => {
    setIsCollapse(!isCollapse);
  };

  // ✅ Now includes userId, userRole, companyId
  const contextValue: AppContextType = {
    scrollDirection,
    setScrollDirection,
    sideMenuOpen,
    setSideMenuOpen,
    sidebarHandle,
    isCollapse,
    setIsCollapse,
    theme,
    setTheme,
    toggleTheme,
    userId,
    setUserId,
    userRole,
    setUserRole,
    companyId,
    setCompanyId,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export default AppProvider;

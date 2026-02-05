"use client";
import { useEffect, useState } from "react";
import useGlobalContext from "@/hooks/use-context";

const DESKTOP_BREAKPOINT = 1200;

export const useResponsiveSidebar = () => {
  const { isCollapse, setIsCollapse } = useGlobalContext();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < DESKTOP_BREAKPOINT;
      setIsMobile(mobile);

      // 🔒 Desktop sidebar is always open
      if (!mobile) setIsCollapse(false);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setIsCollapse]);

  const closeOnMobile = () => {
    if (isMobile) setIsCollapse(true);
  };

  return { isCollapse, isMobile, closeOnMobile };
};

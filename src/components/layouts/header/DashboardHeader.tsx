"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import handImg from "../../../../public/assets/images/shape/hand.png";
import HeaderAction from "./components/HeaderAction";
import useGlobalContext from "@/hooks/use-context";
import sidebarData from "@/data/sidebar-data";
import Link from "next/link";
import { SidebarCategory } from "@/interface";
import { useAuthUserContext } from "@/context/UserAuthContext";

const relatedSearchTerms = ["New Employee", "Add Employee", "View Reports", "Manage Meetings", "Payroll"];

const DashboardHeader = () => {
  const { isCollapse, setIsCollapse } = useGlobalContext();
  const { user: authUser, loading: loadingAuthUser } = useAuthUserContext(); 
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResultData, setSearchResultData] = useState<SidebarCategory[] | null>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Sync mobile state with sidebar breakpoint
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1200);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);
    setShowResults(value.trim().length > 0);
    // ... (Keep your existing search logic filtering sidebarData)
  };

  const handleSidebarToggle = () => {
    setIsCollapse(!isCollapse);
  };

  return (
    <>
      <div className="app__header__area">
        <div className="app__header-inner">
          <div className="app__header-left">
            <div className="flex">
              <button
                id="sidebar__active"
                onClick={handleSidebarToggle}
                className="app__header-toggle"
                aria-label="Toggle sidebar"
              >
                <div className="bar-icon-2">
                  <span></span><span></span><span></span>
                </div>
              </button>
            </div>
            <h2 className="header__title">
              Hello {loadingAuthUser ? "Loading..." : authUser?.fullName || "User"}
              <span><Image className="inline-block" src={handImg} priority alt="hand" /></span>
            </h2>
          </div>
          <div className="app__header-right">
            <div className="app__herader-input relative">
              <input 
                type="search" 
                placeholder="Search Here . . ." 
                value={searchQuery} 
                onChange={handleSearchChange} 
              />
              <button><i className="icon-magnifying-glass"></i></button>
            </div>
            <HeaderAction />
          </div>
        </div>
      </div>
      
      {/* FIX: Overlay only renders on Mobile. 
          On desktop, clicks will now pass through to the dashboard correctly.
      */}
      {isMobile && !isCollapse && (
        <div 
          className="body__overlay overlay-open"
          onClick={() => setIsCollapse(true)}
          style={{ zIndex: 99 }}
        ></div>
      )}
    </>
  );
};

export default DashboardHeader;
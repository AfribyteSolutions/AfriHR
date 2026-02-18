"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import handImg from "../../../../public/assets/images/shape/hand.png";
import HeaderAction from "./components/HeaderAction";
import useGlobalContext from "@/hooks/use-context";
import sidebarData from "@/data/sidebar-data";
import Link from "next/link";
import { SidebarCategory, IEmployee } from "@/interface";
import { useAuthUserContext } from "@/context/UserAuthContext";

// Define the ExtendedUser type to match the logic in your Profile component
type ExtendedUser = Partial<IEmployee> & {
  displayName?: string | null;
  fullName?: string | null;
  photoURL?: string | null;
  email?: string | null;
  uid?: string | null;
};

const DashboardHeader = () => {
  const { isCollapse, setIsCollapse } = useGlobalContext();
  const { user, loading: loadingAuthUser } = useAuthUserContext(); 
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResultData, setSearchResultData] = useState<SidebarCategory[] | null>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Cast the user to ExtendedUser to access fullName and displayName safely
  const authUser = user as ExtendedUser;

  // Sync mobile state with sidebar breakpoint
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1200);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Robust Name Fallback Logic
   */
  const displayFirstName = (authUser?.fullName || authUser?.name || authUser?.displayName || "User")
    .split(" ")[0];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);
    setShowResults(value.trim().length > 0);
    
    if (value.trim().length > 0) {
      const filtered = sidebarData.map(category => ({
        ...category,
        // FIX: Added optional chaining (?.) and nullish coalescing (|| "") 
        // to safely handle cases where item.link might be undefined.
        items: category.items.filter(item => 
          item.label.toLowerCase().includes(value) || 
          (item.link?.toLowerCase() || "").includes(value)
        )
      })).filter(category => category.items.length > 0);
      setSearchResultData(filtered);
    } else {
      setSearchResultData([]);
    }
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
              Hello {loadingAuthUser ? "Loading..." : displayFirstName}
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
"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import useGlobalContext from "@/hooks/use-context";
import { Company } from "@/types/company";
import Cookies from "js-cookie";
import sidebarData from "@/data/sidebar-data";

interface SidebarMenuItem {
  id: number;
  label: string;
  link?: string;
  icon?: string;
  subItems?: SidebarMenuItem[];
}

const HRMSidebar = () => {
  const { isCollapse, setIsCollapse } = useGlobalContext();
  const [company, setCompany] = useState<Company | null>(null);
  const [hrmMenuItems, setHrmMenuItems] = useState<SidebarMenuItem[]>([]);
  const [linkId, setlinkId] = useState<number | null>(null);
  const [linkIdTwo, setlinkIdTwo] = useState<number | null>(null);
  const [linkIdThree, setlinkIdThree] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathName = usePathname();

  // Track mobile viewport - only consider screens below 1200px as mobile
  useEffect(() => {
    const checkMobile = () => {
      const windowWidth = window.innerWidth;
      const isMobileSize = windowWidth < 1200;
      setIsMobile(isMobileSize);
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchCompany = async () => {
      const subdomain = Cookies.get("subdomain");
      if (subdomain) {
        try {
          const response = await fetch(`/api/company?subdomain=${subdomain}`);
          const companyData = await response.json();
          setCompany(companyData);
        } catch (error) {
          console.error("Error fetching company:", error);
        }
      }
    };

    fetchCompany();
  }, []);

  useEffect(() => {
    // Extract HRM-related menu items from sidebarData
    const getHrmMenuItems = (): SidebarMenuItem[] => {
      const hrmItems: SidebarMenuItem[] = [];

      // Find and include specific items from sidebarData
      const includeItems = [
        "HRM",
        "Add Employee",
        "Recruitment Flow",
        "Chat",
        "Payroll",
        "Expense",
        "Company",
        "Training",
        "Projects",
        "Activities",
        "Attendance",
        "Meeting",
        "Transfer",
        "Termination",
        "Invoice",
        "Promotion",
        "Resignation",
        "Award",
        "Feedback",
        "Reports",
        "Document",
        "Announcement",
        "Company Organogram",
        "Company Settings"
      ];

      sidebarData.forEach(category => {
        category.items?.forEach(item => {
          if (includeItems.includes(item.label)) {
            // Change HRM label to Employee Management
            const itemLabel = item.label === "HRM" ? "Employee Management" : item.label;

            hrmItems.push({
              id: item.id,
              label: itemLabel,
              icon: item.icon,
              link: item.link,
              subItems: item.subItems?.map((subItem, subIndex) => ({
                id: subIndex,
                label: subItem.label,
                link: subItem.link,
                subItems: subItem.subItems?.map((subSubItem, subSubIndex) => ({
                  id: subSubIndex,
                  label: subSubItem.label,
                  link: subSubItem.link
                }))
              }))
            });
          }
        });
      });

      return hrmItems;
    };

    setHrmMenuItems(getHrmMenuItems());
  }, []);

  // Auto-expand and highlight active menu items based on current pathname
  useEffect(() => {
    if (hrmMenuItems.length === 0) return;

    let foundFirstLayerId: number | null = null;
    let foundSecondLayerId: number | null = null;
    let foundThirdLayerId: number | null = null;

    hrmMenuItems.forEach((item) => {
      // Check first level
      if (item.link === pathName) {
        foundFirstLayerId = item.id;
        foundSecondLayerId = null;
        foundThirdLayerId = null;
      } else if (item.subItems) {
        // Check second level
        item.subItems.forEach((subItem, subIndex) => {
          if (subItem.link === pathName) {
            foundFirstLayerId = item.id;
            foundSecondLayerId = subIndex;
            foundThirdLayerId = null;
          } else if (subItem.subItems) {
            // Check third level
            subItem.subItems.forEach((subSubItem, subSubIndex) => {
              if (subSubItem.link === pathName) {
                foundFirstLayerId = item.id;
                foundSecondLayerId = subIndex;
                foundThirdLayerId = subSubIndex;
              }
            });
          }
        });
      }
    });

    setlinkId(foundFirstLayerId);
    setlinkIdTwo(foundSecondLayerId);
    setlinkIdThree(foundThirdLayerId);
  }, [pathName, hrmMenuItems]);

  // Close sidebar ONLY on mobile when navigating
  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsCollapse(true);
    }
  };

  const handleClick = (id: number) => {
    if (linkId === id) {
      setlinkId(null);
    } else {
      setlinkId(id);
      setlinkIdTwo(null);
      setlinkIdThree(null);
    }
  };

  const handleClickTwo = (id: number) => {
    if (linkIdTwo === id) {
      setlinkIdTwo(null);
    } else {
      setlinkIdTwo(id);
      setlinkIdThree(null);
    }
  };

  const handleClickThree = (id: number) => {
    if (linkIdThree === id) {
      setlinkIdThree(null);
    } else {
      setlinkIdThree(id);
    }
  };

  return (
    <>
      <div className={`app-sidebar ${isCollapse ? "collapsed close_sidebar" : ""}`}>
        {/* Sidebar Header with company logo and name */}
        <div className="main-sidebar-header">
          <Link href="/" className="header-logo flex items-center gap-3 w-full min-w-0" onClick={closeSidebarOnMobile}>
            {company?.branding?.logoUrl && (
              <div className={`relative ${isCollapse ? "h-10 w-10" : "h-12 w-12"} flex-shrink-0`}>
                <Image
                  src={company.branding.logoUrl}
                  alt={`${company.name} Logo`}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 40px, 48px"
                />
              </div>
            )}
            {!isCollapse && company?.name && (
              <span className="text-white text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                {company.name}
              </span>
            )}
          </Link>
          {/* Close button for mobile - only visible on screens < 1200px */}
          <button
            className="sidebar-close-btn"
            style={{ display: isMobile ? 'block' : 'none' }}
            onClick={() => setIsCollapse(true)}
            aria-label="Close sidebar"
          >
            <i className="icon-xmark"></i>
          </button>
        </div>

        <div className="common-scrollbar max-h-screen overflow-y-auto">
          <nav className="main-menu-container nav nav-pills flex-column sub-open mt-[80px]">
            <ul className="main-menu" style={{ display: "block" }}>
              <li className="sidebar__menu-category">
                <span className="category-name">Welcome Manager!</span>
              </li>
              
              {/* HRM Dashboard - Direct link right after Welcome Manager */}
              <li className="slide">
                <Link
                  href="/dashboard/hrm-dashboard"
                  className="sidebar__menu-item"
                  onClick={closeSidebarOnMobile}
                >
                  <div className="side-menu__icon">
                    <i className="icon-house"></i>
                  </div>
                  <span className="sidebar__menu-label">Dashboard</span>
                </Link>
              </li>
              
              {/* Dynamically render HRM menu items with proper dropdown structure */}
              {hrmMenuItems.map((item) => (
                <li
                  key={item.id}
                  className={
                    item.subItems?.length
                      ? `slide has-sub ${linkId === item.id ? "open" : ""}`
                      : "slide"
                  }
                >
                  <Link
                    onClick={(e) => {
                      if (!item.link || item.link === "#") {
                        e.preventDefault();
                        handleClick(item.id);
                      } else {
                        closeSidebarOnMobile();
                      }
                    }}
                    href={item.link || "#"}
                    className={`sidebar__menu-item ${
                      linkId === item.id ? "active" : ""
                    }`}
                  >
                    {item.icon && (
                      <div className="side-menu__icon">
                        <i className={item.icon}></i>
                      </div>
                    )}
                    <span className="sidebar__menu-label">{item.label}</span>
                    {item.subItems && (
                      <i className="fa-regular fa-angle-down side-menu__angle"></i>
                    )}
                  </Link>
                  {item.subItems && (
                    <ul
                      className={
                        linkId === item.id
                          ? `sidebar-menu child1 active submenu-visible`
                          : `sidebar-menu child1`
                      }
                      style={{
                        display: linkId === item.id ? "block" : "none",
                      }}
                    >
                      {item.subItems.map((subOne, index) => (
                        <li
                          key={index}
                          className={`slide ${
                            subOne.subItems ? "has-sub" : ""
                          } ${linkIdTwo === index ? "open" : ""}`}
                        >
                          <Link
                            onClick={(e) => {
                              if (!subOne.link || subOne.link === "#" || subOne.link === "/") {
                                e.preventDefault();
                                handleClickTwo(index);
                              } else {
                                closeSidebarOnMobile();
                              }
                            }}
                            href={subOne.link || "/"}
                            className={`sidebar__menu-item ${
                              linkIdTwo === index ? "active" : ""
                            }`}
                          >
                            {subOne.label}
                            {subOne.subItems && (
                              <i className="fa-regular fa-angle-down side-menu__angle"></i>
                            )}
                          </Link>
                          {subOne.subItems && (
                            <ul
                              className="sidebar-menu child2"
                              style={{
                                display:
                                  linkIdTwo === index ? "block" : "none",
                              }}
                            >
                              {subOne.subItems.map((subTwo, subIndex) => (
                                <li
                                  key={subIndex}
                                  className={`slide ${
                                    subTwo.subItems ? "has-sub" : ""
                                  } ${linkIdThree === subIndex ? "open" : ""}`}
                                >
                                  <Link
                                    onClick={(e) => {
                                      if (!subTwo.link || subTwo.link === "#") {
                                        e.preventDefault();
                                        handleClickThree(subIndex);
                                      } else {
                                        closeSidebarOnMobile();
                                      }
                                    }}
                                    href={subTwo.link || "#"}
                                    className={`sidebar__menu-item ${
                                      linkIdThree === subIndex ? "active" : ""
                                    }`}
                                  >
                                    {subTwo.label}
                                    {subTwo.subItems && (
                                      <i className="fa-regular fa-angle-down side-menu__angle"></i>
                                    )}
                                  </Link>
                                  {subTwo.subItems && (
                                    <ul
                                      className="sidebar-menu child3"
                                      style={{
                                        display:
                                          linkIdThree === subIndex
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      {subTwo.subItems.map(
                                        (subThree, subThreeIndex) => (
                                          <li
                                            key={subThreeIndex}
                                            className="slide"
                                          >
                                            <Link
                                              onClick={closeSidebarOnMobile}
                                              href={subThree.link || "#"}
                                              className="sidebar__menu-item"
                                            >
                                              {subThree.label}
                                            </Link>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          {/* Tutorial Center - Sticks to the very bottom */}
        <div className={`mt-auto p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 transition-all duration-300 ${isCollapse ? "flex justify-center" : ""}`}>
          <div className={`flex flex-col gap-2 ${isCollapse ? "items-center" : ""}`}>
            {!isCollapse && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight uppercase tracking-widest font-bold ml-1">
                Resources
              </p>
            )}
            
            <a
              href="https://drive.google.com/drive/folders/1kCpOEApxylYB4892Pn1GP7lS4C8bpAHp?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 
                ${isCollapse 
                  ? "w-11 h-11 justify-center bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30" 
                  : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-500 shadow-sm hover:shadow-md"
                }`}
              title="Watch Tutorial Videos"
            >
              <div className={`flex-shrink-0 transition-transform group-hover:scale-110 
                ${isCollapse ? "text-white" : "text-blue-600 dark:text-blue-400"}`}>
                <i className="fa-light fa-video text-lg"></i>
              </div>
              
              {!isCollapse && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-white whitespace-nowrap">
                    Tutorial Center
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-blue-300/70 truncate">
                    Watch Video Guides
                  </span>
                </div>
              )}
            </a>
            
            {!isCollapse && (
              <div className="mt-1 px-1 flex items-center justify-between">
                <span className="text-[9px] text-gray-400 font-medium">System v2.4.0</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[9px] text-gray-400 font-medium">Live</span>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Overlay for mobile - only render on mobile when sidebar is open */}
      {isMobile && !isCollapse && (
        <div
          className="app__offcanvas-overlay overlay-open"
          onClick={() => setIsCollapse(true)}
        ></div>
      )}
    </>
  );
};

export default HRMSidebar;
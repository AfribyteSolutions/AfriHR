"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from "next/image";
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
        "Training",
        "Projects",
        "Activities",
        "Meeting",
        "Transfer",
        "Termination",
        "Invoice",
        "Promotion",
        "Resignation",
        "Award",
        "Document",
        "Announcement",
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
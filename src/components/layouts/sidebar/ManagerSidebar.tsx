"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import useGlobalContext from "@/hooks/use-context";
import Cookies from "js-cookie";
import { Company } from "@/types/company";
import getManagerSidebarData, { SidebarMenuItem } from "@/data/managerSidebar/manager-sidebar-data";

const ManagerSidebar = () => {
  const { isCollapse, setIsCollapse } = useGlobalContext();
  const [company, setCompany] = useState<Company | null>(null);
  const [managerMenuItems, setManagerMenuItems] = useState<SidebarMenuItem[]>([]);

  const [linkId, setlinkId] = useState<number | null>(null);
  const [linkIdTwo, setlinkIdTwo] = useState<number | null>(null);
  const [linkIdThree, setlinkIdThree] = useState<number | null>(null);

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
    const fetchUserScope = async () => {
      try {
        const res = await fetch(`/api/current-manager-scope`);
        const { departmentId, branchId } = await res.json();
        const data = getManagerSidebarData(departmentId, branchId);
        setManagerMenuItems(data);
      } catch (error) {
        console.error("Error fetching manager scope:", error);
      }
    };
    fetchUserScope();
  }, []);

  const handleCollapse = (shouldCollapse: boolean) => {
    if (window.matchMedia("(max-width: 1199px)").matches) {
      setIsCollapse(shouldCollapse);
    }
  };

  const handleClick = (id: number) => {
    setlinkId(linkId === id ? null : id);
    setlinkIdTwo(null);
    setlinkIdThree(null);
    handleCollapse(true);
  };

  const handleClickTwo = (id: number) => {
    setlinkIdTwo(linkIdTwo === id ? null : id);
    setlinkIdThree(null);
    handleCollapse(true);
  };

  const handleClickThree = (id: number) => {
    setlinkIdThree(linkIdThree === id ? null : id);
    handleCollapse(true);
  };

  return (
    <>
      <div className={`app-sidebar ${isCollapse ? "collapsed close_sidebar" : ""}`}>
        {/* Sidebar Header with company logo */}
        <div className="main-sidebar-header">
          <Link href="/" className="header-logo flex items-center gap-3 w-full min-w-0">
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
        </div>

        <div className="common-scrollbar max-h-screen overflow-y-auto">
          <nav className="main-menu-container nav nav-pills flex-column sub-open mt-[80px]">
            <ul className="main-menu" style={{ display: "block" }}>
              <li className="sidebar__menu-category">
                <span className="category-name">Manager Menu</span>
              </li>

              {managerMenuItems.map((item) => (
                <li
                  key={item.id}
                  className={item.subItems?.length ? `slide has-sub ${linkId === item.id ? "open" : ""}` : ""}
                >
                  <Link
                    onClick={(e) => {
                      if (!item.link || item.link === "#") {
                        e.preventDefault();
                      }
                      if (item.subItems?.length) {
                        handleClick(item.id);
                      }
                    }}
                    href={item.link || "#"}
                    className={`sidebar__menu-item ${linkId === item.id ? "active" : ""}`}
                  >
                    {item.icon && (
                      <div className="side-menu__icon">
                        <i className={item.icon}></i>
                      </div>
                    )}
                    <span className="sidebar__menu-label">{item.label}</span>
                    {item.subItems && <i className="fa-regular fa-angle-down side-menu__angle"></i>}
                  </Link>

                  {item.subItems && (
                    <ul
                      className={linkId === item.id ? "sidebar-menu child1 active submenu-visible" : "sidebar-menu child1"}
                      style={{ display: linkId === item.id ? "block" : "none" }}
                    >
                      {item.subItems.map((subOne, index) => (
                        <li
                          key={subOne.id}
                          className={subOne.subItems?.length ? `slide has-sub ${linkIdTwo === subOne.id ? "open" : ""}` : ""}
                        >
                          <Link
                            onClick={(e) => {
                              if (subOne.subItems?.length) {
                                e.preventDefault();
                                handleClickTwo(subOne.id);
                              }
                            }}
                            href={subOne.link || "#"}
                            className={`sidebar__menu-item ${linkIdTwo === subOne.id ? "active" : ""}`}
                          >
                            {subOne.label}
                            {subOne.subItems && <i className="fa-regular fa-angle-down side-menu__angle"></i>}
                          </Link>

                          {subOne.subItems && (
                            <ul
                              className="sidebar-menu child2"
                              style={{ display: linkIdTwo === subOne.id ? "block" : "none" }}
                            >
                              {subOne.subItems.map((subTwo) => (
                                <li
                                  key={subTwo.id}
                                  className={subTwo.subItems?.length ? `slide has-sub ${linkIdThree === subTwo.id ? "open" : ""}` : ""}
                                >
                                  <Link
                                    onClick={(e) => {
                                      if (subTwo.subItems?.length) {
                                        e.preventDefault();
                                        handleClickThree(subTwo.id);
                                      }
                                    }}
                                    href={subTwo.link || "#"}
                                    className={`sidebar__menu-item ${linkIdThree === subTwo.id ? "active" : ""}`}
                                  >
                                    {subTwo.label}
                                    {subTwo.subItems && <i className="fa-regular fa-angle-down side-menu__angle"></i>}
                                  </Link>

                                  {subTwo.subItems && (
                                    <ul
                                      className="sidebar-menu child3"
                                      style={{ display: linkIdThree === subTwo.id ? "block" : "none" }}
                                    >
                                      {subTwo.subItems.map((subThree) => (
                                        <li key={subThree.id} className="slide">
                                          <Link href={subThree.link || "#"} className="sidebar__menu-item">
                                            {subThree.label}
                                          </Link>
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
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div
        className={`app__offcanvas-overlay ${isCollapse ? "overlay-open" : ""}`}
        onClick={() => setIsCollapse(false)}
      ></div>
    </>
  );
};

export default ManagerSidebar;

"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import useGlobalContext from "@/hooks/use-context";
import { defaultEmployeeSidebar } from "@/data/employeeSideBarData/employee-sidebar-data";
import { employeeSidebarAddons, EmployeeSidebarAddon } from "@/data/employeeSideBarData/employee-addon-sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { Company } from "@/types/company";

// Define type for permissions
interface SidebarPermissions {
  [key: string]: boolean;
}

const EmployeeSidebar = () => {
  const { isCollapse, setIsCollapse } = useGlobalContext();
  const [sidebarItems, setSidebarItems] = useState<any[]>([]);
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [userPermissions, setUserPermissions] = useState<SidebarPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [company, setCompany] = useState<Company | null>(null); // <-- Added

  // Fetch company info (same logic as HRMSidebar)
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

  // Fetch permissions
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (loadingAuth) return;

      if (!user) {
        setLoadingPermissions(false);
        setSidebarItems(defaultEmployeeSidebar);
        return;
      }

      setLoadingPermissions(true);
      try {
        const res = await fetch(`/api/user-data?uid=${user.uid}`);
        if (!res.ok) throw new Error("Failed to fetch user permissions.");

        const data = await res.json();
        if (data.success && data.user && typeof data.user.sidebarAddons === "object") {
          setUserPermissions(data.user.sidebarAddons as SidebarPermissions);
        } else {
          setUserPermissions({});
        }
      } catch (error: any) {
        console.error("Error fetching user permissions:", error);
        toast.error("Failed to load user permissions.");
        setUserPermissions({});
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchUserPermissions();
  }, [user, loadingAuth]);

  // Build menu items
  useEffect(() => {
    if (userPermissions) {
      const allowedAddons = employeeSidebarAddons.filter(
        (addon: EmployeeSidebarAddon) => userPermissions[addon.permissionKey] === true
      );
      setSidebarItems([...defaultEmployeeSidebar, ...allowedAddons]);
    } else if (!loadingPermissions) {
      setSidebarItems(defaultEmployeeSidebar);
    }
  }, [userPermissions, loadingPermissions]);

  // Loading state
  if (loadingAuth || loadingPermissions) {
    return (
      <aside className={`app-sidebar ${isCollapse ? "collapsed close_sidebar" : ""}`}>
        <div className="common-scrollbar max-h-screen overflow-y-auto">
          <nav className="main-menu-container nav nav-pills flex-column sub-open mt-[80px]">
            <ul className="main-menu">
              <li className="sidebar__menu-category">
                <span className="category-name">Loading Menu...</span>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    );
  }

  if (errorAuth) {
    console.error("Authentication error:", errorAuth);
    return (
      <aside className={`app-sidebar ${isCollapse ? "collapsed close_sidebar" : ""}`}>
        <div className="common-scrollbar max-h-screen overflow-y-auto">
          <nav className="main-menu-container nav nav-pills flex-column sub-open mt-[80px]">
            <ul className="main-menu">
              <li className="sidebar__menu-category">
                <span className="category-name">Error Loading Menu</span>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Sidebar Menu */}
      <aside className={`app-sidebar ${isCollapse ? "collapsed close_sidebar" : ""}`}>
         {/* Company Logo + Name */}
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
            <ul className="main-menu">
              <li className="sidebar__menu-category">
                <span className="category-name">Employee Menu</span>
              </li>
              {sidebarItems.map((item) => (
                <li key={item.id} className="slide">
                  <Link 
                    href={item.link} 
                    className="sidebar__menu-item"
                    onClick={() => {
                      // Close sidebar on mobile when navigating
                      if (window.matchMedia("(max-width: 1199px)").matches) {
                        setIsCollapse(false);
                      }
                    }}
                  >
                    <div className="side-menu__icon">
                      <i className={item.icon}></i>
                    </div>
                    <span className="sidebar__menu-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <div
        className={`app__offcanvas-overlay ${isCollapse ? "overlay-open" : ""}`}
        onClick={() => setIsCollapse(false)}
      ></div>
    </>
  );
};

export default EmployeeSidebar;

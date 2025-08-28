"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import sidebarMainLogo from "../../../../public/assets/images/logo/logo.svg";
import sidebarDarkLogo from "../../../../public/assets/images/logo/logo-white.svg";
import useGlobalContext from "@/hooks/use-context";
import sidebarImg from "../../../../public/assets/images/bg/side-bar.png";
import sidebarData from "@/data/sidebar-data";
import { usePathname } from "next/navigation";
import { filterSidebarByRole, UserRole } from "@/lib/utils/sidebarFilter";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const DashBoardSidebar = () => {
  const { isCollapse, setIsCollapse } = useGlobalContext();
  const [linkId, setlinkId] = useState<number | null>(null);
  const [linkIdTwo, setlinkIdTwo] = useState<number | null>(null);
  const [linkIdThree, setlinkIdThree] = useState<number | null>(null);
  const [linkIdFour, setlinkIdFour] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("employee");
  const [filteredSidebarData, setFilteredSidebarData] = useState(sidebarData);
  const [user, loading] = useAuthState(auth);
  const pathName = usePathname();

  // Fetch user role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
      
      if (user) {
        // Authenticated user - fetch role from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const role = userData.role as UserRole;
            setUserRole(role);
            
            // Filter sidebar data based on user role
            const filtered = filterSidebarByRole(sidebarData, role);
            setFilteredSidebarData(filtered);
          } else {
            // User document doesn't exist - fallback to employee
            setUserRole("employee");
            const filtered = filterSidebarByRole(sidebarData, "employee");
            setFilteredSidebarData(filtered);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Fallback to employee role if error occurs
          setUserRole("employee");
          const filtered = filterSidebarByRole(sidebarData, "employee");
          setFilteredSidebarData(filtered);
        }
      } else if (!loading) {
        // Unauthenticated user
        if (isLocalhost && process.env.NODE_ENV === "development") {
          // Development mode on localhost - show everything for testing
          setUserRole("super-admin");
          setFilteredSidebarData(sidebarData); // Show all unfiltered items
        } else {
          // Production or non-localhost - minimal access
          setUserRole("employee");
          const filtered = filterSidebarByRole(sidebarData, "employee");
          setFilteredSidebarData(filtered);
        }
      }
    };

    if (!loading) {
      fetchUserRole();
    }
  }, [user, loading]);

  // Utility function to handle collapse behavior for screens with max-width: 1199px
  const handleCollapse = (shouldCollapse: boolean) => {
    if (window.matchMedia("(max-width: 1199px)").matches) {
      setIsCollapse(shouldCollapse);
    }
  };

  const handleClick = (id: number) => {
    if (linkId === id) {
      setlinkId(null);
      handleCollapse(true);
    } else {
      setlinkId(id);
      setlinkIdTwo(null);
      setlinkIdThree(null);
      setlinkIdFour(null);
      handleCollapse(true);
    }
  };

  const handleClickTwo = (id: number) => {
    if (linkIdTwo === id) {
      setlinkIdTwo(null);
      handleCollapse(true);
    } else {
      setlinkIdTwo(id);
      setlinkIdThree(null);
      setlinkIdFour(null);
      handleCollapse(true);
    }
  };

  const handleClickThree = (id: number) => {
    if (linkIdThree === id) {
      setlinkIdThree(null);
      handleCollapse(true);
    } else {
      setlinkIdThree(id);
      setlinkIdFour(null);
      handleCollapse(true);
    }
  };

  const handleClickFour = (id: number) => {
    if (linkIdFour === id) {
      setlinkIdFour(null);
      handleCollapse(true);
    } else {
      setlinkIdFour(id);
      handleCollapse(true);
    }
  };

  // UseEffect to find and set the active menu based on the current path
  useEffect(() => {
    const findLayerIds = () => {
      let foundFirstLayerId = null;
      let foundSecondLayerId = null;
      let foundThirdLayerId = null;

      // Use filtered sidebar data instead of original
      filteredSidebarData.forEach((category) => {
        category.items.forEach((item) => {
          if (item.link === pathName) {
            foundFirstLayerId = item.id;
            foundSecondLayerId = null;
            foundThirdLayerId = null;
          } else if (item.subItems) {
            item.subItems.forEach((subItem, subItemIndex) => {
              if (subItem.link === pathName) {
                foundFirstLayerId = item.id;
                foundSecondLayerId = subItemIndex;
                foundThirdLayerId = null;
              } else if (subItem.subItems) {
                subItem.subItems.forEach((thirdSubMenu, thirdSubIndex) => {
                  if (thirdSubMenu.link === pathName) {
                    foundFirstLayerId = item.id;
                    foundSecondLayerId = subItemIndex;
                    foundThirdLayerId = thirdSubIndex;
                  }
                });
              }
            });
          }
        });
      });

      setlinkId(foundFirstLayerId);
      setlinkIdTwo(foundSecondLayerId);
      setlinkIdThree(foundThirdLayerId);
    };

    findLayerIds();
  }, [pathName, filteredSidebarData]);

  // Show loading state while fetching user role
  if (loading) {
    return (
      <div className={`app-sidebar ${isCollapse ? "collapsed close_sidebar" : ""}`}>
        <div className="main-sidebar-header">
          <Link href="/" className="header-logo">
            <Image className="main-logo" src={sidebarMainLogo} priority alt="logo" />
            <Image className="dark-logo" src={sidebarDarkLogo} priority alt="logo" />
          </Link>
        </div>
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`app-sidebar ${isCollapse ? "collapsed close_sidebar" : ""}`}>
        <div className="main-sidebar-header">
          <Link href="/" className="header-logo">
            <Image className="main-logo" src={sidebarMainLogo} priority alt="logo" />
            <Image className="dark-logo" src={sidebarDarkLogo} priority alt="logo" />
          </Link>
        </div>

        <div className="common-scrollbar max-h-screen overflow-y-auto">
          {/* User Role Indicator (Optional - can be removed in production) */}
          {process.env.NODE_ENV === "development" && (
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
              Role: {userRole} {!user && "(Development Mode)"}
            </div>
          )}

          <nav className="main-menu-container nav nav-pills flex-column sub-open mt-[80px]">
            <ul className="main-menu" style={{ display: "block" }}>
              {filteredSidebarData.map((category) => (
                <React.Fragment key={category.id}>
                  <li className="sidebar__menu-category">
                    <span className="category-name">{category.category}</span>
                  </li>
                  {category.items.map((item) => (
                    <li
                      key={item.id}
                      className={
                        item.subItems?.length
                          ? `slide has-sub ${linkId === item.id ? "open" : ""}`
                          : ""
                      }
                    >
                      <Link
                        onClick={(e) => {
                          if (!item.link || item.link === "#") {
                            e.preventDefault();
                          }
                          handleClick(item.id);
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
                              className={`slide has-sub ${
                                linkIdTwo === index ? "open" : ""
                              }`}
                            >
                              <Link
                                onClick={() => handleClickTwo(index)}
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
                                      className={`slide has-sub ${
                                        linkIdThree === subIndex ? "open" : ""
                                      }`}
                                    >
                                      <Link
                                        onClick={() => handleClickThree(subIndex)}
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
                                                className={`slide ${
                                                  subThree.subItems ? "has-sub" : ""
                                                }`}
                                              >
                                                <Link
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
                </React.Fragment>
              ))}
            </ul>
          </nav>

          {/* Show upgrade section only for non-super-admin users */}
          {userRole !== "super-admin" && (
            <div
              className="sidebar__thumb sidebar-bg"
              style={{ backgroundImage: `url(${sidebarImg.src})` }}
            >
              <div className="sidebar__thumb-content">
                <p className="sidebar__thumb-title">
                  Upgrade to PRO to get access all Features!
                </p>
                <Link
                  href="/pro"
                  className="btn btn-white-primary rounded-[50rem] w-full"
                >
                  Get Pro Now!
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="app__offcanvas-overlay"></div>
      <div
        onClick={() => setIsCollapse(false)}
        className={`app__offcanvas-overlay ${isCollapse ? "overlay-open" : ""}`}
      ></div>
    </>
  );
};

export default DashBoardSidebar;
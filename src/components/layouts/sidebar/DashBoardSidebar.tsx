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
import { useUserRole } from "@/hooks/useUserRole";

const DashBoardSidebar = () => {
  const { isCollapse, setIsCollapse } = useGlobalContext();
  const [linkId, setlinkId] = useState<number | null>(null);
  const [linkIdTwo, setlinkIdTwo] = useState<number | null>(null);
  const [linkIdThree, setlinkIdThree] = useState<number | null>(null);
  const [linkIdFour, setlinkIdFour] = useState<number | null>(null);
  const { userRole, isAuthenticated } = useUserRole();
  const pathName = usePathname();

  const filteredSidebarData = filterSidebarByRole(sidebarData, (userRole || "employee") as UserRole);

  // Utility function to handle collapse behavior for all screen sizes
  const handleCollapse = (shouldCollapse: boolean) => {
    setIsCollapse(shouldCollapse);
  };

  const handleClick = (id: number) => {
    if (linkId === id) {
      setlinkId(null);
    } else {
      setlinkId(id);
      setlinkIdTwo(null);
      setlinkIdThree(null);
      setlinkIdFour(null);
    }
    if (window.matchMedia("(max-width: 1199px)").matches) {
      handleCollapse(false);
    }
  };

  const handleClickTwo = (id: number) => {
    if (linkIdTwo === id) {
      setlinkIdTwo(null);
    } else {
      setlinkIdTwo(id);
      setlinkIdThree(null);
      setlinkIdFour(null);
    }
    if (window.matchMedia("(max-width: 1199px)").matches) {
      handleCollapse(false);
    }
  };

  const handleClickThree = (id: number) => {
    if (linkIdThree === id) {
      setlinkIdThree(null);
    } else {
      setlinkIdThree(id);
      setlinkIdFour(null);
    }
    if (window.matchMedia("(max-width: 1199px)").matches) {
      handleCollapse(false);
    }
  };

  const handleClickFour = (id: number) => {
    if (linkIdFour === id) {
      setlinkIdFour(null);
    } else {
      setlinkIdFour(id);
    }
    if (window.matchMedia("(max-width: 1199px)").matches) {
      handleCollapse(false);
    }
  };

  useEffect(() => {
    const findLayerIds = () => {
      let foundFirstLayerId = null;
      let foundSecondLayerId = null;
      let foundThirdLayerId = null;

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
          {process.env.NODE_ENV === "development" && (
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
              Role: {userRole} {!isAuthenticated && "(Not authenticated)"}
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
                            handleClick(item.id);
                          } else {
                            handleCollapse(false);
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
                              className={`slide has-sub ${
                                linkIdTwo === index ? "open" : ""
                              }`}
                            >
                              <Link
                                onClick={(e) => {
                                  if (!subOne.link || subOne.link === "#" || subOne.link === "/") {
                                    e.preventDefault();
                                    handleClickTwo(index);
                                  } else {
                                    handleCollapse(false);
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
                                      className={`slide has-sub ${
                                        linkIdThree === subIndex ? "open" : ""
                                      }`}
                                    >
                                      <Link
                                        onClick={(e) => {
                                          if (!subTwo.link || subTwo.link === "#") {
                                            e.preventDefault();
                                            handleClickThree(subIndex);
                                          } else {
                                            handleCollapse(false);
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
                                                className={`slide ${
                                                  subThree.subItems ? "has-sub" : ""
                                                }`}
                                              >
                                                <Link
                                                  onClick={() => {
                                                    handleCollapse(false);
                                                  }}
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
      <div
        onClick={() => setIsCollapse(true)}
        className={`app__offcanvas-overlay ${!isCollapse ? "overlay-open" : ""}`}
      ></div>
    </>
  );
};

export default DashBoardSidebar;

"use client";
import Image from "next/image";
import React, { useState } from "react"; // Removed useEffect as context handles initial fetch
import handImg from "../../../../public/assets/images/shape/hand.png";
import HeaderAction from "./components/HeaderAction";
import useGlobalContext from "@/hooks/use-context";
import sidebarData from "@/data/sidebar-data";
import Link from "next/link";
import { SidebarCategory } from "@/interface";
import { useAuthUserContext } from "@/context/UserAuthContext"; // Import your context hook

// Define some common, related search terms to use as suggestions
const relatedSearchTerms = [
  "New Employee",
  "Add Employee",
  "View Reports",
  "Manage Meetings",
  "Employee Profile",
  "Dashboard Overview",
  "Settings",
  "User Management",
  "Payroll",
  "Performance Reviews",
];

const DashboardHeader = () => {
  const { sidebarHandle } = useGlobalContext();
  // Get user data and loading state directly from the AuthUserContext
  const { user: authUser, loading: loadingAuthUser } = useAuthUserContext(); 
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResultData, setSearchResultData] = useState<
    SidebarCategory[] | null
  >([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);
    setShowResults(value.trim().length > 0);

    if (value.trim().length > 0) {
      const filteredData = sidebarData
        .map((category) => {
          const filteredItems = category.items
            .map((item) => {
              const filteredSubItems = item.subItems?.filter((subItem) =>
                subItem.label.toLowerCase().includes(value)
              );

              if (
                item.label.toLowerCase().includes(value) ||
                (filteredSubItems && filteredSubItems.length > 0)
              ) {
                return { ...item, subItems: filteredSubItems || item.subItems };
              }

              return null;
            })
            .filter(Boolean);

          if (filteredItems.length > 0) {
            return { ...category, items: filteredItems };
          }

          return null;
        })
        .filter(Boolean) as SidebarCategory[];

      setSearchResultData(filteredData);
    } else {
      setSearchResultData([]);
    }
  };

  return (
    <>
      {/* -- App header area start -- */}
      <div className="app__header__area">
        <div className="app__header-inner">
          <div className="app__header-left">
            <div className="flex">
              <button
                id="sidebar__active"
                onClick={sidebarHandle}
                className="app__header-toggle"
              >
                <div className="bar-icon-2">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            </div>
            <h2 className="header__title">
              {/* Display user's name from context, with loading state and fallback */}
              Hello {loadingAuthUser ? "Loading..." : authUser?.fullName || "User"}
              <span>
                {/* Re-added Image component for handImg */}
                <Image
                  className="inline-block"
                  src={handImg}
                  priority
                  alt="image"
                />
              </span>
            </h2>
          </div>
          <div className="app__header-right">
            <div className="app__herader-input relative">
              <input
                type="search"
                id="search-field"
                name="search-field"
                placeholder="Search Here . . ."
                list="related-searches"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button>
                <i className="icon-magnifying-glass"></i>
              </button>
              
              {/* Datalist for search suggestions */}
              <datalist id="related-searches">
                {relatedSearchTerms.map((term, index) => (
                  <option key={index} value={term} />
                ))}
              </datalist>

              {/* Search Results Box */}
              {showResults && (
                <div className="search-results-box">
                  <ul>
                    {searchResultData?.length ? (
                      <>
                        {searchResultData.map((category) => (
                          <li key={category.id}>
                            <strong>{category.category}</strong>
                            <ul>
                              {category.items.map((item) => (
                                <li key={item.id}>
                                  {item.link ? (
                                    <Link href={item.link}>{item.label}</Link>
                                  ) : (
                                    item.label
                                  )}
                                  {item.subItems && (
                                    <ul>
                                      {item.subItems.map((subItem, index) => (
                                        <li key={index}>
                                          {subItem.link ? (
                                            <Link href={subItem.link}>
                                              {subItem.label}
                                            </Link>
                                          ) : (
                                            subItem.label
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </>
                    ) : (
                      <li>No results found</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <HeaderAction />
          </div>
        </div>
      </div>
      <div className="body__overlay"></div>
      {/* -- App header area end -- */}
    </>
  );
};

export default DashboardHeader;

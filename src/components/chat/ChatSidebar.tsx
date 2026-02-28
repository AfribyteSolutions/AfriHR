"use client";
import React, { useState, useEffect } from "react";
import { IEmployee } from "@/interface";

interface ChatSidebarProps {
  employees: IEmployee[];
  selectedUserId: string | null;
  onSelectUser: (employee: IEmployee) => void;
  currentUserId: string;
  loading?: boolean;
  unreadCounts?: Record<string, number>;
  lastMessageTimes?: Record<string, number>;
}

export default function ChatSidebar({
  employees,
  selectedUserId,
  onSelectUser,
  currentUserId,
  loading = false,
  unreadCounts = {},
  lastMessageTimes = {},
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<IEmployee[]>([]);

  useEffect(() => {
    const filtered = employees
      .filter((emp) => {
        const matchesSearch = emp.fullName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
        const isNotCurrentUser = emp.uid !== currentUserId;
        return matchesSearch && isNotCurrentUser;
      })
      .sort((a, b) => {
        const timeA = lastMessageTimes[a.uid] || 0;
        const timeB = lastMessageTimes[b.uid] || 0;
        if (timeB !== timeA) return timeB - timeA; // most recent first
        return (a.fullName || "").localeCompare(b.fullName || ""); // alphabetical fallback
      });
    setFilteredEmployees(filtered);
  }, [employees, searchQuery, currentUserId, lastMessageTimes]);

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarUrl = (employee: IEmployee) => {
    return employee.photoURL || employee.profilePictureUrl || null;
  };

  if (loading) {
    return (
      <div className="w-72 flex-shrink-0 bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-borderLightest dark:border-borderLightest-dark">
          <div className="w-full h-9 bg-bgLightest dark:bg-bgBody-dark rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-bgLightest dark:bg-bgBody-dark animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-bgLightest dark:bg-bgBody-dark rounded animate-pulse w-3/4" />
                <div className="h-3 bg-bgLightest dark:bg-bgBody-dark rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark overflow-hidden flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-borderLightest dark:border-borderLightest-dark">
        <div className="relative">
          <input
            type="search"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-9 rounded-lg bg-bgLightest dark:bg-bgBody-dark border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <svg
            className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-body dark:text-body-dark"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Employee list */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-10 h-10 mx-auto text-body dark:text-body-dark mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-body dark:text-body-dark text-sm">
              {searchQuery ? "No employees found" : "No employees available"}
            </p>
          </div>
        ) : (
          filteredEmployees.map((employee) => {
            const avatarUrl = getAvatarUrl(employee);
            const isSelected = selectedUserId === employee.uid;
            const unread = unreadCounts[employee.uid] || 0;
            const hasUnread = unread > 0;

            return (
              <button
                key={employee.uid}
                onClick={() => onSelectUser(employee)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all border-b border-borderLightest dark:border-borderLightest-dark border-l-[3px] ${
                  isSelected
                    ? "bg-primary/10 dark:bg-primary/20 border-l-primary"
                    : "border-l-transparent hover:bg-bgLightest dark:hover:bg-bgBody-dark"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={employee.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                      {getInitials(employee.fullName)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3
                      className={`text-sm truncate ${
                        hasUnread
                          ? "font-bold text-dark dark:text-dark-dark"
                          : "font-medium text-dark dark:text-dark-dark"
                      }`}
                    >
                      {employee.fullName}
                    </h3>
                    {hasUnread && (
                      <span className="flex-shrink-0 bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-body dark:text-body-dark truncate mt-0.5">
                    {employee.position || employee.department || "Employee"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

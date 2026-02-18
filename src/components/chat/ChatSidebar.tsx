"use client";
import React, { useState, useEffect } from "react";
import { IEmployee } from "@/interface";
import {
  subscribeToUnreadCounts,
  subscribeToConversations,
  getLastMessage,
  Conversation,
} from "@/lib/firebase/messages";

interface ChatSidebarProps {
  employees: IEmployee[];
  selectedUserId: string | null;
  onSelectUser: (employee: IEmployee) => void;
  currentUserId: string;
  companyId: string;
  loading?: boolean;
}

interface EmployeeWithMetadata extends IEmployee {
  lastMessageTime?: Date;
  lastMessage?: string;
  unreadCount?: number;
}

// Helper: get Firebase Auth UID for chat (authUid resolved by API, fallback to uid)
const getChatUid = (emp: any): string => emp.authUid || emp.uid;

export default function ChatSidebar({
  employees,
  selectedUserId,
  onSelectUser,
  currentUserId,
  companyId,
  loading = false,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithMetadata[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [employeesWithMetadata, setEmployeesWithMetadata] = useState<EmployeeWithMetadata[]>([]);
  // Map: userName → Auth UID (from existing room documents - always correct)
  const [authUidByName, setAuthUidByName] = useState<Record<string, string>>({});

  // Subscribe to unread counts for all conversations
  useEffect(() => {
    if (!currentUserId || !companyId) return;

    const unsubscribe = subscribeToUnreadCounts(
      currentUserId,
      companyId,
      (counts) => {
        setUnreadCounts(counts);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserId, companyId]);

  // Subscribe to conversations to build a reliable name → Auth UID mapping.
  // Room documents always store the correct Firebase Auth UIDs regardless of employee doc IDs.
  useEffect(() => {
    if (!currentUserId || !companyId) return;

    const unsubscribe = subscribeToConversations(
      currentUserId,
      companyId,
      (conversations: Conversation[]) => {
        const mapping: Record<string, string> = {};
        conversations.forEach((conv) => {
          // Map the other participant's display name to their Auth UID
          if (conv.userName && conv.userId) {
            mapping[conv.userName] = conv.userId;
          }
        });
        setAuthUidByName(mapping);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUserId, companyId]);

  // Fetch last message for each employee and sort by most recent
  useEffect(() => {
    if (!employees.length || !currentUserId || !companyId) {
      setEmployeesWithMetadata([]);
      return;
    }

    const fetchLastMessages = async () => {
      const employeesWithData: EmployeeWithMetadata[] = await Promise.all(
        employees
          .filter((emp) => getChatUid(emp) !== currentUserId)
          .map(async (emp) => {
            const chatUid = getChatUid(emp);
            const lastMsg = await getLastMessage(currentUserId, chatUid, companyId);
            return {
              ...emp,
              lastMessageTime: lastMsg?.timestamp,
              lastMessage: lastMsg?.message,
              unreadCount: unreadCounts[chatUid] || 0,
            };
          })
      );

      // Sort by last message time (most recent first)
      employeesWithData.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
      });

      setEmployeesWithMetadata(employeesWithData);
    };

    fetchLastMessages();
  }, [employees, currentUserId, companyId]);

  // Update unread counts when they change
  useEffect(() => {
    setEmployeesWithMetadata((prev) =>
      prev.map((emp) => ({
        ...emp,
        unreadCount: unreadCounts[getChatUid(emp)] || 0,
      }))
    );
  }, [unreadCounts]);

  // Filter employees based on search query
  useEffect(() => {
    const filtered = employeesWithMetadata.filter((emp) => {
      const matchesSearch = emp.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
    setFilteredEmployees(filtered);
  }, [employeesWithMetadata, searchQuery]);

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

  const formatLastMessageTime = (date?: Date) => {
    if (!date) return "";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return days === 1 ? "Yesterday" : `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return "Just now";
  };

  if (loading) {
    return (
      <div className="w-80 flex-shrink-0 bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark overflow-hidden flex flex-col">
        <div className="p-4 border-b border-borderLightest dark:border-borderLightest-dark">
          <div className="w-full h-10 bg-bgLightest dark:bg-bgBody-dark rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-bgLightest dark:bg-bgBody-dark animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-bgLightest dark:bg-bgBody-dark rounded animate-pulse w-3/4" />
                <div className="h-3 bg-bgLightest dark:bg-bgBody-dark rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark overflow-hidden flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b border-borderLightest dark:border-borderLightest-dark">
        <div className="relative">
          <input
            type="search"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg bg-bgLightest dark:bg-bgBody-dark border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-body dark:text-body-dark"
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

      {/* Employee List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="w-12 h-12 mx-auto text-body dark:text-body-dark mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-body dark:text-body-dark text-sm">
              {searchQuery ? "No employees found" : "No employees available"}
            </p>
          </div>
        ) : (
          filteredEmployees.map((employee) => {
            const avatarUrl = getAvatarUrl(employee);
            const isSelected = selectedUserId === getChatUid(employee);
            const hasUnread = (employee.unreadCount || 0) > 0;

            return (
              <button
                key={employee.uid}
                onClick={() => {
                  // If we have a confirmed Auth UID from an existing room, inject it
                  const knownAuthUid = authUidByName[employee.fullName];
                  onSelectUser(knownAuthUid ? { ...employee, authUid: knownAuthUid } : employee);
                }}
                className={`w-full p-4 flex items-start gap-3 hover:bg-bgLightest dark:hover:bg-bgBody-dark transition border-b border-borderLightest dark:border-borderLightest-dark ${
                  isSelected ? "bg-bgLightest dark:bg-bgBody-dark" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={employee.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {getInitials(employee.fullName)}
                    </div>
                  )}
                  {/* Unread indicator badge */}
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1.5">
                      <span className="text-white text-xs font-semibold">
                        {employee.unreadCount! > 99 ? "99+" : employee.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold text-sm truncate ${
                      hasUnread
                        ? "text-dark dark:text-dark-dark"
                        : "text-dark dark:text-dark-dark"
                    }`}>
                      {employee.fullName}
                    </h3>
                    {employee.lastMessageTime && (
                      <span className="text-xs text-body dark:text-body-dark flex-shrink-0 ml-2">
                        {formatLastMessageTime(employee.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  {employee.lastMessage ? (
                    <p className={`text-xs truncate ${
                      hasUnread
                        ? "text-dark dark:text-dark-dark font-semibold"
                        : "text-body dark:text-body-dark"
                    }`}>
                      {employee.lastMessage}
                    </p>
                  ) : (
                    <p className="text-xs text-body dark:text-body-dark truncate">
                      {employee.position || employee.department || "Employee"}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

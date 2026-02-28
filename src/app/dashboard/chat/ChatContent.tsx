"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { IEmployee } from "@/interface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import {
  Message,
  subscribeToMessages,
  subscribeToUnreadCounts,
  createMessage,
  markMessagesAsRead,
} from "@/lib/firebase/messages";

export default function ChatContent() {
  const { user, loading: authLoading } = useAuthUserContext();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks the currently open conversation so we can mark as read on new messages
  const selectedEmployeeRef = useRef<IEmployee | null>(null);
  selectedEmployeeRef.current = selectedEmployee;

  // Fetch employees
  useEffect(() => {
    if (!user?.companyId) return;

    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const response = await fetch(
          `/api/company-employees?companyId=${user.companyId}&limit=1000`
        );
        const data = await response.json();
        if (data.success) {
          setEmployees(data.employees || []);
        } else {
          setError("Failed to load employees");
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees");
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [user?.companyId]);

  // Subscribe to unread counts (simple equality-only query, no composite index needed)
  useEffect(() => {
    if (!user?.uid || !user?.companyId) return;

    const unsubscribe = subscribeToUnreadCounts(
      user.uid,
      user.companyId,
      (counts) => setUnreadCounts(counts)
    );

    return () => unsubscribe();
  }, [user?.uid, user?.companyId]);

  // Subscribe to messages when an employee is selected
  useEffect(() => {
    if (!user?.uid || !selectedEmployee?.uid || !user?.companyId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    const unsubscribe = subscribeToMessages(
      user.uid,
      selectedEmployee.uid,
      user.companyId,
      (newMessages) => {
        setMessages(newMessages);
        setLoadingMessages(false);
        // Mark incoming messages as read if this conversation is still open
        if (selectedEmployeeRef.current?.uid === selectedEmployee.uid) {
          markMessagesAsRead(user.uid, selectedEmployee.uid, user.companyId);
        }
      }
    );

    return () => unsubscribe();
  }, [user?.uid, selectedEmployee?.uid, user?.companyId]);

  // Mark as read when switching to a conversation
  const handleSelectEmployee = (employee: IEmployee) => {
    setSelectedEmployee(employee);
    if (user?.uid && user?.companyId) {
      markMessagesAsRead(user.uid, employee.uid, user.companyId);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!user || !selectedEmployee || !messageText.trim()) return;

    try {
      await createMessage({
        senderId: user.uid,
        senderName: user.fullName || user.name || "Unknown",
        senderPhoto: user.photoURL || user.profilePictureUrl || null,
        receiverId: selectedEmployee.uid,
        receiverName: selectedEmployee.fullName || selectedEmployee.name || "Unknown",
        receiverPhoto: selectedEmployee.photoURL || selectedEmployee.profilePictureUrl || null,
        message: messageText,
        companyId: user.companyId,
      });
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
      throw err;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-body dark:text-body-dark">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-body dark:text-body-dark">Please log in to access chat</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-3 sm:px-6 pt-4 pb-4">
      {/* Error */}
      {error && (
        <div className="flex-shrink-0 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main chat layout — fills remaining space, no overflow on page */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 sm:gap-4 min-h-0">
        {/* Employee sidebar */}
        <ChatSidebar
          employees={employees}
          selectedUserId={selectedEmployee?.uid || null}
          onSelectUser={handleSelectEmployee}
          currentUserId={user.uid}
          loading={loadingEmployees}
          unreadCounts={unreadCounts}
        />

        {/* Chat window */}
        <div className="flex-1 bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark overflow-hidden flex flex-col min-h-0">
          {selectedEmployee ? (
            <>
              {/* Chat header */}
              <div className="flex-shrink-0 p-4 border-b border-borderLightest dark:border-borderLightest-dark flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {selectedEmployee.photoURL || selectedEmployee.profilePictureUrl ? (
                      <img
                        src={selectedEmployee.photoURL || selectedEmployee.profilePictureUrl || ""}
                        alt={selectedEmployee.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                        {getInitials(selectedEmployee.fullName || selectedEmployee.name)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-dark dark:text-dark-dark">
                      {selectedEmployee.fullName || selectedEmployee.name}
                    </h2>
                    <p className="text-xs text-body dark:text-body-dark">
                      {selectedEmployee.position || selectedEmployee.department || "Employee"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <MessageList
                messages={messages}
                currentUserId={user.uid}
                loading={loadingMessages}
              />

              {/* Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!selectedEmployee}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto text-body dark:text-body-dark mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-dark dark:text-dark-dark mb-2">
                  No conversation selected
                </h3>
                <p className="text-body dark:text-body-dark">
                  Select an employee from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

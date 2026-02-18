"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { IEmployee } from "@/interface";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import {
  Message,
  subscribeToMessages,
  subscribeToConversations,
  createMessage,
  markMessagesAsRead,
} from "@/lib/firebase/messages";

export default function ChatContent() {
  const { user, loading: authLoading } = useAuthUserContext();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map: userName → Auth UID, built from existing room documents.
  const [authUidByName, setAuthUidByName] = useState<Record<string, string>>({});

  // Current user's employee doc.id if it differs from their Firebase Auth UID.
  // Some employees were created manually and have an auto-generated Firestore doc.id
  // that doesn't match their Auth UID. We need to watch rooms using BOTH IDs.
  const [myEmployeeDocId, setMyEmployeeDocId] = useState<string | null>(null);

  // After employees load, find the current user's own entry to detect a doc.id mismatch.
  useEffect(() => {
    if (!employees.length || !user?.uid || !user?.email) return;
    const self = employees.find(
      (emp: any) => emp.authUid === user.uid || emp.email === user.email
    );
    if (self && self.uid !== user.uid) {
      console.log('[ChatContent] Employee doc.id mismatch detected:', self.uid, '≠', user.uid);
      setMyEmployeeDocId(self.uid);
    }
  }, [employees, user?.uid, user?.email]);

  // Subscribe to conversations using the Auth UID (primary).
  useEffect(() => {
    if (!user?.uid || !user?.companyId) return;
    const unsubscribe = subscribeToConversations(
      user.uid,
      user.companyId,
      (conversations) => {
        const mapping: Record<string, string> = {};
        // Conversations are sorted newest-first; only keep the most recent UID per name.
        conversations.forEach((conv) => {
          if (conv.userName && conv.userId && !mapping[conv.userName]) {
            mapping[conv.userName] = conv.userId;
          }
        });
        console.log('[ChatContent] Auth UID mapping (primary):', mapping);
        setAuthUidByName((prev) => ({ ...prev, ...mapping }));
      }
    );
    return () => unsubscribe();
  }, [user?.uid, user?.companyId]);

  // Also subscribe to conversations using the employee doc.id (if different from Auth UID).
  // This surfaces legacy rooms that were created before Auth UIDs were resolved correctly.
  useEffect(() => {
    if (!myEmployeeDocId || !user?.companyId) return;
    const unsubscribe = subscribeToConversations(
      myEmployeeDocId,
      user.companyId,
      (conversations) => {
        const mapping: Record<string, string> = {};
        conversations.forEach((conv) => {
          if (conv.userName && conv.userId && !mapping[conv.userName]) {
            mapping[conv.userName] = conv.userId;
          }
        });
        console.log('[ChatContent] Auth UID mapping (alt doc.id):', mapping);
        // Merge without overwriting keys already set by the primary subscription
        setAuthUidByName((prev) => {
          const merged = { ...mapping };
          // Primary (Auth UID-based) wins over legacy doc.id-based
          Object.keys(prev).forEach((k) => { merged[k] = prev[k]; });
          return merged;
        });
      }
    );
    return () => unsubscribe();
  }, [myEmployeeDocId, user?.companyId]);

  // Reactively compute the correct Auth UID for the selected employee.
  // Priority: room-based mapping > API-resolved authUid > employee doc.id fallback.
  const theirChatUid = useMemo(() => {
    if (!selectedEmployee) return null;
    const name = selectedEmployee.fullName || selectedEmployee.name;
    if (name && authUidByName[name]) {
      return authUidByName[name];
    }
    return (selectedEmployee as any).authUid || selectedEmployee.uid;
  }, [selectedEmployee, authUidByName]);

  // If theirChatUid resolved to a different value than the employee's doc.id,
  // we also watch the room based on the doc.id (handles legacy messages).
  const theirAlternativeUid = useMemo(() => {
    if (!selectedEmployee || !theirChatUid) return null;
    return selectedEmployee.uid !== theirChatUid ? selectedEmployee.uid : null;
  }, [selectedEmployee, theirChatUid]);

  // Fetch employees from the company
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

  // Subscribe to messages across all possible room combinations.
  // Covers both Auth UID-based rooms (new) and doc.id-based rooms (legacy).
  useEffect(() => {
    if (!user?.uid || !theirChatUid || !user?.companyId) {
      setMessages([]);
      return;
    }

    console.log('[ChatContent] Setting up subscription:', {
      myUid: user.uid,
      myAltDocId: myEmployeeDocId,
      theirChatUid,
      theirAltDocId: theirAlternativeUid,
      companyId: user.companyId,
    });

    setLoadingMessages(true);

    const markAsRead = async () => {
      try {
        await markMessagesAsRead(user.uid, theirChatUid, user.companyId);
        // Also mark the legacy room as read (if it exists)
        if (myEmployeeDocId && theirAlternativeUid) {
          await markMessagesAsRead(myEmployeeDocId, theirAlternativeUid, user.companyId);
        }
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    };

    markAsRead();

    const unsubscribe = subscribeToMessages(
      user.uid,
      theirChatUid,
      user.companyId,
      (newMessages) => {
        console.log('[ChatContent] Received messages:', newMessages.length);
        setMessages(newMessages);
        setLoadingMessages(false);
        if (newMessages.length > 0) markAsRead();
      },
      myEmployeeDocId,      // My alternative UID (employee doc.id)
      theirAlternativeUid   // Their alternative UID (employee doc.id)
    );

    return () => unsubscribe();
  }, [user?.uid, theirChatUid, user?.companyId, myEmployeeDocId, theirAlternativeUid]);

  const handleSendMessage = async (messageText: string) => {
    if (!user || !selectedEmployee || !messageText.trim() || !theirChatUid) return;

    try {
      await createMessage({
        senderId: user.uid,
        senderName: user.fullName || user.name || "Unknown",
        senderPhoto: user.photoURL || user.profilePictureUrl || null,
        receiverId: theirChatUid,
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
      <div className="page__body-inner h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-body dark:text-body-dark">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page__body-inner h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-body dark:text-body-dark">
            Please log in to access chat
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page__body-inner p-4" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 text-xs underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Chat Layout */}
        <div className="flex-1 flex flex-col md:flex-row gap-3 sm:gap-6 overflow-hidden min-h-0">
          {/* Sidebar with employee list */}
          <ChatSidebar
            employees={employees}
            selectedUserId={theirChatUid}
            onSelectUser={setSelectedEmployee}
            currentUserId={user.uid}
            companyId={user.companyId}
            loading={loadingEmployees}
          />

          {/* Chat Window */}
          <div className="flex-1 bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark flex flex-col overflow-hidden">
            {selectedEmployee ? (
              <>
                {/* Chat Header */}
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

                {/* Message Input */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={!selectedEmployee || !theirChatUid}
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
    </div>
  );
}

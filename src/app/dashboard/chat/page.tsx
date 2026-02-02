"use client";
import React, { useState } from "react";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState("");

  // Demo data - no backend functionality
  const conversations = [
    {
      id: 1,
      name: "John Doe",
      role: "HR Manager",
      avatar: "JD",
      lastMessage: "Thanks for the update!",
      time: "2m ago",
      unread: 2,
      online: true,
    },
    {
      id: 2,
      name: "Sarah Smith",
      role: "Team Lead",
      avatar: "SS",
      lastMessage: "Can we schedule a meeting?",
      time: "1h ago",
      unread: 0,
      online: true,
    },
    {
      id: 3,
      name: "Mike Johnson",
      role: "Employee",
      avatar: "MJ",
      lastMessage: "I've submitted the leave request",
      time: "3h ago",
      unread: 1,
      online: false,
    },
    {
      id: 4,
      name: "Emma Wilson",
      role: "HR Assistant",
      avatar: "EW",
      lastMessage: "The documents are ready",
      time: "1d ago",
      unread: 0,
      online: false,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: "other",
      text: "Hi! I need to discuss the upcoming performance review.",
      time: "10:30 AM",
    },
    {
      id: 2,
      sender: "me",
      text: "Sure! When would you like to schedule it?",
      time: "10:32 AM",
    },
    {
      id: 3,
      sender: "other",
      text: "How about tomorrow at 2 PM?",
      time: "10:35 AM",
    },
    {
      id: 4,
      sender: "me",
      text: "That works perfectly. I'll send you a calendar invite.",
      time: "10:36 AM",
    },
    {
      id: 5,
      sender: "other",
      text: "Thanks for the update!",
      time: "10:40 AM",
    },
  ];

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    // Demo only - would send message to backend here
    console.log("Sending message:", messageInput);
    setMessageInput("");
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-dark-dark">Messages</h1>
        <p className="text-body dark:text-body-dark text-sm">
          Team communication (Demo Interface)
        </p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark overflow-hidden flex flex-col">
          <div className="p-4 border-b border-borderLightest dark:border-borderLightest-dark">
            <input
              type="search"
              placeholder="Search conversations..."
              className="w-full px-4 py-2 rounded-lg bg-bgLightest dark:bg-bgBody-dark border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(conv.id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-bgLightest dark:hover:bg-bgBody-dark transition border-b border-borderLightest dark:border-borderLightest-dark ${
                  selectedChat === conv.id ? "bg-bgLightest dark:bg-bgBody-dark" : ""
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {conv.avatar}
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-card dark:border-card-dark rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-dark dark:text-dark-dark text-sm truncate">
                      {conv.name}
                    </h3>
                    <span className="text-xs text-body dark:text-body-dark">{conv.time}</span>
                  </div>
                  <p className="text-xs text-body dark:text-body-dark mb-1">{conv.role}</p>
                  <p className="text-sm text-body dark:text-body-dark truncate">
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-borderLightest dark:border-borderLightest-dark flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {selectedConversation.avatar}
                    </div>
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-card dark:border-card-dark rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-dark dark:text-dark-dark">
                      {selectedConversation.name}
                    </h2>
                    <p className="text-xs text-body dark:text-body-dark">
                      {selectedConversation.online ? "Online" : "Offline"} • {selectedConversation.role}
                    </p>
                  </div>
                </div>
                <button className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bgLightest dark:bg-bgBody-dark">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        message.sender === "me"
                          ? "bg-primary text-white"
                          : "bg-card dark:bg-card-dark text-dark dark:text-dark-dark"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "me" ? "text-white/70" : "text-body dark:text-body-dark"
                        }`}
                      >
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-borderLightest dark:border-borderLightest-dark">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-lg bg-bgLightest dark:bg-bgBody-dark border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark"
                  />
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition font-medium"
                  >
                    Send
                  </button>
                </form>
              </div>
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
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Notice */}
      <div className="mt-4 bg-warning/10 border border-warning rounded-lg p-4">
        <div className="flex items-center gap-2 text-warning">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Demo Interface</span>
        </div>
        <p className="text-sm text-body dark:text-body-dark mt-1">
          This is a UI-only demo for client proposals. No real messaging functionality is implemented.
        </p>
      </div>
    </div>
  );
}

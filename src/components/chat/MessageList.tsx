"use client";
import React, { useEffect, useRef } from "react";
import { Message } from "@/lib/firebase/messages";
import { format, isToday, isYesterday } from "date-fns";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
}

export default function MessageList({
  messages,
  currentUserId,
  loading = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
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

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bgLightest dark:bg-bgBody-dark">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start gap-2 max-w-md">
              {i % 2 !== 0 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse flex-shrink-0" />
              )}
              <div>
                <div className="h-16 w-64 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
              </div>
              {i % 2 === 0 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bgLightest dark:bg-bgBody-dark">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-body dark:text-body-dark mb-4 opacity-50"
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
            No messages yet
          </h3>
          <p className="text-body dark:text-body-dark text-sm">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4 bg-bgLightest dark:bg-bgBody-dark"
    >
      {messages.map((message) => {
        const isSentByMe = message.senderId === currentUserId;
        const avatar = isSentByMe ? message.senderPhoto : message.senderPhoto;
        const name = isSentByMe ? message.senderName : message.senderName;

        return (
          <div
            key={message.id}
            className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex items-start gap-2 max-w-md ${
                isSentByMe ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                    {getInitials(name)}
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    isSentByMe
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-card dark:bg-card-dark text-dark dark:text-dark-dark rounded-tl-none border border-borderLight dark:border-borderLight-dark"
                  }`}
                >
                  {!isSentByMe && (
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                </div>
                <p
                  className={`text-xs mt-1 ${
                    isSentByMe
                      ? "text-right text-body dark:text-body-dark"
                      : "text-left text-body dark:text-body-dark"
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

"use client"

import NotificationSvg from "@/svg/header-svg/Profile/Notification";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useAuthUserContext } from "@/context/UserAuthContext"; // CHANGED THIS
import { useNotifications } from "@/hooks/useNotifications";
import { markNotificationAsRead } from "@/lib/firebase"; // CHANGED THIS
import { formatDistanceToNow } from "date-fns";

type TNotificationProps = {
  handleShowNotification: () => void;
  isOpenNotification: boolean;
};

const Notification = ({
  handleShowNotification,
  isOpenNotification,
}: TNotificationProps) => {
  // CHANGED: Use the correct context hook
  const { user } = useAuthUserContext();
  
  // Add debug logging
  console.log('🔍 Notification Component Debug:');
  console.log('User from context:', user);
  console.log('User UID:', user?.uid);
  
  // Fetch notifications in real-time
  const { notifications, unreadCount, loading } = useNotifications(user?.uid);

  console.log('📊 Notifications:', notifications);
  console.log('📊 Unread Count:', unreadCount);
  console.log('📊 Loading:', loading);

  // Handle notification click
  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markNotificationAsRead(notificationId);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Category badge colors
  const getCategoryColor = (category: string): string => {
    const colors = {
      task: 'bg-blue-100 text-blue-800',
      hr: 'bg-green-100 text-green-800',
      leave: 'bg-yellow-100 text-yellow-800',
      system: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.system;
  };

  return (
    <li>
      <div className="nav-item relative">
        <button id="notifydropdown" className="flex">
          <div className="notification__icon cursor-pointer relative" onClick={handleShowNotification}>
            <NotificationSvg />
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </button>

        {isOpenNotification && (
          <div
            className={`notification__dropdown item-two ${
              isOpenNotification ? "email-enable" : " "
            }`}
          >
            <div className="common-scrollbar h-[420px] overflow-y-auto card__scroll">
              <div className="notification__header">
                <div className="notification__inner">
                  <h5>Notifications</h5>
                  <span>({notifications.length})</span>
                </div>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="p-4 text-center text-gray-500">
                  Loading notifications...
                </div>
              )}

              {/* Empty state */}
              {!loading && notifications.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-2">User ID: {user?.uid}</p>
                </div>
              )}

              {/* Notifications list */}
              {!loading && notifications.map((notification) => (
                <div 
                  className={`notification__item ${!notification.isRead ? 'bg-blue-50' : ''}`} 
                  key={notification.id}
                >
                  <div className="notification__thumb">
                    {notification.image ? (
                      <Image 
                        src={notification.image} 
                        alt={notification.title}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-xs">
                          {notification.category.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="notification__content flex-1">
                    <Link
                      href={notification.link}
                      onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                      className="block"
                    >
                      <h6 className="font-medium text-sm">
                        {notification.title}
                      </h6>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </Link>
                    <div className="notification__time mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(notification.category)}`}>
                        {notification.category}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </li>
  );
};

export default Notification;
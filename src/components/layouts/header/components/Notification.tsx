"use client";

import NotificationSvg from "@/svg/header-svg/Profile/Notification";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { markNotificationAsRead, db } from "@/lib/firebase"; 
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

type TNotificationProps = {
  handleShowNotification: () => void;
  isOpenNotification: boolean;
};

const Notification = ({ handleShowNotification, isOpenNotification }: TNotificationProps) => {
  const { user } = useAuthUserContext();
  const { notifications, unreadCount, loading } = useNotifications(user?.uid);

  // Show only unread. They vanish once clicked/read.
  const unreadOnly = useMemo(() => {
    return notifications.filter((n) => !n.isRead);
  }, [notifications]);

  const handleMarkAllRead = async () => {
    if (!user?.uid || unreadOnly.length === 0) return;
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, "notifications"), 
                where("userId", "==", user.uid), 
                where("isRead", "==", false));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => batch.update(doc.ref, { isRead: true }));
      await batch.commit();
    } catch (err) {
      console.error("Batch update failed:", err);
    }
  };

  const formatTimeAgo = (date: any) => {
    if (!date) return "Just now";
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return isNaN(d.getTime()) ? "Recently" : formatDistanceToNow(d, { addSuffix: true });
  };

  const getCategoryColor = (cat: string) => {
    const colors = {
      hr: 'bg-green-100 text-green-800',
      announcement: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800'
    };
    return colors[cat as keyof typeof colors] || colors.system;
  };

  return (
    <li>
      <div className="nav-item relative">
        <button className="flex" onClick={handleShowNotification}>
          <div className="notification__icon cursor-pointer relative">
            <NotificationSvg />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </button>

        {isOpenNotification && (
          <div className="notification__dropdown item-two email-enable">
            <div className="common-scrollbar h-[420px] overflow-y-auto card__scroll">
              <div className="notification__header flex justify-between items-center p-3 border-b">
                <h5 className="text-sm font-bold">Alerts ({unreadOnly.length})</h5>
                {unreadOnly.length > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] text-blue-600 font-medium hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              {!loading && unreadOnly.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-xs italic">Inbox is empty</div>
              )}

              {unreadOnly.map((n) => (
                <div className="notification__item bg-blue-50 border-b border-white" key={n.id}>
                  <div className="notification__thumb">
                    {n.image ? (
                      <Image src={n.image} alt="user" width={40} height={40} className="rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                        {/* FIX: Crash guard for charAt */}
                        {(n.category?.charAt(0) ?? "N").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="notification__content flex-1">
                    {/* FIX: Crash guard for Link href */}
                    <Link
                      href={n.link || "#"}
                      onClick={() => markNotificationAsRead(n.id)}
                      className="block"
                    >
                      <h6 className="font-semibold text-xs text-gray-800">{n.title || "Notice"}</h6>
                      <p className="text-[11px] text-gray-600 leading-tight mt-1">{n.message}</p>
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-gray-400">{formatTimeAgo(n.createdAt)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${getCategoryColor(n.category || "system")}`}>
                        {n.category || "hr"}
                      </span>
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
// components/dashboard/RecentActivity.tsx
"use client";

import React from 'react';
import { RecentActivity as ActivityType } from '@/types/dashboard';

interface Props {
  activities: ActivityType[];
  title?: string;
}

const RecentActivity: React.FC<Props> = ({ activities, title = "Recent Activity" }) => {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="card__wrapper">
      <div className="p-6 border-b border-gray-100">
        <h5 className="text-lg font-bold text-gray-900">{title}</h5>
      </div>
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <i className="fa-regular fa-inbox text-4xl mb-3" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${activity.color}15` }}
                >
                  <i
                    className={`${activity.icon} text-sm`}
                    style={{ color: activity.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-1">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
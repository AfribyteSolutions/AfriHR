// components/dashboard/StatCard.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { StatCard as StatCardType } from '@/types/dashboard';

interface Props {
  card: StatCardType;
}

const StatCard: React.FC<Props> = ({ card }) => {
  const CardContent = () => (
    <div className="card__wrapper hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <div className="flex items-center justify-between p-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">
            {card.label}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            {card.value}
          </h3>
          {card.trend && (
            <div className="flex items-center gap-1">
              <i
                className={`fa-solid fa-arrow-${card.trend.isPositive ? 'up' : 'down'} text-xs`}
                style={{ color: card.trend.isPositive ? '#10b981' : '#ef4444' }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: card.trend.isPositive ? '#10b981' : '#ef4444' }}
              >
                {Math.abs(card.trend.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={`${card.bgColor} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}
        >
          <i
            className={`${card.icon} text-2xl`}
            style={{ color: card.color }}
          />
        </div>
      </div>
    </div>
  );

  if (card.link) {
    return (
      <Link href={card.link} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

export default StatCard;
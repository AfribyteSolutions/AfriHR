// components/dashboard/QuickActions.tsx
"use client";

import React from 'react';
import { QuickAction } from '@/types/dashboard';

interface Props {
  actions: QuickAction[];
  title?: string;
}

const QuickActions: React.FC<Props> = ({ actions, title = "Quick Actions" }) => {
  return (
    <div className="card__wrapper">
      <div className="p-6 border-b border-gray-100">
        <h5 className="text-lg font-bold text-gray-900">{title}</h5>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-100 hover:border-indigo-500 hover:shadow-md transition-all duration-300 group"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <i
                  className={`${action.icon} text-xl`}
                  style={{ color: action.color }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 text-center">
                {action.label}
              </span>
              {action.description && (
                <span className="text-xs text-gray-500 text-center mt-1">
                  {action.description}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
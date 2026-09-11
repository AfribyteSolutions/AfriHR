"use client";
import React from "react";

export const LoadingState: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
    <span className="text-gray-500">{message}</span>
  </div>
);

export const EmptyState: React.FC<{ title: string; message?: string; action?: React.ReactNode }> = ({ title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <i className="fa-regular fa-folder-open text-2xl text-gray-400"></i>
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
    {message && <p className="text-sm text-gray-500 mb-4 max-w-md">{message}</p>}
    {action}
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
      <i className="fa-solid fa-triangle-exclamation text-2xl text-red-400"></i>
    </div>
    <h3 className="text-lg font-semibold text-gray-700 mb-1">Something went wrong</h3>
    <p className="text-sm text-gray-500 mb-4 max-w-md">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-primary btn-sm">Retry</button>
    )}
  </div>
);

export const StatusBadge: React.FC<{ status: string; variant?: string }> = ({ status, variant }) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    acknowledged: "bg-purple-100 text-purple-800",
    closed: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800",
    on_leave: "bg-yellow-100 text-yellow-800",
    suspended: "bg-orange-100 text-orange-800",
    offboarding: "bg-orange-100 text-orange-800",
    terminated: "bg-red-100 text-red-800",
    preboarding: "bg-blue-100 text-blue-800",
    planned: "bg-blue-100 text-blue-800",
    skipped: "bg-gray-100 text-gray-800",
    published: "bg-green-100 text-green-800",
    closed_job: "bg-gray-100 text-gray-800",
    archived: "bg-gray-100 text-gray-800",
    applied: "bg-blue-100 text-blue-800",
    screening: "bg-purple-100 text-purple-800",
    shortlisted: "bg-indigo-100 text-indigo-800",
    interview: "bg-cyan-100 text-cyan-800",
    offer: "bg-amber-100 text-amber-800",
    hired: "bg-green-100 text-green-800",
    rejected_candidate: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-800",
  };

  const cls = colors[status] || colors[variant || ""] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
};

export const PageHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-6 px-4 pt-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmClass?: string;
}> = ({ open, title, message, onConfirm, onCancel, confirmText = "Confirm", confirmClass = "btn-danger" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn btn-light">Cancel</button>
          <button onClick={onConfirm} className={`btn ${confirmClass}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

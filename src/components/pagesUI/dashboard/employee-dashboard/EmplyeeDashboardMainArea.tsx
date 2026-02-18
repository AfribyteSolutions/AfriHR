"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Company } from "@/types/company";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { DashboardStats, StatCard as StatCardType, QuickAction, RecentActivity as ActivityType } from "@/types/dashboard";

interface IEmployee {
  id: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  position?: string;
  image?: string;
  profilePictureUrl?: string;
  photoURL?: string;
  phone?: string;
}

interface Props {
  company: Company;
}

const EmployeeDashboardMainArea: React.FC<Props> = ({ company }) => {
  const router = useRouter();
  const { user: userData } = useAuthUserContext();
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    documents: 0,
    newDocuments: 0,
    leaves: 0,
    pendingLeaves: 0,
    totalLeaveDays: 0,
    paidPayrolls: 0,
    unpaidPayrolls: 0,
    latestPayslip: null,
    activeWarnings: 0,
    upcomingTrainings: 0,
    unreadFeedback: 0
  });
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    // ✅ FIX: Wait for BOTH company and userData to be ready
    if (!userData?.uid || !company?.id) {
      return;
    }

    try {
      setLoading(true);

      // Fetch employee profile, stats, and activities in parallel
      const [employeeRes, statsRes, activityRes] = await Promise.all([
        fetch(`/api/user-data?uid=${userData.uid}`).then(res => res.json()),
        fetch(`/api/dashboard-stats?uid=${userData.uid}&companyId=${company.id}&role=employee`).then(res => res.json()),
        fetch(`/api/dashboard-activity?uid=${userData.uid}&companyId=${company.id}&role=employee&limit=6`).then(res => res.json())
      ]);

      if (employeeRes.success) setEmployee(employeeRes.user);
      if (statsRes.success) setStats(statsRes.data);
      if (activityRes.success) setActivities(activityRes.data || []);
      
    } catch (err) {
      console.error("Employee Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [userData?.uid, company?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived UI state
  const warningCount = stats.activeWarnings ?? 0;

  const statCards: StatCardType[] = [
    { 
      id: "documents", 
      label: "My Documents", 
      value: stats.documents ?? 0, 
      icon: "fa-solid fa-file-lines", 
      color: "#3b82f6", 
      bgColor: "bg-blue-50 dark:bg-blue-900/20", 
      link: "/document" 
    },
    { 
      id: "leaves", 
      label: "Approved Leaves", 
      value: stats.leaves ?? 0, 
      icon: "fa-solid fa-calendar-check", 
      color: "#10b981", 
      bgColor: "bg-green-50 dark:bg-green-900/20", 
      link: "/hrm/leaves-employee" 
    },
    { 
      id: "trainings", 
      label: "My Trainings", 
      value: stats.upcomingTrainings ?? 0, 
      icon: "fa-solid fa-graduation-cap", 
      color: "#8b5cf6", 
      bgColor: "bg-purple-50 dark:bg-purple-900/20", 
      link: "/hrm/training" 
    },
    { 
      id: "warnings", 
      label: "Warnings", 
      value: warningCount, 
      icon: "fa-solid fa-triangle-exclamation", 
      color: warningCount > 0 ? "#ef4444" : "#10b981", 
      bgColor: warningCount > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20", 
      link: "/hrm/warning" 
    }
  ];

  const quickActions: QuickAction[] = [
    { id: "apply-leave", label: "Apply Leave", icon: "fa-solid fa-calendar-plus", color: "#3b82f6", onClick: () => router.push("/hrm/leaves-employee") },
    { id: "view-payslip", label: "View Payslip", icon: "fa-solid fa-file-invoice-dollar", color: "#10b981", onClick: () => router.push("/payroll/payroll-payslip") },
    { id: "my-training", label: "My Training", icon: "fa-solid fa-graduation-cap", color: "#8b5cf6", onClick: () => router.push("/hrm/training") },
    { id: "view-documents", label: "My Documents", icon: "fa-solid fa-folder-open", color: "#f59e0b", onClick: () => router.push("/document") }
  ];

  // While data is loading OR while we wait for userData context to resolve
  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Synchronizing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app__slide-wrapper h-auto">
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 xl:col-span-9 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => <StatCard key={card.id} card={card} />)}
          </div>

          {stats.latestPayslip && (
            <div className="card__wrapper p-6 h-auto min-h-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Latest Payslip</h3>
                  <p className="text-slate-600 dark:text-slate-400">{stats.latestPayslip.month} {stats.latestPayslip.year}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.latestPayslip.netPay.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stats.latestPayslip.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                    {stats.latestPayslip.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="card__wrapper p-6 h-auto min-h-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Leave Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer transition-colors hover:bg-green-100 dark:hover:bg-green-900/40" onClick={() => router.push("/hrm/leaves-employee")}>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.leaves ?? 0}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">Approved</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg cursor-pointer transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-900/40" onClick={() => router.push("/hrm/leaves-employee")}>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingLeaves ?? 0}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40" onClick={() => router.push("/hrm/leaves-employee")}>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalLeaveDays ?? 0}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">Total Days Taken</p>
              </div>
            </div>
          </div>

          <div className="h-auto min-h-0">
            <RecentActivity activities={activities} title="Recent Updates" />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-6">
          <QuickActions actions={quickActions} title="Quick Actions" />

          <div className="card__wrapper h-auto min-h-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h5 className="text-lg font-bold text-slate-900 dark:text-white">Overview</h5>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">New Documents</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.newDocuments ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Unread Feedback</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.unreadFeedback ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Paid Payrolls</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.paidPayrolls ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Unpaid Payrolls</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{stats.unpaidPayrolls ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardMainArea;
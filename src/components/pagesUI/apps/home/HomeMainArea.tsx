// components/pagesUI/dashboard/hrm-dashboard/HRMDashboardMainArea.tsx
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
  role?: string;
}

interface Props {
  company: Company;
}

const HRMDashboardMainArea: React.FC<Props> = ({ company }) => {
  const router = useRouter();
  const { user: userData } = useAuthUserContext();
  const [manager, setManager] = useState<IEmployee | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0, presentToday: 0, onLeave: 0, pendingApprovals: 0,
    activeProjects: 0, completedProjects: 0, paidPayrolls: 0, unpaidPayrolls: 0,
    totalFeedback: 0, pendingFeedback: 0, totalDocuments: 0, upcomingTraining: 0,
    ongoingTraining: 0, activeWarnings: 0, totalPromotions: 0, recentPromotions: 0,
    totalExpense: 0, paidExpense: 0, unpaidExpense: 0
  });
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!company?.id) return;
    try {
      setLoading(true);

      // Fetch manager profile if uid is available
      if (userData?.uid) {
        const managerRes = await fetch(`/api/user-data?uid=${userData.uid}`);
        const managerResult = await managerRes.json();
        if (managerResult.success) {
          setManager(managerResult.user);
        }
      }

      // Fetch stats
      const statsRes = await fetch(`/api/dashboard-stats?companyId=${company.id}&role=manager&uid=${userData?.uid || 'admin'}`);
      const statsResult = await statsRes.json();
      if (statsResult.success) setStats(statsResult.data);

      // Fetch activities
      const activityRes = await fetch(`/api/dashboard-activity?companyId=${company.id}&role=manager&limit=8`);
      const activityResult = await activityRes.json();
      if (activityResult.success) setActivities(activityResult.data || []);
    } catch (err) {
      console.error("Manager Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  }, [company?.id, userData?.uid]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const managerName = 
    manager?.fullName || 
    manager?.name || 
    manager?.displayName || 
    (userData as any)?.displayName || 
    "Manager";
  
  const managerImage = 
    manager?.photoURL || 
    manager?.profilePictureUrl || 
    manager?.image || 
    (userData as any)?.photoURL;

  const employeeCards: StatCardType[] = [
    { id: "total-employees", label: "Total Employees", value: stats.totalEmployees ?? 0, icon: "fa-solid fa-users", color: "#3b82f6", bgColor: "bg-blue-50", link: "/hrm/employee" },
    { id: "present-today", label: "Present Today", value: stats.presentToday ?? 0, icon: "fa-solid fa-user-check", color: "#10b981", bgColor: "bg-green-50", link: "/hrm/attendance" },
    { id: "on-leave", label: "On Leave", value: stats.onLeave ?? 0, icon: "fa-solid fa-calendar-xmark", color: "#f59e0b", bgColor: "bg-orange-50", link: "/hrm/leaves-employee" },
    { id: "pending-approvals", label: "Pending Approvals", value: stats.pendingApprovals ?? 0, icon: "fa-solid fa-clock", color: "#ef4444", bgColor: "bg-red-50", link: "/hrm/leaves" }
  ];

  const projectCards: StatCardType[] = [
    { id: "active-projects", label: "Active Projects", value: stats.activeProjects ?? 0, icon: "fa-solid fa-diagram-project", color: "#8b5cf6", bgColor: "bg-purple-50", link: "/project" },
    { id: "completed-projects", label: "Completed Projects", value: stats.completedProjects ?? 0, icon: "fa-solid fa-circle-check", color: "#10b981", bgColor: "bg-green-50", link: "/project" }
  ];

  const hrCards: StatCardType[] = [
    { id: "unpaid-payrolls", label: "Unpaid Payrolls", value: stats.unpaidPayrolls ?? 0, icon: "fa-solid fa-money-bill-wave", color: "#f59e0b", bgColor: "bg-orange-50", link: "/payroll/payroll" },
    { id: "paid-payrolls", label: "Paid Payrolls", value: stats.paidPayrolls ?? 0, icon: "fa-solid fa-circle-check", color: "#10b981", bgColor: "bg-green-50", link: "/payroll/payroll" },
    { id: "pending-feedback", label: "Pending Feedback", value: stats.pendingFeedback ?? 0, icon: "fa-solid fa-comments", color: "#3b82f6", bgColor: "bg-blue-50", link: "/feedback" },
    { id: "total-documents", label: "Total Documents", value: stats.totalDocuments ?? 0, icon: "fa-solid fa-file-lines", color: "#8b5cf6", bgColor: "bg-purple-50", link: "/document" },
    { id: "upcoming-training", label: "Upcoming Training", value: stats.upcomingTraining ?? 0, icon: "fa-solid fa-graduation-cap", color: "#06b6d4", bgColor: "bg-cyan-50", link: "/training" },
    { id: "active-warnings", label: "Active Warnings", value: stats.activeWarnings ?? 0, icon: "fa-solid fa-triangle-exclamation", color: "#ef4444", bgColor: "bg-red-50", link: "/hrm/warning" }
  ];

  const quickActions: QuickAction[] = [
    { id: "add-employee", label: "Add Employee", icon: "fa-solid fa-user-plus", color: "#3b82f6", onClick: () => router.push("/hrm/add-employee") },
    { id: "process-payroll", label: "Process Payroll", icon: "fa-solid fa-money-bill-1", color: "#10b981", onClick: () => router.push("/payroll/payroll") },
    { id: "approve-leaves", label: "Approve Leaves", icon: "fa-solid fa-clipboard-check", color: "#f59e0b", onClick: () => router.push("/hrm/leaves") },
    { id: "create-announcement", label: "Announcement", icon: "fa-solid fa-bullhorn", color: "#8b5cf6", onClick: () => router.push("/announcement") },
    { id: "view-reports", label: "View Reports", icon: "fa-solid fa-chart-line", color: "#06b6d4", onClick: () => router.push("/hrm/reports") },
    { id: "manage-training", label: "Training", icon: "fa-solid fa-chalkboard-user", color: "#ec4899", onClick: () => router.push("/training") }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app__slide-wrapper h-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {managerImage && (
            <img 
              src={managerImage} 
              alt={managerName}
              className="w-16 h-16 rounded-full object-cover border-4 border-indigo-100"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {managerName}! 👋</h1>
            <p className="text-gray-600 mt-1">
              {manager?.position || manager?.role || "Manager"} · {company?.name || "your organization"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 xl:col-span-9">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-users text-indigo-600" />
              Employee Management
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {employeeCards.map((card) => <StatCard key={card.id} card={card} />)}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-diagram-project text-indigo-600" />
              Project Management
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projectCards.map((card) => <StatCard key={card.id} card={card} />)}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-briefcase text-indigo-600" />
              HR Operations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hrCards.map((card) => <StatCard key={card.id} card={card} />)}
            </div>
          </div>

          <div className="h-auto overflow-visible">
            <RecentActivity activities={activities} title="Recent System Activity" />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-6">
          <QuickActions actions={quickActions} title="Quick Actions" />

          <div className="card__wrapper h-auto">
            <div className="p-6 border-b border-gray-100">
              <h5 className="text-lg font-bold text-gray-900">Company Info</h5>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Promotions</span>
                <span className="text-lg font-bold text-gray-900">{stats.totalPromotions ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Recent Promotions</span>
                <span className="text-lg font-bold text-gray-900">{stats.recentPromotions ?? 0}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Expenses</span>
                    <span className="font-semibold text-gray-900">${((stats.totalExpense ?? 0).toLocaleString())}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Unpaid Expenses</span>
                    <span className="font-semibold text-red-600">${((stats.unpaidExpense ?? 0).toLocaleString())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRMDashboardMainArea;
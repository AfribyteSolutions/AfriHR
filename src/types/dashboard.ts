// types/dashboard.ts

export interface DashboardStats {
    // Employee Stats
    documents?: number;
    newDocuments?: number;
    leaves?: number;
    pendingLeaves?: number;
    totalLeaveDays?: number;
    paidPayrolls?: number;
    unpaidPayrolls?: number;
    latestPayslip?: {
      month: string;
      year: number;
      netPay: number;
      status: string;
    } | null;
    activeWarnings?: number;
    upcomingTrainings?: number;
    unreadFeedback?: number;
    
    // Manager Stats
    totalEmployees?: number;
    presentToday?: number;
    onLeave?: number;
    pendingApprovals?: number;
    activeProjects?: number;
    completedProjects?: number;
    totalFeedback?: number;
    pendingFeedback?: number;
    totalDocuments?: number;
    upcomingTraining?: number;
    ongoingTraining?: number;
    totalPromotions?: number;
    recentPromotions?: number;
    totalExpense?: number;
    paidExpense?: number;
    unpaidExpense?: number;
  }
  
  export interface StatCard {
    id: string;
    label: string;
    value: number;
    icon: string;
    color: string;
    bgColor: string;
    trend?: {
      value: number;
      isPositive: boolean;
    };
    link?: string;
  }
  
  export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    color: string;
    onClick: () => void;
    description?: string;
  }
  
  export interface RecentActivity {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    icon: string;
    color: string;
  }
"use client";
import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Company, PlanType } from "@/types/company";
import {
  PLANS,
  PlanFeatures,
  canAccessFeature,
  getEmployeeLimit,
  isWithinEmployeeLimit,
} from "@/config/plans";

interface UsePlanRestrictionsResult {
  plan: PlanType;
  planName: string;
  isLoading: boolean;
  error: string | null;

  // Company data
  company: Company | null;
  employeeCount: number;
  employeeLimit: number;

  // Feature access checks
  canAccess: (feature: keyof PlanFeatures) => boolean;
  canAddEmployee: () => boolean;
  getRemainingEmployees: () => number;

  // Subscription status
  isSubscriptionActive: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  subscriptionEndDate: string | null;

  // Upgrade prompts
  needsUpgrade: (feature: keyof PlanFeatures) => boolean;
  getUpgradeMessage: (feature: keyof PlanFeatures) => string;
  getUpgradePlan: (feature: keyof PlanFeatures) => PlanType | null;
}

export function usePlanRestrictions(companyId: string | null): UsePlanRestrictionsResult {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch company data with real-time updates
  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    const companyRef = doc(db, "companies", companyId);

    const unsubscribe = onSnapshot(
      companyRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCompany({
            id: snapshot.id,
            ...data,
            plan: data.plan || "starter",
          } as Company);
        } else {
          setCompany(null);
          setError("Company not found");
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching company:", err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId]);

  const plan: PlanType = company?.plan || "starter";
  const planConfig = PLANS[plan];
  const planName = planConfig?.name || "Starter";

  const employeeCount = company?.employeeCount || 0;
  const employeeLimit = company?.employeeLimit ?? getEmployeeLimit(plan);

  // Check if subscription is active
  const isSubscriptionActive = (() => {
    if (plan === "starter") return true; // Free plan is always active
    if (!company?.subscription) return false;
    return company.subscription.status === "active" || company.subscription.status === "trialing";
  })();

  // Check if in trial period
  const isTrialing = company?.subscription?.status === "trialing";

  // Calculate trial days remaining
  const trialDaysRemaining = (() => {
    if (!company?.trialEndsAt) return null;
    const trialEnd = new Date(company.trialEndsAt);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  })();

  // Get subscription end date
  const subscriptionEndDate = company?.subscription?.currentPeriodEnd || null;

  // Feature access check
  const canAccess = useCallback(
    (feature: keyof PlanFeatures): boolean => {
      if (!isSubscriptionActive && plan !== "starter") return false;
      return canAccessFeature(plan, feature);
    },
    [plan, isSubscriptionActive]
  );

  // Check if can add more employees
  const canAddEmployee = useCallback((): boolean => {
    if (!isSubscriptionActive && plan !== "starter") return false;
    return isWithinEmployeeLimit(plan, employeeCount);
  }, [plan, employeeCount, isSubscriptionActive]);

  // Get remaining employee slots
  const getRemainingEmployees = useCallback((): number => {
    const limit = getEmployeeLimit(plan);
    if (limit === -1) return Infinity; // Unlimited
    return Math.max(0, limit - employeeCount);
  }, [plan, employeeCount]);

  // Check if feature needs upgrade
  const needsUpgrade = useCallback(
    (feature: keyof PlanFeatures): boolean => {
      return !canAccessFeature(plan, feature);
    },
    [plan]
  );

  // Get upgrade message for a feature
  const getUpgradeMessage = useCallback(
    (feature: keyof PlanFeatures): string => {
      const upgradePlan = getUpgradePlan(feature);
      if (!upgradePlan) return "";

      const featureMessages: Record<string, string> = {
        payrollManagement: "Upgrade to Professional to manage payroll",
        performanceReviews: "Upgrade to Professional for performance reviews",
        advancedAnalytics: "Upgrade to Professional for advanced analytics",
        customWorkflows: "Upgrade to Professional for custom workflows",
        mobileAppAccess: "Upgrade to Professional for mobile app access",
        apiAccess: "Upgrade to Business for API access",
        customIntegrations: "Upgrade to Business for custom integrations",
        dedicatedAccountManager: "Upgrade to Enterprise for a dedicated account manager",
        whiteLabelOptions: "Upgrade to Enterprise for white-label options",
        slaGuarantee: "Upgrade to Business for SLA guarantees",
        onPremiseDeployment: "Upgrade to Enterprise for on-premise deployment",
        phoneSupport: "Upgrade to Business for 24/7 phone support",
        trainingModule: "Upgrade to Business for the training module",
        recruitmentModule: "Upgrade to Professional for recruitment features",
      };

      return featureMessages[feature] || `Upgrade to ${PLANS[upgradePlan].name} to access this feature`;
    },
    [plan]
  );

  // Get the minimum plan needed for a feature
  const getUpgradePlan = useCallback(
    (feature: keyof PlanFeatures): PlanType | null => {
      const planOrder: PlanType[] = ["starter", "professional", "business", "enterprise"];
      const currentIndex = planOrder.indexOf(plan);

      for (let i = currentIndex + 1; i < planOrder.length; i++) {
        const checkPlan = planOrder[i];
        if (canAccessFeature(checkPlan, feature)) {
          return checkPlan;
        }
      }

      return null;
    },
    [plan]
  );

  return {
    plan,
    planName,
    isLoading,
    error,
    company,
    employeeCount,
    employeeLimit,
    canAccess,
    canAddEmployee,
    getRemainingEmployees,
    isSubscriptionActive,
    isTrialing,
    trialDaysRemaining,
    subscriptionEndDate,
    needsUpgrade,
    getUpgradeMessage,
    getUpgradePlan,
  };
}

// Context for plan restrictions (for use throughout the app)
import { createContext, useContext, ReactNode } from "react";

interface PlanContextType extends UsePlanRestrictionsResult {}

const PlanContext = createContext<PlanContextType | null>(null);

export function PlanProvider({
  children,
  companyId,
}: {
  children: ReactNode;
  companyId: string | null;
}) {
  const planRestrictions = usePlanRestrictions(companyId);

  return (
    <PlanContext.Provider value={planRestrictions}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextType {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within a PlanProvider");
  }
  return context;
}

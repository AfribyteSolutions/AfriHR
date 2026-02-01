"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePlanRestrictions } from "@/hooks/usePlanRestrictions.tsx";
import { PLANS } from "@/config/plans";

interface PlanUpgradeBannerProps {
  companyId: string | null;
}

export const PlanUpgradeBanner: React.FC<PlanUpgradeBannerProps> = ({ companyId }) => {
  const [dismissed, setDismissed] = useState(false);

  const {
    plan,
    planName,
    isLoading,
    employeeCount,
    employeeLimit,
    isTrialing,
    trialDaysRemaining,
    isSubscriptionActive,
  } = usePlanRestrictions(companyId);

  if (isLoading || dismissed) return null;

  // Show trial expiring warning
  if (isTrialing && trialDaysRemaining !== null && trialDaysRemaining <= 7) {
    return (
      <div className="bg-gradient-to-r from-warning/90 to-warning text-white px-4 py-3 flex items-center justify-between mb-4 rounded-xl">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-semibold">Trial Ending Soon!</span>
            <span className="ml-2 opacity-90">
              Your trial expires in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""}.
              Add a payment method to continue using premium features.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/checkout?plan=${plan}&billing=monthly&companyId=${companyId}`}
            className="bg-white text-warning px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition whitespace-nowrap"
          >
            Add Payment
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Show employee limit warning for starter plan
  if (plan === "starter" && employeeLimit !== -1) {
    const usagePercent = (employeeCount / employeeLimit) * 100;

    if (usagePercent >= 80) {
      return (
        <div className="bg-gradient-to-r from-primary to-[#003cff] text-white px-4 py-3 flex items-center justify-between mb-4 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <span className="font-semibold">
                {usagePercent >= 100 ? "Employee Limit Reached!" : "Approaching Employee Limit"}
              </span>
              <span className="ml-2 opacity-90">
                You have {employeeCount} of {employeeLimit} employees.
                {usagePercent >= 100
                  ? " Upgrade now to add more team members."
                  : " Upgrade to Professional for unlimited employees."}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/checkout?plan=professional&billing=monthly"
              className="bg-white text-primary px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition whitespace-nowrap"
            >
              Upgrade Now
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/20 rounded transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      );
    }
  }

  // Show subscription inactive warning
  if (!isSubscriptionActive && plan !== "starter") {
    return (
      <div className="bg-danger text-white px-4 py-3 flex items-center justify-between mb-4 rounded-xl">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span className="font-semibold">Subscription Inactive</span>
            <span className="ml-2 opacity-90">
              Your subscription has expired. Please renew to continue using premium features.
            </span>
          </div>
        </div>
        <Link
          href={`/checkout?plan=${plan}&billing=monthly&companyId=${companyId}`}
          className="bg-white text-danger px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition whitespace-nowrap"
        >
          Renew Subscription
        </Link>
      </div>
    );
  }

  // Show upgrade prompt for starter plan (low-key)
  if (plan === "starter") {
    return (
      <div className="bg-bgLightest dark:bg-bgBody-dark border border-borderLightest dark:border-borderLightest-dark px-4 py-3 flex items-center justify-between mb-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="font-medium text-dark dark:text-dark-dark">You&apos;re on the Free Plan</span>
            <span className="ml-2 text-body dark:text-body-dark text-sm">
              Upgrade to unlock payroll, analytics, and unlimited employees.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition whitespace-nowrap"
          >
            View Plans
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-borderLight/30 rounded transition text-body"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// Compact version for sidebar
export const PlanBadge: React.FC<{ companyId: string | null }> = ({ companyId }) => {
  const { plan, planName, isTrialing, trialDaysRemaining } = usePlanRestrictions(companyId);

  const planConfig = PLANS[plan];

  return (
    <div className="px-4 py-3 border-t border-borderLightest dark:border-borderLightest-dark">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-body dark:text-body-dark uppercase tracking-wide">
          Current Plan
        </span>
        {isTrialing && (
          <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded">
            Trial
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-dark dark:text-dark-dark">{planName}</span>
          {isTrialing && trialDaysRemaining !== null && (
            <span className="text-xs text-body dark:text-body-dark block">
              {trialDaysRemaining} days left
            </span>
          )}
        </div>
        {plan !== "enterprise" && (
          <Link
            href="/pricing"
            className="text-xs text-primary hover:underline"
          >
            Upgrade
          </Link>
        )}
      </div>
    </div>
  );
};

export default PlanUpgradeBanner;

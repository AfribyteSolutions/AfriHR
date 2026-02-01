"use client";
import React from "react";
import Link from "next/link";
import { PlanType } from "@/types/company";
import { PLANS } from "@/config/plans";

interface UpgradePromptProps {
  feature: string;
  message?: string;
  targetPlan?: PlanType;
  variant?: "banner" | "card" | "inline" | "modal";
  onClose?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  message,
  targetPlan = "professional",
  variant = "card",
  onClose,
}) => {
  const plan = PLANS[targetPlan];
  const price = plan.monthlyPrice / 100;

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-primary to-[#003cff] text-white px-4 py-3 flex items-center justify-between rounded-lg">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium">
            {message || `Upgrade to ${plan.name} to access ${feature}`}
          </span>
        </div>
        <Link
          href={`/checkout?plan=${targetPlan}&billing=monthly`}
          className="bg-white text-primary px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <span className="text-warning">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </span>
        <span className="text-body dark:text-body-dark">{message || `Requires ${plan.name} plan`}</span>
        <Link href={`/checkout?plan=${targetPlan}&billing=monthly`} className="text-primary hover:underline font-medium">
          Upgrade
        </Link>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card dark:bg-card-dark rounded-2xl p-6 max-w-md w-full shadow-xl">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-body hover:text-dark dark:hover:text-dark-dark"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-dark dark:text-dark-dark mb-2">
              Upgrade to {plan.name}
            </h3>

            <p className="text-body dark:text-body-dark mb-6">
              {message || `Unlock ${feature} and more powerful features with ${plan.name} plan.`}
            </p>

            <div className="bg-bgLightest dark:bg-bgBody-dark rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-dark dark:text-dark-dark">
                ${price}
                <span className="text-sm font-normal text-body dark:text-body-dark">/employee/month</span>
              </div>
              {plan.trialDays > 0 && (
                <div className="text-sm text-secondary mt-1">
                  {plan.trialDays}-day free trial included
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Link
                href={`/checkout?plan=${targetPlan}&billing=monthly`}
                className="block w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-medium"
              >
                Upgrade Now
              </Link>
              {onClose && (
                <button
                  onClick={onClose}
                  className="block w-full text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark py-2"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className="bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark p-6 text-center">
      <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-warning" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-dark dark:text-dark-dark mb-2">
        {feature} Locked
      </h3>

      <p className="text-sm text-body dark:text-body-dark mb-4">
        {message || `Upgrade to ${plan.name} to unlock this feature.`}
      </p>

      <Link
        href={`/checkout?plan=${targetPlan}&billing=monthly`}
        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Upgrade to {plan.name}
      </Link>
    </div>
  );
};

// Feature gate component - wraps content that requires a certain feature
interface FeatureGateProps {
  feature: keyof import("@/config/plans").PlanFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  canAccess: boolean;
  targetPlan?: PlanType;
  message?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  canAccess,
  targetPlan = "professional",
  message,
}) => {
  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradePrompt
      feature={String(feature)}
      targetPlan={targetPlan}
      message={message}
      variant="card"
    />
  );
};

export default UpgradePrompt;

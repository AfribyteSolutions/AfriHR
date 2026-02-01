"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { usePlanRestrictions } from "@/hooks/usePlanRestrictions.tsx";
import { PLANS, formatPrice, FEATURE_LABELS, PlanFeatures } from "@/config/plans";
import { PlanType, PaymentRecord } from "@/types/company";

export default function SubscriptionPage() {
  const { user } = useAuthUserContext();
  const companyId = user?.companyId || null;

  const {
    plan,
    planName,
    isLoading,
    company,
    employeeCount,
    employeeLimit,
    isSubscriptionActive,
    isTrialing,
    trialDaysRemaining,
    subscriptionEndDate,
    canAccess,
  } = usePlanRestrictions(companyId);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const planConfig = PLANS[plan] || PLANS.starter; // Fallback to starter if plan is invalid
  const subscription = company?.subscription;

  // Fetch payment history
  useEffect(() => {
    const fetchPayments = async () => {
      if (!companyId) return;

      try {
        const response = await fetch(`/api/payments/subscription?companyId=${companyId}`);
        const data = await response.json();
        setPayments(data.payments || []);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [companyId]);

  const handleCancelSubscription = async () => {
    if (!companyId) return;

    setCancelLoading(true);
    try {
      const response = await fetch("/api/payments/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, action: "cancel" }),
      });

      if (response.ok) {
        setShowCancelModal(false);
        // Refresh page to get updated data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!companyId) return;

    try {
      await fetch("/api/payments/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, action: "resume" }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Error resuming subscription:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark dark:text-dark-dark mb-2">
          Subscription & Billing
        </h1>
        <p className="text-body dark:text-body-dark">
          Manage your subscription, view usage, and update billing information.
        </p>
      </div>

      {/* Trial Banner */}
      {isTrialing && trialDaysRemaining !== null && (
        <div className="bg-warning/10 border border-warning rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-medium text-dark dark:text-dark-dark">Trial Period</span>
              <span className="text-body dark:text-body-dark ml-2">
                {trialDaysRemaining} days remaining
              </span>
            </div>
          </div>
          <Link
            href={`/checkout?plan=${plan}&billing=monthly&companyId=${companyId}`}
            className="bg-warning text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-warning/90 transition"
          >
            Add Payment Method
          </Link>
        </div>
      )}

      {/* Cancellation Banner */}
      {subscription?.cancelAtPeriodEnd && (
        <div className="bg-danger/10 border border-danger rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-medium text-dark dark:text-dark-dark">Subscription Canceling</span>
              <span className="text-body dark:text-body-dark ml-2">
                Access until {new Date(subscriptionEndDate!).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={handleResumeSubscription}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            Resume Subscription
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-2">
          <div className="bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-dark dark:text-dark-dark mb-1">
                  Current Plan
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{planName}</span>
                  {planConfig?.popular && (
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
              </div>
              {plan !== "enterprise" && (
                <Link
                  href="/pricing"
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Change Plan
                </Link>
              )}
            </div>

            {/* Plan Details */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-bgLightest dark:bg-bgBody-dark rounded-lg p-4">
                <div className="text-sm text-body dark:text-body-dark mb-1">Price</div>
                <div className="text-xl font-bold text-dark dark:text-dark-dark">
                  {planConfig.monthlyPrice === 0
                    ? "Free"
                    : `${formatPrice(planConfig.monthlyPrice, "USD")}/employee/mo`}
                </div>
              </div>
              <div className="bg-bgLightest dark:bg-bgBody-dark rounded-lg p-4">
                <div className="text-sm text-body dark:text-body-dark mb-1">Billing Cycle</div>
                <div className="text-xl font-bold text-dark dark:text-dark-dark capitalize">
                  {subscription?.billingCycle || "Monthly"}
                </div>
              </div>
              <div className="bg-bgLightest dark:bg-bgBody-dark rounded-lg p-4">
                <div className="text-sm text-body dark:text-body-dark mb-1">Employees</div>
                <div className="text-xl font-bold text-dark dark:text-dark-dark">
                  {employeeCount} / {employeeLimit === -1 ? "Unlimited" : employeeLimit}
                </div>
              </div>
              <div className="bg-bgLightest dark:bg-bgBody-dark rounded-lg p-4">
                <div className="text-sm text-body dark:text-body-dark mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSubscriptionActive ? "bg-success" : "bg-danger"
                    }`}
                  />
                  <span className="text-xl font-bold text-dark dark:text-dark-dark capitalize">
                    {isTrialing ? "Trial" : subscription?.status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Billing */}
            {subscriptionEndDate && !subscription?.cancelAtPeriodEnd && (
              <div className="text-sm text-body dark:text-body-dark border-t border-borderLightest dark:border-borderLightest-dark pt-4">
                Next billing date:{" "}
                <span className="font-medium text-dark dark:text-dark-dark">
                  {new Date(subscriptionEndDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Cancel Button */}
            {subscription && !subscription.cancelAtPeriodEnd && plan !== "starter" && (
              <div className="mt-4 pt-4 border-t border-borderLightest dark:border-borderLightest-dark">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-danger hover:underline text-sm"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark p-6 mt-6">
            <h3 className="text-lg font-semibold text-dark dark:text-dark-dark mb-4">
              Your Plan Features
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.keys(planConfig.features) as (keyof PlanFeatures)[]).map((feature) => {
                const hasFeature = canAccess(feature);
                const label = FEATURE_LABELS[feature];

                if (feature === "employeeLimit") return null;

                return (
                  <div
                    key={feature}
                    className={`flex items-center gap-2 text-sm ${
                      hasFeature
                        ? "text-dark dark:text-dark-dark"
                        : "text-borderLight dark:text-borderLight-dark"
                    }`}
                  >
                    {hasFeature ? (
                      <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <div className="bg-card dark:bg-card-dark rounded-xl border border-borderLightest dark:border-borderLightest-dark p-6">
            <h3 className="text-lg font-semibold text-dark dark:text-dark-dark mb-4">
              Payment History
            </h3>

            {loadingPayments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-body dark:text-body-dark">
                <svg className="w-12 h-12 mx-auto mb-3 text-borderLight dark:text-borderLight-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No payment history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b border-borderLightest dark:border-borderLightest-dark last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-dark dark:text-dark-dark">
                        {formatPrice(payment.amount, payment.currency as "USD" | "XAF")}
                      </div>
                      <div className="text-xs text-body dark:text-body-dark">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === "succeeded"
                          ? "bg-success/10 text-success"
                          : payment.status === "pending"
                          ? "bg-warning/10 text-warning"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upgrade CTA */}
          {plan !== "enterprise" && (
            <div className="bg-gradient-to-br from-primary to-[#003cff] rounded-xl p-6 mt-6 text-white">
              <h3 className="font-semibold mb-2">Need More Features?</h3>
              <p className="text-sm text-white/80 mb-4">
                Upgrade your plan to unlock advanced features and grow your team.
              </p>
              <Link
                href="/pricing"
                className="block w-full text-center bg-white text-primary py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                View All Plans
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card dark:bg-card-dark rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-dark dark:text-dark-dark mb-2">
              Cancel Subscription?
            </h3>
            <p className="text-body dark:text-body-dark mb-6">
              Your subscription will remain active until{" "}
              {subscriptionEndDate && new Date(subscriptionEndDate).toLocaleDateString()}.
              After that, you'll be downgraded to the free Starter plan.
            </p>

            <div className="bg-warning/10 rounded-lg p-4 mb-6">
              <div className="font-medium text-dark dark:text-dark-dark mb-2">
                You'll lose access to:
              </div>
              <ul className="text-sm text-body dark:text-body-dark space-y-1">
                <li>• Unlimited employees (limited to 10)</li>
                <li>• Payroll management</li>
                <li>• Performance reviews</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark py-2 rounded-lg hover:bg-bgLightest dark:hover:bg-bgBody-dark transition"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 bg-danger text-white py-2 rounded-lg hover:bg-danger/90 transition disabled:opacity-50"
              >
                {cancelLoading ? "Canceling..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

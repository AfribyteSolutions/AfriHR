"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { PLANS, formatPrice, calculatePrice } from "@/config/plans";
import { PlanType, BillingCycle } from "@/types/company";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planId = (searchParams.get("plan") || "professional") as PlanType;
  const initialBillingCycle = (searchParams.get("billing") || "monthly") as BillingCycle;
  const companyId = searchParams.get("companyId") || "";

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [employeeCount, setEmployeeCount] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "fapshi">("stripe");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = PLANS[planId];

  if (!plan || plan.contactSales) {
    return (
      <div className="min-h-screen bg-bgBody flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-dark mb-4">Contact Sales</h1>
          <p className="text-body mb-6">
            Enterprise plans require custom pricing. Please contact our sales team.
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }

  const usdTotal = calculatePrice(planId, billingCycle, employeeCount, "USD");
  const xafTotal = calculatePrice(planId, billingCycle, employeeCount, "XAF");

  const handleStripeCheckout = async () => {
    if (!companyId) {
      setError("Please sign in to continue with checkout");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          planId,
          billingCycle,
          employeeCount,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout?plan=${planId}&billing=${billingCycle}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe && data.sessionId) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFapshiCheckout = async () => {
    if (!companyId) {
      setError("Please sign in to continue with checkout");
      return;
    }

    if (!phoneNumber) {
      setError("Please enter your mobile money phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/fapshi/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          planId,
          billingCycle,
          employeeCount,
          phoneNumber,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout?plan=${planId}&billing=${billingCycle}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate payment");
      }

      // Redirect to Fapshi payment page
      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (paymentMethod === "stripe") {
      handleStripeCheckout();
    } else {
      handleFapshiCheckout();
    }
  };

  return (
    <div className="min-h-screen bg-bgBody dark:bg-bgBody-dark">
      {/* Header */}
      <header className="bg-card dark:bg-card-dark border-b border-borderLightest dark:border-borderLightest-dark">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-dark dark:text-dark-dark">AfriHR</span>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="text-body hover:text-dark dark:hover:text-dark-dark transition"
            >
              Back to Pricing
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-dark dark:text-dark-dark mb-2 text-center">
            Complete Your Purchase
          </h1>
          <p className="text-body dark:text-body-dark text-center mb-8">
            Subscribe to AfriHR {plan.name} Plan
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-card dark:bg-card-dark rounded-xl p-6 border border-borderLightest dark:border-borderLightest-dark">
              <h2 className="text-xl font-bold text-dark dark:text-dark-dark mb-6">
                Order Summary
              </h2>

              <div className="space-y-4">
                {/* Plan */}
                <div className="flex justify-between items-center pb-4 border-b border-borderLightest dark:border-borderLightest-dark">
                  <div>
                    <div className="font-medium text-dark dark:text-dark-dark">{plan.name} Plan</div>
                    <div className="text-sm text-body dark:text-body-dark">{plan.description}</div>
                  </div>
                  {plan.popular && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded">
                      POPULAR
                    </span>
                  )}
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-dark-dark mb-2">
                    Billing Cycle
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBillingCycle("monthly")}
                      className={`flex-1 py-2 px-4 rounded-lg border transition ${
                        billingCycle === "monthly"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-borderLight dark:border-borderLight-dark text-body dark:text-body-dark hover:border-primary"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle("annual")}
                      className={`flex-1 py-2 px-4 rounded-lg border transition ${
                        billingCycle === "annual"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-borderLight dark:border-borderLight-dark text-body dark:text-body-dark hover:border-primary"
                      }`}
                    >
                      Annual
                      <span className="ml-1 text-xs text-success">Save 20%</span>
                    </button>
                  </div>
                </div>

                {/* Employee Count */}
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-dark-dark mb-2">
                    Number of Employees
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setEmployeeCount(Math.max(1, employeeCount - 1))}
                      className="w-10 h-10 rounded-lg border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark hover:border-primary transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-10 text-center border border-borderLight dark:border-borderLight-dark rounded-lg bg-transparent text-dark dark:text-dark-dark"
                    />
                    <button
                      onClick={() => setEmployeeCount(employeeCount + 1)}
                      className="w-10 h-10 rounded-lg border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark hover:border-primary transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-borderLightest dark:border-borderLightest-dark space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-body dark:text-body-dark">
                      {formatPrice(
                        billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice,
                        "USD"
                      )} x {employeeCount} employees
                    </span>
                  </div>
                  {billingCycle === "annual" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-body dark:text-body-dark">x 12 months</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span className="text-dark dark:text-dark-dark">Total</span>
                    <div className="text-right">
                      <div className="text-primary">{formatPrice(usdTotal, "USD")}</div>
                      <div className="text-sm text-body dark:text-body-dark">
                        ~{formatPrice(xafTotal, "XAF")}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-body dark:text-body-dark">
                    {billingCycle === "annual" ? "Billed annually" : "Billed monthly"}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card dark:bg-card-dark rounded-xl p-6 border border-borderLightest dark:border-borderLightest-dark">
              <h2 className="text-xl font-bold text-dark dark:text-dark-dark mb-6">
                Payment Method
              </h2>

              <div className="space-y-4">
                {/* Stripe Option */}
                <button
                  onClick={() => setPaymentMethod("stripe")}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-4 ${
                    paymentMethod === "stripe"
                      ? "border-primary bg-primary/5"
                      : "border-borderLight dark:border-borderLight-dark hover:border-primary/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "stripe" ? "border-primary" : "border-borderLight dark:border-borderLight-dark"
                  }`}>
                    {paymentMethod === "stripe" && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-dark dark:text-dark-dark">
                      Credit / Debit Card
                    </div>
                    <div className="text-sm text-body dark:text-body-dark">
                      Visa, Mastercard, American Express
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      VISA
                    </div>
                    <div className="w-8 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
                      MC
                    </div>
                  </div>
                </button>

                {/* Fapshi Option */}
                <button
                  onClick={() => setPaymentMethod("fapshi")}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-4 ${
                    paymentMethod === "fapshi"
                      ? "border-primary bg-primary/5"
                      : "border-borderLight dark:border-borderLight-dark hover:border-primary/50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "fapshi" ? "border-primary" : "border-borderLight dark:border-borderLight-dark"
                  }`}>
                    {paymentMethod === "fapshi" && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-dark dark:text-dark-dark">
                      Mobile Money
                    </div>
                    <div className="text-sm text-body dark:text-body-dark">
                      MTN MoMo, Orange Money, Airtel Money
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-8 h-5 bg-yellow-500 rounded text-white text-xs flex items-center justify-center font-bold">
                      MTN
                    </div>
                    <div className="w-8 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">
                      OM
                    </div>
                  </div>
                </button>

                {/* Phone Number for Fapshi */}
                {paymentMethod === "fapshi" && (
                  <div className="pt-4">
                    <label className="block text-sm font-medium text-dark dark:text-dark-dark mb-2">
                      Mobile Money Phone Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 bg-bgLightest dark:bg-bgLightest-dark border border-r-0 border-borderLight dark:border-borderLight-dark rounded-l-lg text-body dark:text-body-dark">
                        +237
                      </span>
                      <input
                        type="tel"
                        placeholder="6XXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                        className="flex-1 px-4 py-2 border border-borderLight dark:border-borderLight-dark rounded-r-lg bg-transparent text-dark dark:text-dark-dark focus:outline-none focus:border-primary"
                      />
                    </div>
                    <p className="text-xs text-body dark:text-body-dark mt-1">
                      Enter your MTN or Orange Money number
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-danger/10 border border-danger rounded-lg text-danger text-sm">
                    {error}
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay {paymentMethod === "stripe" ? formatPrice(usdTotal, "USD") : formatPrice(xafTotal, "XAF")}
                    </>
                  )}
                </button>

                {/* Security Note */}
                <p className="text-xs text-center text-body dark:text-body-dark">
                  Your payment is secure and encrypted. By completing this purchase, you agree to our{" "}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

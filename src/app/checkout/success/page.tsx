"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const sessionId = searchParams.get("session_id");
  const transactionId = searchParams.get("transaction_id");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (sessionId) {
          // Stripe payment - session ID means success (webhook handles the rest)
          setStatus("success");
          setMessage("Your subscription has been activated successfully!");
        } else if (transactionId) {
          // Fapshi payment - check status
          const response = await fetch(`/api/payments/fapshi/webhook?transaction_id=${transactionId}`);
          const data = await response.json();

          if (data.status === "successful" || data.status === "success") {
            setStatus("success");
            setMessage("Your subscription has been activated successfully!");
          } else if (data.status === "pending") {
            setStatus("loading");
            setMessage("Your payment is being processed. Please wait...");
            // Poll for status
            setTimeout(verifyPayment, 5000);
          } else {
            setStatus("error");
            setMessage("Payment was not successful. Please try again.");
          }
        } else {
          setStatus("success");
          setMessage("Thank you for your purchase!");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setStatus("success"); // Assume success if verification fails (webhook handles it)
        setMessage("Your subscription is being processed.");
      }
    };

    verifyPayment();
  }, [sessionId, transactionId]);

  return (
    <div className="min-h-screen bg-bgBody dark:bg-bgBody-dark flex items-center justify-center px-4">
      <div className="bg-card dark:bg-card-dark rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <svg className="animate-spin h-16 w-16 text-primary" viewBox="0 0 24 24">
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
            </div>
            <h1 className="text-2xl font-bold text-dark dark:text-dark-dark mb-2">
              Processing Payment
            </h1>
            <p className="text-body dark:text-body-dark mb-6">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-dark dark:text-dark-dark mb-2">
              Payment Successful!
            </h1>
            <p className="text-body dark:text-body-dark mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/dashboard/hrm-dashboard"
                className="block w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-medium"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/dashboard/subscription"
                className="block w-full border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark py-3 rounded-lg hover:border-primary transition font-medium"
              >
                View Subscription
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-danger/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-danger"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-dark dark:text-dark-dark mb-2">
              Payment Failed
            </h1>
            <p className="text-body dark:text-body-dark mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/pricing"
                className="block w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-medium"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="block w-full border border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark py-3 rounded-lg hover:border-primary transition font-medium"
              >
                Go Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLANS, formatPrice, FEATURE_LABELS } from "@/config/plans";
import { PlanType } from "@/types/company";
import { useAuthUserContext } from "@/context/UserAuthContext";

const PricingMainArea: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUserContext();

  // Check if user is logged in
  const isLoggedIn = !!user;

  const faqs = [
    {
      question: "Can I try AfriHR before purchasing?",
      answer: "Yes! Our Starter plan is completely free forever. You can upgrade to a paid plan anytime when you're ready for more features."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and mobile money payments (M-Pesa, MTN Mobile Money, Orange Money, Airtel Money, etc.) across Africa."
    },
    {
      question: "Can I change plans later?",
      answer: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately, and we'll prorate any charges."
    },
    {
      question: "Is there a contract or commitment?",
      answer: "No contracts required! All plans are month-to-month or annual (with a discount). Cancel anytime with no penalties."
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes! Save 20% when you choose annual billing. Simply toggle the billing cycle above to see annual pricing."
    },
    {
      question: "What kind of support do you provide?",
      answer: "Starter plan includes email support. Professional plan adds priority email support and live chat. Business includes phone support. Enterprise includes dedicated account manager and 24/7 phone support."
    },
    {
      question: "Can I add more employees later?",
      answer: "Yes! You can add or remove employees at any time. We'll automatically adjust your billing based on your active employee count."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption, regular backups, and comply with international data protection standards. Your data is stored in secure data centers."
    }
  ];

  const planOrder: PlanType[] = ['starter', 'professional', 'business', 'enterprise'];

  // Handle buy plan click - redirect to login if not logged in
  const handleBuyPlan = (planId: PlanType) => {
    const billingCycle = isAnnual ? 'annual' : 'monthly';
    const checkoutUrl = `/checkout?plan=${planId}&billing=${billingCycle}`;

    if (!isLoggedIn) {
      // Redirect to login with return URL to pricing page
      const returnUrl = encodeURIComponent(`/pricing?redirect=${encodeURIComponent(checkoutUrl)}`);
      router.push(`/auth/signin-basic?returnUrl=${returnUrl}`);
    } else {
      // User is logged in, go directly to checkout
      router.push(checkoutUrl);
    }
  };

  // Check for redirect parameter on mount (after login)
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoggedIn) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');
      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      }
    }
  }, [isLoggedIn, router]);

  const getPlanButton = (planId: PlanType) => {
    const plan = PLANS[planId];

    if (plan.contactSales) {
      return (
        <Link
          href="/contact"
          className="block w-full text-center border-2 border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark py-3 rounded-lg hover:border-primary hover:text-primary transition font-medium mb-6"
        >
          Contact Sales
        </Link>
      );
    }

    if (planId === 'starter') {
      return (
        <Link
          href="/auth/signup-basic"
          className="block w-full text-center border-2 border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark py-3 rounded-lg hover:border-primary hover:text-primary transition font-medium mb-6"
        >
          Get Started Free
        </Link>
      );
    }

    return (
      <button
        onClick={() => handleBuyPlan(planId)}
        className={`w-full text-center py-3 rounded-lg transition font-medium mb-6 ${
          plan.popular
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'border-2 border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark hover:border-primary hover:text-primary'
        }`}
      >
        Buy Plan
      </button>
    );
  };

  const getPlanPrice = (planId: PlanType) => {
    const plan = PLANS[planId];

    if (plan.contactSales) {
      return (
        <>
          <div className="text-4xl sm:text-5xl font-bold text-dark dark:text-dark-dark">Custom</div>
          <div className="text-body dark:text-body-dark text-sm">Contact sales</div>
        </>
      );
    }

    if (plan.monthlyPrice === 0) {
      return (
        <>
          <div className="text-4xl sm:text-5xl font-bold text-dark dark:text-dark-dark">$0</div>
          <div className="text-body dark:text-body-dark text-sm">Always free</div>
        </>
      );
    }

    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

    return (
      <>
        <div className="flex items-baseline gap-2">
          <div className="text-4xl sm:text-5xl font-bold text-dark dark:text-dark-dark">
            ${price / 100}
          </div>
          <div className="text-body dark:text-body-dark text-sm">per employee/month</div>
        </div>
        {isAnnual && (
          <div className="text-secondary text-xs font-medium mt-1">
            Billed annually (Save 20%)
          </div>
        )}
      </>
    );
  };

  const getIncludedFeatures = (planId: PlanType): string[] => {
    switch (planId) {
      case 'starter':
        return [
          'Up to 10 employees',
          'Basic employee management',
          'Attendance tracking',
          'Leave management',
          'Basic reporting',
          'Email support'
        ];
      case 'professional':
        return [
          'Unlimited employees',
          'Payroll management',
          'Performance reviews',
          'Advanced analytics & reports',
          'Custom workflows',
          'Mobile app access',
          'Priority support & live chat'
        ];
      case 'business':
        return [
          'Everything in Professional',
          'API access',
          'Custom integrations',
          'Training & learning module',
          'SLA guarantees (99.9% uptime)',
          '24/7 phone support',
          'Recruitment module'
        ];
      case 'enterprise':
        return [
          'Everything in Business',
          'Dedicated account manager',
          'White-label options',
          'On-premise deployment option',
          'Advanced security features',
          'Custom contract terms',
          'Priority 24/7 support'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bgLightest dark:from-bgBody-dark to-white dark:to-card-dark">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-dark dark:text-dark-dark">AfriHR</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Home</Link>
              <button className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Features</button>
              <button className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Solutions</button>
              <button className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Resources</button>
              <Link href="/pricing" className="text-primary font-medium">Pricing</Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth/signin-basic" className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark text-sm sm:text-base">
              Sign In
            </Link>
            <Link
              href="/auth/signup-basic"
              className="bg-primary text-white px-3 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Start Free Trial</span>
              <span className="sm:hidden">Sign Up</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="inline-block bg-primary/10 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
          FLEXIBLE PRICING FOR EVERY BUSINESS
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-dark dark:text-dark-dark mb-4 sm:mb-6 leading-tight max-w-4xl mx-auto">
          Choose The Perfect Plan For Your Team
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-body dark:text-body-dark mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-4">
          Start free and scale as you grow. All plans include core HR features with no hidden fees.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm sm:text-base ${!isAnnual ? 'text-dark dark:text-dark-dark font-medium' : 'text-body dark:text-body-dark'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-primary' : 'bg-borderLight dark:bg-borderLight-dark'}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isAnnual ? 'transform translate-x-7' : ''}`}
            />
          </button>
          <span className={`text-sm sm:text-base ${isAnnual ? 'text-dark dark:text-dark-dark font-medium' : 'text-body dark:text-body-dark'}`}>
            Annual
            <span className="ml-2 text-secondary text-xs sm:text-sm font-bold">Save 20%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {planOrder.map((planId) => {
            const plan = PLANS[planId];
            const isPopular = plan.popular;

            return (
              <div
                key={planId}
                className={`bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow relative ${
                  isPopular ? 'border-2 border-primary shadow-xl' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-body dark:text-body-dark text-sm mb-2">{plan.name}</div>
                  {getPlanPrice(planId)}
                </div>

                <p className="text-body dark:text-body-dark text-sm mb-6">
                  {plan.description}
                </p>

                {getPlanButton(planId)}

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-dark dark:text-dark-dark mb-3">
                    {planId === 'starter' ? "What's included:" : `Everything in ${planId === 'professional' ? 'Starter' : planId === 'business' ? 'Professional' : 'Business'}, plus:`}
                  </div>
                  {getIncludedFeatures(planId).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-body dark:text-body-dark">
                      <span className="text-secondary mt-0.5">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 bg-bgLightest dark:bg-bgBody-dark">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark dark:text-dark-dark mb-3 sm:mb-4">
            Compare Plans
          </h2>
          <p className="text-sm sm:text-base text-body dark:text-body-dark">
            See what's included in each plan
          </p>
        </div>

        <div className="max-w-6xl mx-auto bg-card dark:bg-card-dark rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bgLightest dark:bg-bgBody-dark">
                <tr>
                  <th className="text-left p-4 sm:p-6 text-sm sm:text-base font-semibold text-dark dark:text-dark-dark">Features</th>
                  <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-dark dark:text-dark-dark">Starter</th>
                  <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-primary">Professional</th>
                  <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-dark dark:text-dark-dark">Business</th>
                  <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-dark dark:text-dark-dark">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLightest dark:divide-borderLightest-dark">
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">Employee limit</td>
                  <td className="p-4 sm:p-6 text-center text-sm text-body dark:text-body-dark">Up to 10</td>
                  <td className="p-4 sm:p-6 text-center text-sm text-body dark:text-body-dark">Unlimited</td>
                  <td className="p-4 sm:p-6 text-center text-sm text-body dark:text-body-dark">Unlimited</td>
                  <td className="p-4 sm:p-6 text-center text-sm text-body dark:text-body-dark">Unlimited</td>
                </tr>
                <tr className="bg-bgLightest/50 dark:bg-bgBody-dark/50">
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">Attendance tracking</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">Leave management</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
                <tr className="bg-bgLightest/50 dark:bg-bgBody-dark/50">
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">Payroll management</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">Performance reviews</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
                <tr className="bg-bgLightest/50 dark:bg-bgBody-dark/50">
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">Advanced analytics</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">API access</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
                <tr className="bg-bgLightest/50 dark:bg-bgBody-dark/50">
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">Custom integrations</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">Dedicated account manager</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
                <tr className="bg-bgLightest/50 dark:bg-bgBody-dark/50">
                  <td className="p-4 sm:p-6 text-sm text-body dark:text-body-dark">White-label options</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-borderLight dark:text-borderLight-dark">—</td>
                  <td className="p-4 sm:p-6 text-center text-secondary">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark dark:text-dark-dark mb-3 sm:mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-body dark:text-body-dark">
            Everything you need to know about AfriHR pricing
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card dark:bg-card-dark rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-bgLightest dark:hover:bg-bgBody-dark transition"
              >
                <span className="text-sm sm:text-base font-semibold text-dark dark:text-dark-dark pr-4">
                  {faq.question}
                </span>
                <span className={`text-primary text-xl transition-transform ${openFaq === index ? 'transform rotate-180' : ''}`}>
                  ↓
                </span>
              </button>
              {openFaq === index && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm sm:text-base text-body dark:text-body-dark">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-gradient-to-r from-primary to-[#003cff] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-sm sm:text-base text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join hundreds of African businesses using AfriHR. Start free, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/auth/signup-basic"
              className="w-full sm:w-auto bg-white text-primary px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Start Free Trial
            </Link>
            <button className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-white/10 transition font-medium">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-borderLightest dark:border-borderLightest-dark">
        <div className="text-center text-body dark:text-body-dark text-xs sm:text-sm">
          <p>© 2026 AfriHR. All rights reserved. Made with love for African businesses.</p>
        </div>
      </footer>
    </div>
  );
};

export default PricingMainArea;

"use client";
import React, { useState } from "react";
import Link from "next/link";

const PricingMainArea: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "Can I try AfriHR before purchasing?",
      answer: "Yes! Our Starter plan is completely free forever. You can upgrade to a paid plan anytime when you're ready for more features."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and mobile money payments (M-Pesa, MTN Mobile Money, Airtel Money, etc.) across Africa."
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
      answer: "Starter plan includes email support. Professional plan adds priority email support and live chat. Enterprise includes dedicated account manager and 24/7 phone support."
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">AfriHR</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-gray-700 hover:text-gray-900">Home</Link>
              <button className="text-gray-700 hover:text-gray-900">Features</button>
              <button className="text-gray-700 hover:text-gray-900">Solutions</button>
              <button className="text-gray-700 hover:text-gray-900">Resources</button>
              <Link href="/pricing" className="text-emerald-600 font-medium">Pricing</Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/auth/signin-basic" className="text-gray-700 hover:text-gray-900 text-sm sm:text-base">
              Sign In
            </Link>
            <Link 
              href="/auth/signup-basic" 
              className="bg-emerald-600 text-white px-3 sm:px-6 py-2 rounded-lg hover:bg-emerald-700 transition text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Start Free Trial</span>
              <span className="sm:hidden">Sign Up</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="inline-block bg-emerald-100 text-emerald-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
          FLEXIBLE PRICING FOR EVERY BUSINESS
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight max-w-4xl mx-auto">
          Choose The Perfect Plan For Your Team
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto px-4">
          Start free and scale as you grow. All plans include core HR features with no hidden fees.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm sm:text-base ${!isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-emerald-600' : 'bg-gray-300'}`}
          >
            <span 
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isAnnual ? 'transform translate-x-7' : ''}`}
            />
          </button>
          <span className={`text-sm sm:text-base ${isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            Annual
            <span className="ml-2 text-emerald-600 text-xs sm:text-sm font-bold">Save 20%</span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="mb-6">
              <div className="text-gray-600 text-sm mb-2">Starter</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl sm:text-5xl font-bold text-gray-900">$0</div>
              </div>
              <div className="text-gray-500 text-sm">Always free</div>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Perfect for small businesses getting started with HR management.
            </p>
            
            <Link 
              href="/auth/signup-basic"
              className="block w-full text-center border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:border-emerald-600 hover:text-emerald-600 transition font-medium mb-6"
            >
              Get Started Free
            </Link>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900 mb-3">What's included:</div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Up to 10 employees</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Basic employee management</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Attendance tracking</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Leave management</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Basic reporting</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Email support</span>
              </div>
            </div>
          </div>

          {/* Professional Plan - Popular */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-emerald-600 relative hover:shadow-2xl transition-shadow">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                MOST POPULAR
              </span>
            </div>
            
            <div className="mb-6">
              <div className="text-gray-600 text-sm mb-2">Professional</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl sm:text-5xl font-bold text-gray-900">
                  ${isAnnual ? '8' : '10'}
                </div>
                <div className="text-gray-500 text-sm">per employee/month</div>
              </div>
              {isAnnual && (
                <div className="text-emerald-600 text-xs font-medium mt-1">
                  Billed annually (${96 * 10}/year for 10 employees)
                </div>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Complete HR solution for growing businesses with advanced features.
            </p>
            
            <Link 
              href="/auth/signup-basic"
              className="block w-full text-center bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-medium mb-6"
            >
              Start Free Trial
            </Link>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900 mb-3">Everything in Starter, plus:</div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Unlimited employees</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Payroll management</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Performance reviews</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Advanced analytics & reports</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Custom workflows</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Mobile app access</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Priority support & live chat</span>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="mb-6">
              <div className="text-gray-600 text-sm mb-2">Enterprise</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl sm:text-5xl font-bold text-gray-900">Custom</div>
              </div>
              <div className="text-gray-500 text-sm">Contact sales</div>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Tailored solutions for large organizations with custom requirements.
            </p>
            
            <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:border-emerald-600 hover:text-emerald-600 transition font-medium mb-6">
              Contact Sales
            </button>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900 mb-3">Everything in Professional, plus:</div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Custom integrations</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Dedicated account manager</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>White-label options</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>Advanced security features</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>SLA guarantees (99.9% uptime)</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>On-premise deployment option</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>24/7 phone support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 bg-gray-50">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Compare Plans
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            See what's included in each plan
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 sm:p-6 text-sm sm:text-base font-semibold text-gray-900">Features</th>
                  <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-gray-900">Starter</th>
                  <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-emerald-600">Professional</th>
                  <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-gray-700">Employee limit</td>
                  <td className="p-4 sm:p-6 text-center text-sm text-gray-700">Up to 10</td>
                  <td className="p-4 sm:p-6 text-center text-sm text-gray-700">Unlimited</td>
                  <td className="p-4 sm:p-6 text-center text-sm text-gray-700">Unlimited</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 sm:p-6 text-sm text-gray-700">Attendance tracking</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-gray-700">Leave management</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 sm:p-6 text-sm text-gray-700">Payroll management</td>
                  <td className="p-4 sm:p-6 text-center text-gray-400">—</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-gray-700">Performance reviews</td>
                  <td className="p-4 sm:p-6 text-center text-gray-400">—</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 sm:p-6 text-sm text-gray-700">Advanced analytics</td>
                  <td className="p-4 sm:p-6 text-center text-gray-400">—</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 text-sm text-gray-700">Custom integrations</td>
                  <td className="p-4 sm:p-6 text-center text-gray-400">—</td>
                  <td className="p-4 sm:p-6 text-center text-gray-400">—</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-4 sm:p-6 text-sm text-gray-700">Dedicated account manager</td>
                  <td className="p-4 sm:p-6 text-center text-gray-400">—</td>
                  <td className="p-4 sm:p-6 text-center text-gray-400">—</td>
                  <td className="p-4 sm:p-6 text-center text-emerald-600">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Everything you need to know about AfriHR pricing
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span className="text-sm sm:text-base font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <span className={`text-emerald-600 text-xl transition-transform ${openFaq === index ? 'transform rotate-180' : ''}`}>
                  ↓
                </span>
              </button>
              {openFaq === index && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm sm:text-base text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-emerald-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join hundreds of African businesses using AfriHR. Start free, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link 
              href="/auth/signup-basic" 
              className="w-full sm:w-auto bg-white text-emerald-600 px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Start Free Trial
            </Link>
            <button className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-emerald-700 transition font-medium">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-gray-200">
        <div className="text-center text-gray-600 text-xs sm:text-sm">
          <p>© 2026 AfriHR. All rights reserved. Made with ❤️ for African businesses.</p>
        </div>
      </footer>
    </div>
  );
};

export default PricingMainArea;

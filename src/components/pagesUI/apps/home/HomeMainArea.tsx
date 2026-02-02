// components/pagesUI/apps/home/HomeMainArea.tsx
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const HomeMainArea: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state directly from Firebase for homepage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Handle buy plan click - redirect to login if not logged in
  const handleBuyPlan = (planId: string, billingCycle: string = 'monthly') => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-bgLightest dark:from-bgBody-dark to-white dark:to-card-dark">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-dark dark:text-dark-dark">AfriHR</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-6">
              <button className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Features</button>
              <button className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Solutions</button>
              <button className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Resources</button>
              <button className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Careers</button>
              <Link href="/pricing" className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">Pricing</Link>
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
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-primary/10 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            EMPOWERING AFRICAN BUSINESSES
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-dark dark:text-dark-dark mb-4 sm:mb-6 leading-tight px-4">
            Transform Your HR Management With AfriHR
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-body dark:text-body-dark mb-6 sm:mb-8 leading-relaxed px-4">
            Streamline Employee Management, Simplify Payroll, Enhance Productivity And Drive Growth With Africa&apos;s Leading HR Platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
            <Link
              href="/auth/signup-basic"
              className="w-full sm:w-auto bg-primary text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-primary/90 transition font-medium"
            >
              Get Started
            </Link>
          </div>

          {/* Stats Badge */}
          <div className="inline-block bg-card dark:bg-card-dark rounded-2xl shadow-lg p-4 sm:p-6 mb-8 sm:mb-12 mx-4">
            <div className="flex items-center gap-4 sm:gap-8">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-dark dark:text-dark-dark">95%</div>
                <div className="text-xs sm:text-sm text-body dark:text-body-dark">Of companies recommend AfriHR</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto mt-8 sm:mt-12 px-4">
          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-body dark:text-body-dark font-medium">Employee Productivity</span>
              <span className="text-success text-sm">↑ 12.5%</span>
            </div>
            <div className="h-32 flex items-end gap-2">
              <div className="flex-1 bg-primary/20 rounded" style={{height: '40%'}}></div>
              <div className="flex-1 bg-primary/20 rounded" style={{height: '60%'}}></div>
              <div className="flex-1 bg-primary/40 rounded" style={{height: '80%'}}></div>
              <div className="flex-1 bg-primary/20 rounded" style={{height: '50%'}}></div>
            </div>
            <div className="text-2xl font-bold text-dark dark:text-dark-dark mt-4">89%</div>
          </div>

          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-center h-40">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="currentColor" className="text-borderLightest dark:text-borderLightest-dark" strokeWidth="8" fill="none" />
                  <circle
                    cx="64" cy="64" r="60"
                    stroke="currentColor" className="text-secondary" strokeWidth="8" fill="none"
                    strokeDasharray="377" strokeDashoffset="94"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-xs text-body dark:text-body-dark">Attendance</div>
                  <div className="text-xl font-bold text-dark dark:text-dark-dark">94.5%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-body dark:text-body-dark font-medium">Payroll Processing</span>
              <span className="text-sm text-body dark:text-body-dark">Monthly Trend</span>
            </div>
            <div className="h-20 relative">
              <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                <polyline
                  points="0,30 40,25 80,35 120,20 160,28 200,22"
                  fill="none"
                  stroke="#6C5FFC"
                  strokeWidth="2"
                />
                <polyline
                  points="0,30 40,25 80,35 120,20 160,28 200,22 200,40 0,40"
                  fill="url(#gradient-primary)"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6C5FFC" />
                    <stop offset="100%" stopColor="#6C5FFC" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="text-2xl font-bold text-dark dark:text-dark-dark mt-4">100%</div>
          </div>
        </div>
      </section>

      {/* Integration Icons */}
      <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap opacity-60">
          <div className="w-12 h-12 flex items-center justify-center bg-bgLightest dark:bg-bgBody-dark rounded-full">
            <span className="text-2xl">📊</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-bgLightest dark:bg-bgBody-dark rounded-full">
            <span className="text-2xl">📧</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-bgLightest dark:bg-bgBody-dark rounded-full">
            <span className="text-2xl">💬</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-bgLightest dark:bg-bgBody-dark rounded-full">
            <span className="text-2xl">📱</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-primary rounded-full">
            <span className="text-white text-lg font-bold">API</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-bgLightest dark:bg-bgBody-dark rounded-full">
            <span className="text-2xl">🔒</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-bgLightest dark:bg-bgBody-dark rounded-full">
            <span className="text-2xl">🎯</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-bgLightest dark:bg-bgBody-dark rounded-full">
            <span className="text-2xl">📈</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">500+</div>
            <div className="text-body dark:text-body-dark text-xs sm:text-sm">Companies</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">98%</div>
            <div className="text-body dark:text-body-dark text-xs sm:text-sm">Satisfaction</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">50K+</div>
            <div className="text-body dark:text-body-dark text-xs sm:text-sm">Employees Managed</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">24/7</div>
            <div className="text-body dark:text-body-dark text-xs sm:text-sm">Support</div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 bg-bgLightest dark:bg-bgBody-dark">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark dark:text-dark-dark mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-sm sm:text-base text-body dark:text-body-dark">
            Choose the perfect plan for your business. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 max-w-6xl mx-auto px-4">
          {/* Starter Plan */}
          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <div className="text-body dark:text-body-dark text-sm mb-2">Starter</div>
              <div className="text-4xl font-bold text-dark dark:text-dark-dark mb-1">$0</div>
              <div className="text-body dark:text-body-dark text-sm">per month</div>
            </div>
            <p className="text-body dark:text-body-dark text-sm mb-6">
              Perfect for small businesses getting started.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Up to 10 employees
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Basic employee management
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Attendance tracking
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Leave management
              </li>
            </ul>
            <Link
              href="/auth/signup-basic"
              className="block w-full text-center border-2 border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark py-3 rounded-lg hover:border-primary hover:text-primary transition font-medium"
            >
              Get started
            </Link>
          </div>

          {/* Professional Plan */}
          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-xl p-6 border-2 border-primary relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                RECOMMENDED
              </span>
            </div>
            <div className="mb-6">
              <div className="text-body dark:text-body-dark text-sm mb-2">Professional</div>
              <div className="text-4xl font-bold text-dark dark:text-dark-dark mb-1">$10</div>
              <div className="text-body dark:text-body-dark text-sm">per employee/month</div>
            </div>
            <p className="text-body dark:text-body-dark text-sm mb-6">
              Complete HR solution for growing businesses.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Unlimited employees
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Payroll management
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Performance reviews
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Advanced analytics
              </li>
            </ul>
            <button
              onClick={() => handleBuyPlan('professional', 'monthly')}
              className="w-full text-center bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition font-medium"
            >
              Buy Plan
            </button>
          </div>

          {/* Business Plan */}
          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <div className="text-body dark:text-body-dark text-sm mb-2">Business</div>
              <div className="text-4xl font-bold text-dark dark:text-dark-dark mb-1">$15</div>
              <div className="text-body dark:text-body-dark text-sm">per employee/month</div>
            </div>
            <p className="text-body dark:text-body-dark text-sm mb-6">
              Advanced features for scaling companies.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Everything in Professional
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> API access
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Custom integrations
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> 24/7 phone support
              </li>
            </ul>
            <button
              onClick={() => handleBuyPlan('business', 'monthly')}
              className="w-full text-center border-2 border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark py-3 rounded-lg hover:border-primary hover:text-primary transition font-medium"
            >
              Buy Plan
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <div className="text-body dark:text-body-dark text-sm mb-2">Enterprise</div>
              <div className="text-4xl font-bold text-dark dark:text-dark-dark mb-1">Custom</div>
              <div className="text-body dark:text-body-dark text-sm">contact sales</div>
            </div>
            <p className="text-body dark:text-body-dark text-sm mb-6">
              Tailored solutions for large organizations.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Everything in Business
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> Dedicated account manager
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> White-label options
              </li>
              <li className="flex items-center gap-2 text-sm text-body dark:text-body-dark">
                <span className="text-secondary">✓</span> SLA guarantees
              </li>
            </ul>
            <a
              href="mailto:sales@afrihrm.com?subject=Enterprise Plan Inquiry"
              className="w-full border-2 border-borderLight dark:border-borderLight-dark text-dark dark:text-dark-dark py-3 rounded-lg hover:border-primary hover:text-primary transition font-medium text-center block"
            >
              Contact Sales
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/pricing" className="text-primary hover:underline font-medium">
            View full pricing details →
          </Link>
        </div>
      </section>

      {/* HR Analytics Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark dark:text-dark-dark mb-3 sm:mb-4">
            Powerful HR Analytics
          </h2>
          <p className="text-sm sm:text-base text-body dark:text-body-dark max-w-2xl mx-auto">
            Get Real-Time Insights Into Your Workforce. Track Performance, Monitor Trends And Make Data-Driven Decisions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-card dark:bg-card-dark rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="text-xs sm:text-sm text-body dark:text-body-dark mb-1 sm:mb-2">Workforce Overview</div>
              <div className="text-2xl sm:text-3xl font-bold text-dark dark:text-dark-dark">1,245</div>
              <div className="text-xs sm:text-sm text-secondary">Active Employees</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <button className="text-xs sm:text-sm text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">1M</button>
              <button className="text-xs sm:text-sm text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">3M</button>
              <button className="text-xs sm:text-sm text-primary font-medium">6M</button>
              <button className="text-xs sm:text-sm text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">1Y</button>
              <button className="text-xs sm:text-sm text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark">All</button>
            </div>
            <div className="flex items-center gap-4 sm:gap-8">
              <div>
                <div className="text-xs sm:text-sm text-body dark:text-body-dark">Retention</div>
                <div className="text-success text-xs sm:text-sm font-bold">+8.2%</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-body dark:text-body-dark">Turnover</div>
                <div className="text-body dark:text-body-dark text-xs sm:text-sm font-bold">3.1%</div>
              </div>
            </div>
          </div>

          <div className="h-32 sm:h-40 md:h-48 bg-bgLightest dark:bg-bgBody-dark rounded-lg flex items-end justify-around p-2 sm:p-4">
            <div className="w-12 bg-primary/30 rounded-t" style={{height: '60%'}}></div>
            <div className="w-12 bg-primary/30 rounded-t" style={{height: '40%'}}></div>
            <div className="w-12 bg-primary rounded-t" style={{height: '80%'}}></div>
            <div className="w-12 bg-primary rounded-t" style={{height: '70%'}}></div>
            <div className="w-12 bg-primary rounded-t" style={{height: '50%'}}></div>
            <div className="w-12 bg-primary/30 rounded-t" style={{height: '65%'}}></div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 bg-bgLightest dark:bg-bgBody-dark">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark dark:text-dark-dark mb-3 sm:mb-4">
            Trusted by African Businesses
          </h2>
          <p className="text-sm sm:text-base text-body dark:text-body-dark">
            See what HR leaders across Africa are saying about AfriHR
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto px-4">
          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                C
              </div>
              <div>
                <div className="font-bold text-dark dark:text-dark-dark">Chioma Adebayo</div>
                <div className="text-sm text-body dark:text-body-dark">HR Director, Lagos</div>
              </div>
            </div>
            <p className="text-body dark:text-body-dark text-sm">
              &quot;AfriHR transformed our HR operations completely. We&apos;ve streamlined payroll, improved employee satisfaction, and saved countless hours of manual work.&quot;
            </p>
          </div>

          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white font-bold">
                K
              </div>
              <div>
                <div className="font-bold text-dark dark:text-dark-dark">Kwame Mensah</div>
                <div className="text-sm text-body dark:text-body-dark">CEO, Accra</div>
              </div>
            </div>
            <p className="text-body dark:text-body-dark text-sm">
              &quot;The best HR platform we&apos;ve used. The analytics help us make better decisions, and our team loves how easy it is to manage leave and attendance.&quot;
            </p>
          </div>

          <div className="bg-card dark:bg-card-dark rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <div className="font-bold text-dark dark:text-dark-dark">Amara Okafor</div>
                <div className="text-sm text-body dark:text-body-dark">Operations Manager, Nairobi</div>
              </div>
            </div>
            <p className="text-body dark:text-body-dark text-sm">
              &quot;AfriHR is intuitive, powerful, and affordable. Perfect for African businesses looking to modernize their HR processes without breaking the bank.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-gradient-to-r from-primary to-[#003cff] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center text-white mx-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Transform Your HR Management?
          </h2>
          <p className="text-sm sm:text-base text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join hundreds of African businesses using AfriHR to streamline operations, boost productivity, and empower their workforce.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Link href="/auth/signup-basic" className="w-full sm:w-auto bg-white text-primary px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-100 transition font-medium">
              Start Free Trial
            </Link>
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

export default HomeMainArea;

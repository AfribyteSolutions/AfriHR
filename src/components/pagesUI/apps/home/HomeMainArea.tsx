"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Company } from "@/types/company";

// Define the Props interface to satisfy TypeScript
interface HomeMainAreaProps {
  company?: Company;
}

const HomeMainArea: React.FC<HomeMainAreaProps> = ({ company }) => {
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
      const returnUrl = encodeURIComponent(`/pricing?redirect=${encodeURIComponent(checkoutUrl)}`);
      router.push(`/auth/signin-basic?returnUrl=${returnUrl}`);
    } else {
      router.push(checkoutUrl);
    }
  };

  const handleSignInClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLoggedIn) {
      e.preventDefault();
      router.push('/dashboard');
    }
  };

  const handleStartTrialClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLoggedIn) {
      e.preventDefault();
      router.push('/pricing');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bgLightest dark:from-bgBody-dark to-white dark:to-card-dark">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center overflow-hidden">
              {company?.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">
                    {company?.name ? company.name.charAt(0) : "A"}
                </span>
              )}
            </div>
            <span className="text-lg sm:text-xl font-bold text-dark dark:text-dark-dark">
                {company?.name || "AfriHR"}
            </span>
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
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark text-sm sm:text-base">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth/signin-basic" onClick={handleSignInClick} className="text-body dark:text-body-dark hover:text-dark dark:hover:text-dark-dark text-sm sm:text-base">
                Sign In
              </Link>
            )}
            <Link
              href={isLoggedIn ? "/pricing" : "/auth/signup-basic"}
              onClick={handleStartTrialClick}
              className="bg-primary text-white px-3 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition text-sm sm:text-base"
            >
              <span className="hidden sm:inline">{isLoggedIn ? "View Pricing" : "Start Free Trial"}</span>
              <span className="sm:hidden">{isLoggedIn ? "Pricing" : "Sign Up"}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-primary/10 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 uppercase tracking-wider">
            {company ? `Official Portal: ${company.name}` : "EMPOWERING AFRICAN BUSINESSES"}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-dark dark:text-dark-dark mb-4 sm:mb-6 leading-tight px-4">
            {company 
              ? `Modern HR Management for ${company.name}` 
              : "Transform Your HR Management With AfriHR"}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-body dark:text-body-dark mb-6 sm:mb-8 leading-relaxed px-4">
            {company 
              ? `Access your employee dashboard, view payslips, and manage your work profile for ${company.name} in one secure place.`
              : "Streamline Employee Management, Simplify Payroll, Enhance Productivity And Drive Growth With Africa's Leading HR Platform."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth/signup-basic"}
              onClick={handleStartTrialClick}
              className="w-full sm:w-auto bg-primary text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-primary/90 transition font-medium"
            >
              {isLoggedIn ? "Go to Dashboard" : "Get Started"}
            </Link>
          </div>

          {/* Stats Badge */}
          <div className="inline-block bg-card dark:bg-card-dark rounded-2xl shadow-lg p-4 sm:p-6 mb-8 sm:mb-12 mx-4">
            <div className="flex items-center gap-4 sm:gap-8">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-dark dark:text-dark-dark">95%</div>
                <div className="text-xs sm:text-sm text-body dark:text-body-dark">Company Trust Rating</div>
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
            <div className="text-body dark:text-body-dark text-xs sm:text-sm">Employees</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">24/7</div>
            <div className="text-body dark:text-body-dark text-xs sm:text-sm">Support</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-borderLightest dark:border-borderLightest-dark">
        <div className="text-center text-body dark:text-body-dark text-xs sm:text-sm">
          <p>© 2026 {company?.name || "AfriHR"}. All rights reserved. Made for African businesses.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomeMainArea;
// components/pagesUI/apps/home/HomeMainArea.tsx
"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const HomeMainArea: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">AfriHR</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-6">
              <button className="text-gray-700 hover:text-gray-900">Features</button>
              <button className="text-gray-700 hover:text-gray-900">Solutions</button>
              <button className="text-gray-700 hover:text-gray-900">Resources</button>
              <button className="text-gray-700 hover:text-gray-900">Careers</button>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900">Pricing</Link>
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
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-emerald-100 text-emerald-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            EMPOWERING AFRICAN BUSINESSES
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
            Transform Your HR Management With AfriHR
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
            Streamline Employee Management, Simplify Payroll, Enhance Productivity And Drive Growth With Africa&apos;s Leading HR Platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
            <button className="w-full sm:w-auto bg-emerald-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-emerald-700 transition font-medium">
              Get Started
            </button>
            <button className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 px-6 sm:px-8 py-3 rounded-lg hover:border-gray-400 transition font-medium">
              View Demo
            </button>
          </div>

          {/* Stats Badge */}
          <div className="inline-block bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 sm:mb-12 mx-4">
            <div className="flex items-center gap-4 sm:gap-8">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">95%</div>
                <div className="text-xs sm:text-sm text-gray-600">Of companies recommend AfriHR</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto mt-8 sm:mt-12 px-4">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 font-medium">Employee Productivity</span>
              <span className="text-green-600 text-sm">↑ 12.5%</span>
            </div>
            <div className="h-32 flex items-end gap-2">
              <div className="flex-1 bg-emerald-200 rounded" style={{height: '40%'}}></div>
              <div className="flex-1 bg-emerald-200 rounded" style={{height: '60%'}}></div>
              <div className="flex-1 bg-emerald-200 rounded" style={{height: '80%'}}></div>
              <div className="flex-1 bg-emerald-200 rounded" style={{height: '50%'}}></div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-4">89%</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-center h-40">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                  <circle 
                    cx="64" cy="64" r="60" 
                    stroke="#10b981" strokeWidth="8" fill="none"
                    strokeDasharray="377" strokeDashoffset="94"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-xs text-gray-500">Attendance</div>
                  <div className="text-xl font-bold">94.5%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 font-medium">Payroll Processing</span>
              <span className="text-sm text-gray-500">Monthly Trend</span>
            </div>
            <div className="h-20 relative">
              <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                <polyline
                  points="0,30 40,25 80,35 120,20 160,28 200,22"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                <polyline
                  points="0,30 40,25 80,35 120,20 160,28 200,22 200,40 0,40"
                  fill="url(#gradient-green)"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient id="gradient-green" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-4">100%</div>
          </div>
        </div>
      </section>

      {/* Integration Icons */}
      <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap opacity-60">
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-3xl">🐦</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-3xl">📺</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-3xl">💬</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-3xl">📧</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center bg-red-600 rounded-full">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-3xl">∞</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-3xl">🎨</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-3xl">📊</span>
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            <span className="text-3xl">🎵</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto text-center">
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">500+</div>
            <div className="text-gray-600 text-xs sm:text-sm">Companies</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">98%</div>
            <div className="text-gray-600 text-xs sm:text-sm">Satisfaction</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">50K+</div>
            <div className="text-gray-600 text-xs sm:text-sm">Employees Managed</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">24/7</div>
            <div className="text-gray-600 text-xs sm:text-sm">Support</div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 bg-gray-50">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Choose the perfect plan for your business. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto px-4">
          {/* Starter Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <div className="text-gray-600 text-sm mb-2">Starter</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
              <div className="text-gray-500 text-sm">per month</div>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Perfect for small businesses getting started with HR management.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Up to 10 employees
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Basic employee management
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Attendance tracking
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Leave management
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Email support
              </li>
            </ul>
            <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:border-gray-400 transition font-medium">
              Get started
            </button>
          </div>

          {/* Professional Plan */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-600 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                RECOMMENDED
              </span>
            </div>
            <div className="mb-6">
              <div className="text-gray-600 text-sm mb-2">Professional</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$10</div>
              <div className="text-gray-500 text-sm">per employee/month</div>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Complete HR solution for growing businesses with advanced features.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Unlimited employees
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Payroll management
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Performance reviews
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Advanced analytics
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Priority support
              </li>
            </ul>
            <button className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-medium">
              Get started
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <div className="text-gray-600 text-sm mb-2">Enterprise</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">Custom</div>
              <div className="text-gray-500 text-sm">contact sales</div>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Tailored solutions for large organizations with custom requirements.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Everything in Professional
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Custom integrations
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> Dedicated account manager
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> White-label options
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-emerald-600">✓</span> SLA guarantees
              </li>
            </ul>
            <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:border-gray-400 transition font-medium">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* HR Analytics Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Powerful HR Analytics
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Get Real-Time Insights Into Your Workforce. Track Performance, Monitor Trends And Make Data-Driven Decisions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Workforce Overview</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">1,245</div>
              <div className="text-xs sm:text-sm text-emerald-600">Active Employees</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <button className="text-xs sm:text-sm text-gray-600 hover:text-gray-900">1M</button>
              <button className="text-xs sm:text-sm text-gray-600 hover:text-gray-900">3M</button>
              <button className="text-xs sm:text-sm text-emerald-600 font-medium">6M</button>
              <button className="text-xs sm:text-sm text-gray-600 hover:text-gray-900">1Y</button>
              <button className="text-xs sm:text-sm text-gray-600 hover:text-gray-900">All</button>
            </div>
            <div className="flex items-center gap-4 sm:gap-8">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Retention</div>
                <div className="text-emerald-600 text-xs sm:text-sm font-bold">+8.2%</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Turnover</div>
                <div className="text-gray-600 text-xs sm:text-sm font-bold">3.1%</div>
              </div>
            </div>
          </div>

          <div className="h-32 sm:h-40 md:h-48 bg-gray-50 rounded-lg flex items-end justify-around p-2 sm:p-4">
            <div className="w-12 bg-emerald-200 rounded-t" style={{height: '60%'}}></div>
            <div className="w-12 bg-emerald-200 rounded-t" style={{height: '40%'}}></div>
            <div className="w-12 bg-emerald-400 rounded-t" style={{height: '80%'}}></div>
            <div className="w-12 bg-emerald-400 rounded-t" style={{height: '70%'}}></div>
            <div className="w-12 bg-emerald-400 rounded-t" style={{height: '50%'}}></div>
            <div className="w-12 bg-emerald-200 rounded-t" style={{height: '65%'}}></div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 bg-gray-50">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Trusted by African Businesses
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            See what HR leaders across Africa are saying about AfriHR
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                C
              </div>
              <div>
                <div className="font-bold text-gray-900">Chioma Adebayo</div>
                <div className="text-sm text-gray-500">HR Director, Lagos</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              &quot;AfriHR transformed our HR operations completely. We&apos;ve streamlined payroll, improved employee satisfaction, and saved countless hours of manual work.&quot;
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                K
              </div>
              <div>
                <div className="font-bold text-gray-900">Kwame Mensah</div>
                <div className="text-sm text-gray-500">CEO, Accra</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              &quot;The best HR platform we&apos;ve used. The analytics help us make better decisions, and our team loves how easy it is to manage leave and attendance.&quot;
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <div className="font-bold text-gray-900">Amara Okafor</div>
                <div className="text-sm text-gray-500">Operations Manager, Nairobi</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              &quot;AfriHR is intuitive, powerful, and affordable. Perfect for African businesses looking to modernize their HR processes without breaking the bank.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-emerald-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center text-white mx-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Transform Your HR Management?
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join hundreds of African businesses using AfriHR to streamline operations, boost productivity, and empower their workforce.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Link href="/auth/signup-basic" className="w-full sm:w-auto bg-white text-emerald-600 px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-100 transition font-medium">
              Start Free Trial
            </Link>
            <button className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-emerald-700 transition font-medium">
              Schedule Demo
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

export default HomeMainArea;

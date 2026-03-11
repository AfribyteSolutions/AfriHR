"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-indigo-600">AfriHRM</div>

        <div className="hidden md:flex gap-8 font-medium">
          <Link href="#features" className="hover:text-indigo-600 transition">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-indigo-600 transition">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-indigo-600 transition">
            About
          </Link>
        </div>

        <div className="flex gap-4">
          <Link
            href="/auth/signin-basic"
            className="px-5 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup-basic"
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Manage your African workforce <br />
          <span className="text-indigo-600">
            with ease and precision.
          </span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          The all-in-one HR platform designed for growing businesses in Africa
          and beyond. Payroll, attendance, and employee management in one
          place.
        </p>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/auth/signup-basic"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 shadow-lg transition"
          >
            Start Your Free Trial
          </Link>

          <Link
            href="#features"
            className="bg-white border border-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition"
          >
            View Features
          </Link>
        </div>

        {/* Dashboard Images Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Dashboard Image 1 */}
<div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6">
  <div className="relative w-full h-auto aspect-[16/10] rounded-2xl overflow-hidden bg-gray-50">
    <Image
      src="/images/dashboard-1.png"
      alt="AfriHRM Dashboard Overview"
      fill
      className="object-contain"
      priority
    />
  </div>
</div>

{/* Dashboard Image 2 */}
<div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6">
  <div className="relative w-full h-auto aspect-[16/10] rounded-2xl overflow-hidden bg-gray-50">
    <Image
      src="/images/dashboard-2.png"
      alt="AfriHRM Employee Management Dashboard"
      fill
      className="object-contain"
    />
  </div>
</div>

          </div>
        </div>
        {/* Video Demo Section */}
<div className="mt-20 text-center">
  <h2 className="text-3xl md:text-4xl font-bold mb-4">
    See AfriHRM in Action
  </h2>

  <p className="text-gray-600 max-w-2xl mx-auto mb-8">
    Watch a quick walkthrough on how managers and CEOs can use the
    dashboard to manage employees, payroll, projects, and more.
    After signing up, youll get a link to all tutorial videos for the dashboard menus
  </p>

  <div className="flex justify-center">
    <a
      href="https://drive.google.com/file/d/1O2g-WegSKRz7Yq-9rhWRHoovYqlQzGck/view?usp=sharing"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 shadow-lg transition"
    >
      <span>Watch Dashboard Tutorial</span>
      <i className="fa-solid fa-play"></i>
    </a>
  </div>
</div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20 px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          
          <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">
              <i className="fa-solid fa-money-bill-wave"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Payroll</h3>
            <p className="text-gray-600">
              Automated salary processing with structured monthly generation
              and secure payslip distribution.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 text-xl">
              <i className="fa-solid fa-user-check"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Attendance Tracking</h3>
            <p className="text-gray-600">
              Real-time attendance monitoring and leave management from one
              centralized dashboard.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 text-xl">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Data</h3>
            <p className="text-gray-600">
              Enterprise-grade security to protect sensitive employee and
              payroll information.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
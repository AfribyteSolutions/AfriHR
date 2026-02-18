"use client";

import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-indigo-600">AfriHRM</div>
        <div className="hidden md:flex gap-8 font-medium">
          <Link href="#features" className="hover:text-indigo-600 transition">Features</Link>
          <Link href="/pricing" className="hover:text-indigo-600 transition">Pricing</Link>
          <Link href="/about" className="hover:text-indigo-600 transition">About</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/auth/signin-basic" className="px-5 py-2 rounded-lg font-medium hover:bg-gray-100 transition">
            Log in
          </Link>
          <Link href="/auth/signup-basic" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Manage your African workforce <br />
          <span className="text-indigo-600">with ease and precision.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          The all-in-one HR platform designed for growing businesses in Ghana and beyond. 
          Payroll, attendance, and employee management in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/signup-basic" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 shadow-lg transition">
            Start Your Free Trial
          </Link>
          <Link href="#features" className="bg-white border border-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition">
            View Features
          </Link>
        </div>

        {/* Mockup Placeholder */}
        <div className="mt-16 bg-gray-100 rounded-3xl p-4 border border-gray-200 shadow-2xl max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl h-64 md:h-[400px] flex items-center justify-center text-gray-400">
            <i className="fa-solid fa-chart-line text-6xl opacity-20 mr-4"></i>
            <span className="text-lg font-medium italic">Product Dashboard Preview</span>
          </div>
        </div>
      </main>

      {/* Features Preview */}
      <section id="features" className="bg-gray-50 py-20 px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">
              <i className="fa-solid fa-money-bill-wave"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Payroll</h3>
            <p className="text-gray-600">Automated tax calculations and direct deposits tailored for local regulations.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 text-xl">
              <i className="fa-solid fa-user-check"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Attendance Tracking</h3>
            <p className="text-gray-600">Real-time attendance monitoring with GPS and biometric support.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 text-xl">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Data</h3>
            <p className="text-gray-600">Enterprise-grade security ensuring your employee information is always safe.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
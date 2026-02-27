"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  Target,
  Rocket,
  Users,
  Briefcase,
  ShieldCheck,
  Award,
} from "lucide-react";

const AboutMainArea = () => {
  return (
    <div className="app__slide-wrapper max-w-[1400px] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <div className="mb-6">
        <nav>
          <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link
                href="/dashboard"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Dashboard
              </Link>
            </li>

            <li>/</li>

            <li className="text-gray-900 dark:text-white font-medium">
              About AfriHRM
            </li>
          </ol>
        </nav>
      </div>

      {/* Hero */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">

        <div className="flex items-start gap-4">

          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <Building2 className="text-indigo-600 dark:text-indigo-400" size={28}/>
          </div>

          <div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              About AfriHRM
            </h1>

            <p className="text-gray-500 dark:text-gray-400 text-sm">
              African-built Human Resource Management Platform
            </p>

          </div>

        </div>

        <div className="mt-6 space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">

          <p>
            AfriHRM is a modern Human Resource Management platform built specifically 
            for African businesses. It was developed by Afribyte, the technology company 
            behind Afrikvent and Afribooking.
          </p>

          <p>
            The platform provides a complete employee lifecycle solution — from hiring, 
            onboarding, attendance tracking, payroll management, training, promotion, 
            pension management, and termination — all within one secure system.
          </p>

        </div>

      </div>

      {/* Mission Vision Goal */}
      <div className="grid grid-cols-12 gap-6 mt-6">

        <InfoCard
          icon={<Target size={24}/>}
          title="Our Mission"
          desc="To empower African businesses with world-class HR tools built specifically for African workforce realities."
        />

        <InfoCard
          icon={<Globe size={24}/>}
          title="Our Vision"
          desc="To become Africa’s leading workforce infrastructure powering millions of employees."
        />

        <InfoCard
          icon={<Rocket size={24}/>}
          title="Our Goal"
          desc="To simplify workforce management from hiring to retirement."
        />

      </div>

      {/* Features */}
      <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Platform Capabilities
        </h2>

        <div className="grid grid-cols-12 gap-6">

          <FeatureCard
            icon={<Users size={22}/>}
            title="Employee Management"
            desc="Full employee lifecycle management from onboarding to exit."
          />

          <FeatureCard
            icon={<Briefcase size={22}/>}
            title="Payroll Automation"
            desc="Automate salaries, payslips, deductions, and compliance."
          />

          <FeatureCard
            icon={<Award size={22}/>}
            title="Training & Promotion"
            desc="Track performance, growth, and promotion pathways."
          />

          <FeatureCard
            icon={<ShieldCheck size={22}/>}
            title="Enterprise Security"
            desc="Secure infrastructure built with enterprise-grade protection."
          />

        </div>

      </div>

      {/* Bottom Section Modern */}
      <div className="mt-6 rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600">

        <div className="rounded-2xl bg-white dark:bg-gray-900 p-8">

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Powered by Afribyte
          </h2>

          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
            Afribyte builds scalable African software infrastructure including 
            AfriHRM, Afrikvent, and Afribooking — enabling businesses to operate 
            efficiently in the modern digital economy.
          </p>

        </div>

      </div>

    </div>
  );
};

export default AboutMainArea;



/* Info Card */

const InfoCard = ({ icon, title, desc }: any) => (
  <div className="col-span-12 md:col-span-4">

    <div className="
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-800
      rounded-xl
      p-6
      hover:shadow-md
      transition
    ">

      <div className="text-indigo-600 dark:text-indigo-400 mb-3">
        {icon}
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {desc}
      </p>

    </div>

  </div>
);



/* Feature Card */

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="col-span-12 md:col-span-6 lg:col-span-3">

    <div className="
      bg-gray-50 dark:bg-gray-800/50
      border border-gray-200 dark:border-gray-700
      rounded-xl
      p-6
      hover:shadow-md hover:-translate-y-0.5
      transition-all
    ">

      <div className="text-indigo-600 dark:text-indigo-400 mb-3">
        {icon}
      </div>

      <h4 className="font-semibold text-gray-900 dark:text-white">
        {title}
      </h4>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {desc}
      </p>

    </div>

  </div>
);
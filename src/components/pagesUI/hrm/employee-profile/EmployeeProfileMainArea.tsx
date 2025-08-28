"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import React, { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PersonalInformation from "./PersonalInformation";
import EmergencyContact from "./EmergencyContact";
import EducationQualification from "./EducationQualification";
import ExperienceDetails from "./ExperienceDetails";
import BankAccount from "./BankAccount";
import SocialProfile from "./SocialProfile";
import Passport from "./Passport";
import { IEmployee } from "@/interface";

// Create a separate component that uses useSearchParams
const EmployeeProfileContent = () => {
  const searchParams = useSearchParams();
  const [employeeData, setEmployeeData] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchAllEmployeeData = async () => {
      // Don't run until component is mounted and we have search params
      if (!mounted || !searchParams) {
        return;
      }

      try {
        // Get uid from search params
        const uid = searchParams.get('uid');
        
        console.log('URL Search Params:', searchParams.toString());
        console.log('Extracted UID:', uid);
        console.log('All URL params:');
        // Convert entries to array to avoid TypeScript iteration issues
        const params = Array.from(searchParams.entries());
        params.forEach(([key, value]) => {
          console.log(`${key}: ${value}`);
        });
        
        if (!uid || uid === 'null' || uid === 'undefined') {
          setError("Employee UID not found in URL. Please navigate from the employee list.");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        console.log('Fetching employee data for UID:', uid);
        const res = await fetch(`/api/user-data?uid=${encodeURIComponent(uid)}`);
        const data = await res.json();
        
        console.log('API Response:', data);
        
        if (res.ok && data.success) {
          setEmployeeData(data.user as IEmployee);
        } else {
          setError(data.message || "Failed to fetch employee data.");
          console.error("API Error:", data.message);
        }
      } catch (err: any) {
        setError("Network error or failed to connect to API.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllEmployeeData();
  }, [searchParams, mounted]);

  // Show loading until mounted
  if (!mounted) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee Profile" subTitle="Home" />
        <div className="flex justify-center items-center h-96">
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee Profile" subTitle="Home" />
        <div className="flex justify-center items-center h-96">
          <p>Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee Profile" subTitle="Home" />
        <div className="flex justify-center items-center h-96 text-red-600">
          <div className="text-center">
            <p className="mb-4">{error}</p>
            <div className="text-sm text-gray-500">
              <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              <p>Search params: {searchParams ? searchParams.toString() : 'None'}</p>
              <p>Available params:</p>
              {searchParams && Array.from(searchParams.entries()).map(([key, value]) => (
                <p key={key}>{key}: {value}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee Profile" subTitle="Home" />
        <div className="flex justify-center items-center h-96">
          <p>Employee profile data could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee Profile" subTitle="Home" />
        <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
          <PersonalInformation data={employeeData} />
          <EmergencyContact data={employeeData} />
          <EducationQualification data={employeeData} />
          <ExperienceDetails data={employeeData} />
          <BankAccount data={employeeData} />
          <Passport data={employeeData} />
          <SocialProfile data={employeeData} />
        </div>
      </div>
    </>
  );
};

// Main component wrapped with Suspense
const EmployeeProfileMainArea = () => {
  return (
    <Suspense fallback={
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee Profile" subTitle="Home" />
        <div className="flex justify-center items-center h-96">
          <p>Loading...</p>
        </div>
      </div>
    }>
      <EmployeeProfileContent />
    </Suspense>
  );
};

export default EmployeeProfileMainArea;
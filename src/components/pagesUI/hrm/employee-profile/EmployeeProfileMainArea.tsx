"use client";
import { auth } from "@/lib/firebase"; // Adjust this path to where your firebase client config lives
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import PersonalInformation from "./PersonalInformation";
import EmergencyContact from "./EmergencyContact";
import EducationQualification from "./EducationQualification";
import ExperienceDetails from "./ExperienceDetails";
import BankAccount from "./BankAccount";
import SocialProfile from "./SocialProfile";
import Passport from "./NationalCard";
import { IEmployee } from "@/interface";

const EmployeeProfileContent = () => {
  const searchParams = useSearchParams();
  const [employeeData, setEmployeeData] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      let uid = searchParams.get('uid');
  
      // 1. If no UID in URL, get it from the logged-in user
      if (!uid) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            executeFetch(user.uid);
          } else {
            setError("Please log in to view your profile.");
            setLoading(false);
          }
        });
        return () => unsubscribe();
      } else {
        executeFetch(uid);
      }
    };
  
    const executeFetch = async (targetUid: string) => {
      try {
        const res = await fetch(`/api/user-data?uid=${targetUid}`);
        const data = await res.json();
        
        if (data.success) {
          // We set the data, but we must ensure the UI uses 'fullName'
          setEmployeeData(data.user);
        } else {
          setError(data.message || "User not found.");
        }
      } catch (err) {
        setError("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchProfile();
  }, [searchParams]);

  if (loading) return <div className="p-10 text-center">Loading Profile Data...</div>;
  
  if (error) return (
    <div className="p-10 text-center text-red-500">
      <h3>Error</h3>
      <p>{error}</p>
      <button onClick={() => window.history.back()} className="btn btn-primary mt-4">Go Back</button>
    </div>
  );

  return (
    <div className="app__slide-wrapper">
      <Breadcrumb breadTitle="Employee Profile" subTitle="Home" />
      <div className="grid grid-cols-12 gap-x-6">
        <PersonalInformation data={employeeData!} />
        <EmergencyContact data={employeeData!} />
        <EducationQualification data={employeeData!} />
        <ExperienceDetails data={employeeData!} />
        <BankAccount data={employeeData!} />
        <Passport data={employeeData!} />
        <SocialProfile data={employeeData!} />
      </div>
    </div>
  );
};

const EmployeeProfileMainArea = () => (
  <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
    <EmployeeProfileContent />
  </Suspense>
);

export default EmployeeProfileMainArea;
"use client";
import { useAuthUserContext } from "@/context/UserAuthContext";
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
  const { user: authUser, loading: authLoading } = useAuthUserContext();
  const [employeeData, setEmployeeData] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = searchParams.get('uid');

    const executeFetch = async (targetUid: string) => {
      try {
        const res = await fetch(`/api/user-data?uid=${targetUid}`);
        const data = await res.json();
        
        if (data.success) {
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

    if (uid) {
      executeFetch(uid);
    } else if (authUser?.uid) {
      executeFetch(authUser.uid);
    } else if (!authLoading) {
      setError("Please log in to view your profile.");
      setLoading(false);
    }
  }, [searchParams, authUser, authLoading]);

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
        <SocialProfile data={employeeData!} />
        <Passport data={employeeData!} />
      </div>
    </div>
  );
};

const EmployeeProfileMainArea: React.FC = () => {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <EmployeeProfileContent />
    </Suspense>
  );
};

export default EmployeeProfileMainArea;

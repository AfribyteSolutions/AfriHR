"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast'; // For user feedback
import { IEmployee } from '@/interface'; // Import your IEmployee interface
import { useAuthUserContext } from '@/context/UserAuthContext'; // Import your context hook

import Breadcrumb from "@/common/Breadcrumb/breadcrumb"; // Keep Breadcrumb
import EmployeeFilter from "./EmployeeFilter"; // Keep EmployeeFilter
import EmployeeSingleCard from "@/components/common/EmployeeSingleCard"; // Keep EmployeeSingleCard

const EmployeeMainArea = () => {
  // Get user data, loading, and error states directly from the AuthUserContext
  const { user: authUser, loading: loadingAuthUser, error: authUserError } = useAuthUserContext(); 

  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Effect to fetch employees once the authUser and their companyId are available
  useEffect(() => {
    const fetchEmployeesList = async () => {
      // 1. Handle loading state of the authenticated user from context
      if (loadingAuthUser) {
        setLoadingEmployees(true); // Keep loading if AuthUserContext is still loading
        return;
      }
      
      // 2. Handle errors from authenticated user context (e.g., Firebase auth error)
      if (authUserError) {
        setFetchError(authUserError.message || "Authentication error.");
        setLoadingEmployees(false);
        setEmployees([]); // Clear employees on error
        return;
      }
      
      // 3. Check if user is logged in and has a company ID
      if (!authUser || !authUser.companyId) {
        setFetchError("User not logged in or company ID not found. Please log in.");
        setLoadingEmployees(false);
        setEmployees([]); // Clear employees if no companyId
        return;
      }

      setLoadingEmployees(true);
      setFetchError(null); // Clear previous errors before a new fetch
      try {
        // Use authUser.companyId directly from the context for the API call
        const res = await fetch(`/api/company-employees?companyId=${authUser.companyId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch employees.");
        }
        
        const data = await res.json();
        console.log('=== EMPLOYEES API RESPONSE ===');
        console.log('Response data:', data);
        console.log('Employees array:', data.employees);
        console.log('=== END API RESPONSE ===');
        
        if (data.success && Array.isArray(data.employees)) {
          // Debug each employee
          data.employees.forEach((emp: any, index: number) => {
            console.log(`Employee ${index + 1}:`, emp);
            console.log(`Employee ${index + 1} UID:`, emp.uid);
            console.log(`Employee ${index + 1} UID type:`, typeof emp.uid);
          });
          setEmployees(data.employees);
        } else {
          setFetchError(data.message || "No employees found or failed to fetch.");
          setEmployees([]); // Clear employees if data is not successful or not an array
        }
      } catch (err: any) {
        setFetchError(err.message || "Error fetching employee list.");
        console.error("Error fetching employees:", err);
        setEmployees([]); // Clear employees on fetch error
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployeesList();
  }, [authUser, loadingAuthUser, authUserError]); // Re-run when authUser or its loading/error state changes

  // Display overall loading states before rendering content
  if (loadingAuthUser || loadingEmployees) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee" subTitle="Home" />
        <div className="p-6 text-center">
          <p>Loading employee directory...</p>
        </div>
      </div>
    );
  }

  // Display error messages
  if (fetchError) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee" subTitle="Home" />
        <div className="p-6 text-center text-red-600">Error: {fetchError}</div>
      </div>
    );
  }

  // If we reach here, it means loading is complete and no errors occurred,
  // but we still need to check if authUser exists before proceeding to render.
  // This check also covers the case where authUser becomes null after loading.
  if (!authUser) {
      return (
        <div className="app__slide-wrapper">
          <Breadcrumb breadTitle="Employee" subTitle="Home" />
          <div className="p-6 text-center">Please log in to view the employee directory.</div>
        </div>
      );
  }

  // Render the employee list once data is ready
  return (
    <>
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Employee" subTitle="Home" />
        <EmployeeFilter /> {/* EmployeeFilter is retained as per your request */}
        <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
          {employees.length === 0 ? (
            <p className="col-span-12 p-6 text-center text-gray-600">No employees found in your company. Add some new employees!</p>
          ) : (
            employees.map((employee, index) => {
              // Debug logging for each employee before rendering
              console.log(`=== RENDERING EMPLOYEE ${index + 1} ===`);
              console.log('Employee object:', employee);
              console.log('Employee UID:', employee.uid);
              console.log('Employee UID type:', typeof employee.uid);
              console.log('Employee name:', employee.fullName);
              console.log('Generated link:', `/hrm/employee-profile?uid=${employee.uid}`);
              console.log('=== END EMPLOYEE RENDER DEBUG ===');
              
              return (
                <li key={employee.uid || `employee-${index}`} className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3">
                  <Link 
                    href={`/hrm/employee-profile?uid=${employee.uid}`}
                    className="block hover:no-underline"
                    onClick={(e) => {
                      console.log('=== LINK CLICKED ===');
                      console.log('Clicked employee UID:', employee.uid);
                      console.log('Navigation URL:', `/hrm/employee-profile?uid=${employee.uid}`);
                      console.log('Current window location before nav:', window.location.href);
                      console.log('=== END LINK CLICK ===');
                      
                      // Check if UID is valid before navigation
                      if (!employee.uid || employee.uid === 'undefined' || employee.uid === 'null') {
                        e.preventDefault();
                        console.error('Invalid UID detected, preventing navigation');
                        toast.error('Invalid employee ID. Please try again.');
                        return false;
                      }
                    }}
                  >
                    <EmployeeSingleCard employee={employee} />
                  </Link>
                </li>
              );
            })
          )}
        </div>

        {/* The "Load More" button would typically involve pagination logic,
            which is outside the scope of this update but kept for structure. */}
        {employees.length > 0 && ( // Only show Load More if there are employees
          <div className="flex justify-center mt-[20px] mb-[20px]">
            <button type="button" className="btn btn-primary">
              Load More
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default EmployeeMainArea;
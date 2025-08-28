// components/ExperienceDetails.tsx
"use client";
import React, { useState, useEffect } from "react";
import UpdateExperienceDetailsModal from "./UpdateExperienceDetailsModal";
import Link from "next/link";
import { IEmployee } from "@/interface";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WorkExperience } from "@/interface"; // Centralized WorkExperience type

interface propsType {
  data: IEmployee | any;
}

const ExperienceDetails = ({ data }: propsType) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch work experiences from database (now from 'users' collection)
  useEffect(() => {
    if (!data?.uid) {
      setLoading(false);
      return;
    }

    // Reference the 'users' collection
    const userRef = doc(db, "users", data.uid);
    
    const unsubscribe = onSnapshot(
      userRef, // Use userRef here
      (docSnap) => {
        if (docSnap.exists()) {
          // Get data from the user document
          const userData = docSnap.data();
          const workExperiences = userData.workExperience || []; // Access workExperience from user data
          
          // Sort experiences by start date (most recent first)
          const sortedExperiences = workExperiences.sort((a: any, b: any) => {
            const dateA = convertTimestampToDate(a.periodFrom);
            const dateB = convertTimestampToDate(b.periodFrom);
            
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            return dateB.getTime() - dateA.getTime();
          });
          
          setExperiences(sortedExperiences);
        } else {
          setExperiences([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching work experience:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [data?.uid]);

  // Helper function to convert Firestore timestamp to Date
  const convertTimestampToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Handle Date objects
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // Handle string dates or numbers
    return new Date(timestamp);
  };

  // Format date for display
  const formatDate = (date: any) => {
    if (!date) return "";
    
    const dateObj = convertTimestampToDate(date);
    if (!dateObj || isNaN(dateObj.getTime())) return "";
    
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // Format period display
  const formatPeriod = (periodFrom: any, periodTo: any, isCurrentJob: boolean) => {
    const fromDate = formatDate(periodFrom);
    
    if (isCurrentJob) {
      return `${fromDate} - Present`;
    }
    
    const toDate = formatDate(periodTo);
    return `${fromDate} - ${toDate}`;
  };

  return (
    <>
      <div className="col-span-12 md:col-span-6">
        <div className="card__wrapper">
          <div className="employee__profile-single-box relative">
            <div className="card__title-wrap flex align-center justify-between mb-[15px]">
              <h5 className="card__heading-title">Experience Details</h5>
              <button className="edit-icon" onClick={() => setModalOpen(true)}>
                <i className="fa-solid fa-pencil"></i>
              </button>
            </div>
            
            <div className="education__box">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading experiences...</p>
                </div>
              ) : experiences.length > 0 ? (
                <ul className="education__list">
                  {experiences.map((experience, index) => (
                    <li key={experience.id || index}>
                      <div className="education__user">
                        <div className="before__circle"></div>
                      </div>
                      <div className="education__content">
                        <div className="timeline-content">
                          <Link href="#" className="name">
                            {experience.companyName}
                          </Link>
                          <span className="degree">{experience.position}</span>
                          <span className="year">
                            {formatPeriod(
                              experience.periodFrom, 
                              experience.periodTo, 
                              experience.isCurrentJob as boolean // Type assertion
                            )}
                          </span>
                          {experience.description && (
                            <p className="description mt-1 text-sm text-gray-600">
                              {experience.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <i className="fa-solid fa-briefcase text-2xl mb-2"></i>
                  <p>No work experience added yet</p>
                  <button 
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => setModalOpen(true)}
                  >
                    Add Experience
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {modalOpen && (
        <UpdateExperienceDetailsModal 
          open={modalOpen} 
          setOpen={setModalOpen}
          data={data}
          experiences={experiences}
        />
      )}
    </>
  );
};

export default ExperienceDetails;
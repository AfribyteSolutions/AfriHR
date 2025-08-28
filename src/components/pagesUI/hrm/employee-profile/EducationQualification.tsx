"use client";
import React, { useState, useEffect } from "react";
import UpdateEducationQualificationModal from "./UpdateEducationQualificationModal";
import Link from "next/link";
import { IEmployee, IEducation } from "@/interface"; // Import IEducation
import { doc, onSnapshot } from "firebase/firestore"; // Import Firestore functions
import { db } from "@/lib/firebase"; // Your Firebase instance

interface propsType {
  data: IEmployee | any;
}

const EducationQualification = ({ data }: propsType) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [educationList, setEducationList] = useState<IEducation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch education data from the 'users' collection
  useEffect(() => {
    if (!data?.uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", data.uid); // Reference the 'users' collection

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          // Assuming education data is stored as an array under 'education' field
          const educationData = userData.education || [];

          // Sort education by end year (most recent first)
          const sortedEducation = educationData.sort((a: any, b: any) => {
            const yearA = parseInt(a.yearEnd, 10);
            const yearB = parseInt(b.yearEnd, 10);
            return yearB - yearA;
          });
          
          setEducationList(sortedEducation);
        } else {
          setEducationList([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching education data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup on unmount
  }, [data?.uid]);

  return (
    <>
      <div className="col-span-12 md:col-span-12 xl:col-span-6 xxl:col-span-6">
        <div className="card__wrapper">
          <div className="employee__profile-single-box relative">
            <div className="card__title-wrap flex align-center justify-between mb-[15px]">
              <h5 className="card__heading-title">Education Qualification</h5>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="edit-icon"
              >
                <i className="fa-solid fa-pencil"></i>
              </button>
            </div>
            <div className="education__box">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading education...</p>
                </div>
              ) : educationList.length > 0 ? (
                <ul className="education__list">
                  {educationList.map((education, index) => (
                    <li key={education.id || index}>
                      <div className="education__user">
                        <div className="before__circle"></div>
                      </div>
                      <div className="education__content">
                        <div className="timeline-content">
                          <Link href="#" className="name">
                            {education.institute}
                          </Link>
                          <span className="degree">{education.degree}</span>
                          <span className="year">
                            {education.yearStart} - {education.yearEnd}
                          </span>
                          {education.description && (
                            <p className="description mt-1 text-sm text-gray-600">
                              {education.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <i className="fa-solid fa-graduation-cap text-2xl mb-2"></i>
                  <p>No education details added yet</p>
                  <button 
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => setModalOpen(true)}
                  >
                    Add Education
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UpdateEducationQualificationModal
          open={modalOpen}
          setOpen={setModalOpen}
          data={data} // Pass employee data (including uid)
          educationList={educationList} // Pass existing education data to modal
        />
      )}
    </>
  );
};

export default EducationQualification;
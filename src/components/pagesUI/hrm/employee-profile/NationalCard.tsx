// components/employee/NationalCard.tsx
"use client";
import React, { useState, useEffect } from "react";
import UpdateNationalCardModal from "./UpdateNationalCardModal.tsx";
import { IEmployee, INationalCard } from "@/interface";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface propsType {
  data: IEmployee | any;
}

const NationalCard = ({ data }: propsType) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [nationalCard, setNationalCard] = useState<INationalCard | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch national card data from the 'users' collection
  useEffect(() => {
    if (!data?.uid) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", data.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setNationalCard(userData.nationalCard || null);
        } else {
          setNationalCard(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching national card information:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [data?.uid]);

  // Updated function with proper typing for Firestore Timestamps
  const formatDate = (date: Date | Timestamp | string | null | undefined): string => {
    if (!date) return "N/A";
    
    // Handle regular Date objects
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    
    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return (date as Timestamp).toDate().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    
    return "N/A";
  };

  return (
    <>
      <div className="col-span-12 md:col-span-6 xl:col-span-4 xxl:col-span-4">
        <div className="card__wrapper">
          <div className="employee__profile-single-box relative">
            <div className="card__title-wrap flex align-center justify-between mb-[15px]">
              <h5 className="card__heading-title">National Card Information</h5>
              <button
                onClick={() => setModalOpen(true)}
                className="edit-icon"
              >
                <i className="fa-solid fa-pencil"></i>
              </button>
            </div>
            <div className="personal-info-wrapper bank__account">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading national card info...</p>
                </div>
              ) : nationalCard ? (
                <ul className="personal-info">
                  <li>
                    <div className="title">Card Number:</div>
                    <div className="text">{nationalCard.cardNumber || "N/A"}</div>
                  </li>
                  <li>
                    <div className="title">Issue Date:</div>
                    <div className="text">{formatDate(nationalCard.issueDate)}</div>
                  </li>
                  <li>
                    <div className="title">Expiry Date:</div>
                    <div className="text">{formatDate(nationalCard.expiryDate)}</div>
                  </li>
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <i className="fa-solid fa-id-card text-2xl mb-2"></i>
                  <p>No national card information added yet</p>
                  <button 
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => setModalOpen(true)}
                  >
                    Add National Card
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UpdateNationalCardModal 
          open={modalOpen} 
          setOpen={setModalOpen}
          data={data}
          nationalCard={nationalCard}
        />
      )}
    </>
  );
};

export default NationalCard;
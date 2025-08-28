"use client";
import React, { useState, useEffect } from "react";
import UpdateBankAccountModal from "./UpdateBankAccountModal";
import { IEmployee, IBankAccount } from "@/interface";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface propsType {
  data: IEmployee | any;
}

const BankAccount = ({ data }: propsType) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [bankAccount, setBankAccount] = useState<IBankAccount | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch bank account data from the 'users' collection
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
          setBankAccount(userData.bankAccount || null);
        } else {
          setBankAccount(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching bank account:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [data?.uid]);

  return (
    <>
      <div className="col-span-12 md:col-span-6 xl:col-span-4">
        <div className="card__wrapper">
          <div className="employee__profile-single-box relative">
            <div className="card__title-wrap flex align-center justify-between mb-[15px]">
              <h5 className="card__heading-title">Bank Account</h5>
              <button
                type="button"
                className="edit-icon"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-pencil"></i>
              </button>
            </div>
            <div className="personal-info-wrapper bank__account">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading bank details...</p>
                </div>
              ) : bankAccount ? (
                <ul className="personal-info">
                  <li>
                    <div className="title">Account Holder Name:</div>
                    <div className="text">{bankAccount.accountHolderName}</div>
                  </li>
                  <li>
                    <div className="title">Account Number:</div>
                    <div className="text">{bankAccount.accountNumber}</div>
                  </li>
                  <li>
                    <div className="title">Bank Name:</div>
                    <div className="text">{bankAccount.bankName}</div>
                  </li>
                  <li>
                    <div className="title">Branch Name:</div>
                    <div className="text">{bankAccount.branchName}</div>
                  </li>
                  <li>
                    <div className="title">SWIFT Code:</div>
                    <div className="text">{bankAccount.swiftCode || "N/A"}</div>
                  </li>
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <i className="fa-solid fa-building-columns text-2xl mb-2"></i>
                  <p>No bank account information added yet</p>
                  <button 
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => setModalOpen(true)}
                  >
                    Add Bank Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UpdateBankAccountModal 
          open={modalOpen} 
          setOpen={setModalOpen}
          data={data}
          bankAccount={bankAccount}
        />
      )}
    </>
  );
};

export default BankAccount;
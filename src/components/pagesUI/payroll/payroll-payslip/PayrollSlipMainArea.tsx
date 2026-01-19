"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import React, { useEffect, useState } from "react";
import PayslipAndBillingAddress from "./PayslipAndBillingAddress";
import EarningTable from "./EarningTable";
import DeductionTable from "./DeductionTable";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, limit } from "firebase/firestore";
import useAuth from "@/hooks/useAuth";
import { Company } from "@/types/company";

const PayrollSlipMainArea = () => {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [payrollData, setPayrollData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Don't run if we don't have a user yet and no ID in URL
      const urlId = searchParams.get("id");
      if (!user?.uid && !urlId) return;

      setLoading(true);
      try {
        let currentPayroll: any = null;

        if (urlId) {
          // Admin View: Fetch by ID
          const payrollRef = doc(db, "payrolls", urlId);
          const payrollSnap = await getDoc(payrollRef);
          if (payrollSnap.exists()) {
            currentPayroll = { id: payrollSnap.id, ...payrollSnap.data() };
          }
        } else if (user?.uid) {
          // Employee View: Auto-fetch their own latest payslip
          const q = query(
            collection(db, "payrolls"), 
            where("employeeUid", "==", user.uid),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            currentPayroll = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          }
        }

        if (currentPayroll) {
          setPayrollData(currentPayroll);
          
          // Fetch Company details using companyId from the payroll record
          const companyRef = doc(db, "companies", currentPayroll.companyId);
          const companySnap = await getDoc(companyRef);
          if (companySnap.exists()) {
            setCompanyData(companySnap.data() as Company);
          }
        }
      } catch (error) {
        console.error("Error loading payslip data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, searchParams]);

  const handleSendEmail = async () => {
    if (!payrollData || !companyData) return;
    
    setIsSending(true);
    try {
      const response = await fetch("/api/payroll/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          payrollId: payrollData.id, 
          companyId: payrollData.companyId 
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Official payslip with signatures sent successfully!");
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      alert("Failed to connect to the server.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!payrollData) return <div className="p-10 text-center">No Payslip found.</div>;

  return (
    <div className="app__slide-wrapper">
      <Breadcrumb breadTitle="Payslip" subTitle="Home" />
      <div className="grid grid-cols-12 justify-center">
        <div className="col-span-12">
          <div className="card__wrapper">
            <PayslipAndBillingAddress payroll={payrollData} company={companyData} />
            <EarningTable payroll={payrollData} />
            <DeductionTable payroll={payrollData} />

            <div className="payslip__payment-details mt-[25px]">
              <h5 className="card__heading-title mb-[15px]">Payment Details:</h5>
              <p className="text-muted">Account Name: <span>{payrollData.employeeName}</span></p>
              <p className="text-muted">Net Payable: <span>${payrollData.netPay}</span></p>
            </div>

            {/* Official Signatures Section */}
            {companyData?.signature1 && (
              <div className="mt-10 border-t pt-5 flex justify-end">
                <div className="text-center">
                  <img src={companyData.signature1} alt="Signature" className="h-16 w-auto" />
                  <p className="text-xs text-muted">Authorized Signatory</p>
                </div>
              </div>
            )}

            <div className="payslip-line"></div>

            <div className="flex flex-wrap lg:justify-end gap-[10px] mt-5">
              <button className="btn btn-info" onClick={() => window.print()}>
                <i className="fa-sharp fa-regular fa-eye"></i> Print
              </button>
              
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSendEmail}
                disabled={isSending}
              >
                <i className={`fa-light ${isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i> 
                {isSending ? " Sending..." : " Send Email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollSlipMainArea;
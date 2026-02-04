// app/dashboard/payroll/payroll-payslip/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PayslipAndBillingAddress from "@/components/pagesUI/payroll/payroll-payslip/PayslipAndBillingAddress";
import EarningTable from "@/components/pagesUI/payroll/payroll-payslip/EarningTable";
import DeductionTable from "@/components/pagesUI/payroll/payroll-payslip/DeductionTable";

const PayslipPage = () => {
  const searchParams = useSearchParams();
  const payrollId = searchParams.get("id");
  const [payroll, setPayroll] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!payrollId) return;
      try {
        // 1. Fetch Payroll Record
        const payDoc = await getDoc(doc(db, "payrolls", payrollId));
        if (payDoc.exists()) {
          const payData = payDoc.data();
          setPayroll({ id: payDoc.id, ...payData });

          // 2. Fetch Company Info using companyId from payroll
          if (payData.companyId) {
            const compDoc = await getDoc(doc(db, "companies", payData.companyId));
            if (compDoc.exists()) setCompany(compDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching payslip:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [payrollId]);

  if (loading) return <div>Loading Payslip...</div>;
  if (!payroll) return <div>Payslip not found.</div>;

  return (
    <div className="card__wrapper p-10 bg-white dark:bg-card-dark rounded-3xl">
      {/* PASSING THE REQUIRED PROPS HERE FIXES THE ERROR */}
      <PayslipAndBillingAddress payroll={payroll} company={company} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <EarningTable payroll={payroll} />
        <DeductionTable payroll={payroll} />
      </div>
    </div>
  );
};

export default PayslipPage;
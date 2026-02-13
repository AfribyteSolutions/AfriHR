"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link"; 
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import useAuth from "@/hooks/useAuth";
import PayslipAndBillingAddress from "./PayslipAndBillingAddress";
import EarningTable from "./EarningTable";
import DeductionTable from "./DeductionTable";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import { IPaylist } from "@/interface/table.interface";

const PayrollSlipMainArea = () => {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [allPayslips, setAllPayslips] = useState<IPaylist[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<IPaylist | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const activeId = searchParams.get("id");

  const monthToNumber = (m: string) => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months.indexOf(m) + 1;
  };

  useEffect(() => {
    const fetchPayslips = async () => {
      // Exit if we have no user session and no specific ID to look up
      if (!user?.uid && !activeId) return;
      
      try {
        setLoading(true);

        // 1. Fetch the specific record requested in the URL
        let targetPayroll: IPaylist | null = null;
        if (activeId) {
          const targetSnap = await getDoc(doc(db, "payrolls", activeId));
          if (targetSnap.exists()) {
            targetPayroll = { 
              id: targetSnap.id, 
              ...targetSnap.data() 
            } as IPaylist;
          }
        }

        /**
         * 2. Determine whose history to show.
         * If a manager is viewing an ID, show the history for THAT employee.
         * Otherwise, show the logged-in user's own history.
         */
        const ownerUid = targetPayroll ? targetPayroll.employeeUid : user?.uid;

        if (ownerUid) {
          const q = query(
            collection(db, "payrolls"), 
            where("employeeUid", "==", ownerUid),
            where("status", "==", "Paid") 
          );
          
          const snap = await getDocs(q);
          let history = snap.docs.map(d => ({ 
            id: d.id, 
            ...d.data(),
            salaryYear: Number(d.data().salaryYear || d.data().year),
            salaryMonth: d.data().salaryMonth || monthToNumber(d.data().month)
          })) as IPaylist[];

          // Sort History Newest First
          history.sort((a, b) => {
            if (b.salaryYear !== a.salaryYear) return b.salaryYear - a.salaryYear;
            return b.salaryMonth - a.salaryMonth;
          });

          setAllPayslips(history);

          // 3. Selection Logic
          const current = targetPayroll || (history.length > 0 ? history[0] : null);

          if (current) {
            setSelectedPayroll(current);
            const compSnap = await getDoc(doc(db, "companies", current.companyId));
            if (compSnap.exists()) setCompanyData(compSnap.data());
          }
        }
      } catch (e) {
        console.error("Load Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
  }, [user?.uid, activeId]);

  if (loading) return <div className="p-10 text-center">Loading Records...</div>;
  if (!selectedPayroll && allPayslips.length === 0) return <div className="p-10 text-center dark:text-white">No records found.</div>;

  return (
    <div className="app__slide-wrapper">
      <Breadcrumb breadTitle="Payment History" subTitle="Home" />
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar: Shows history ONLY for the selected employee */}
        <div className="col-span-12 lg:col-span-4">
          <div className="card__wrapper dark:bg-[#1e293b] dark:border-slate-800">
            <h6 className="font-bold mb-4 dark:text-white">Payslip History</h6>
            <div className="space-y-2">
              {allPayslips.map(p => (
                <Link 
                  key={p.id} 
                  href={`?id=${p.id}`} 
                  className={`block p-4 border rounded-lg transition-colors ${
                    selectedPayroll?.id === p.id 
                    ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-500' 
                    : 'bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold block dark:text-slate-200">{p.month} {p.year}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{p.employeeName}</span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {Number(p.netPay).toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main View: Correctly scoped to the employee, not the manager */}
        <div className="col-span-12 lg:col-span-8">
          {selectedPayroll && (
            <div className="card__wrapper dark:bg-[#1e293b] dark:border-slate-800" id="printable-area">
              <div className="flex justify-between items-center mb-6 no-print">
                <h5 className="font-bold dark:text-white">
                  Payslip - {selectedPayroll.employeeName} ({selectedPayroll.month} {selectedPayroll.year})
                </h5>
                <button 
                  onClick={() => window.print()} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  <i className="fa-solid fa-print mr-2"></i> Print PDF
                </button>
              </div>
              <PayslipAndBillingAddress payroll={selectedPayroll} company={companyData} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <EarningTable payroll={selectedPayroll} />
                <DeductionTable payroll={selectedPayroll} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollSlipMainArea;
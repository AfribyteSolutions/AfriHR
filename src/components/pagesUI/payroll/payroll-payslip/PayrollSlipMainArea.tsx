"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link"; 
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import useAuth from "@/hooks/useAuth";
import PayslipAndBillingAddress from "./PayslipAndBillingAddress";
import EarningTable from "./EarningTable";
import DeductionTable from "./DeductionTable";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";

// Define an interface to satisfy TypeScript
interface IPayrollRecord {
  id: string;
  companyId: string;
  employeeUid?: string;
  employeeId?: string;
  employeeName: string;
  month: string;
  year: string | number;
  salaryMonthly: number;
  netPay: number;
  totalEarnings: number;
  totalDeductions: number;
  status: string;
  email?: string;
  employeeEmail?: string;
  [key: string]: any; // Allow for other dynamic fields
}

const PayrollSlipMainArea = () => {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Use the interface for state
  const [allPayslips, setAllPayslips] = useState<IPayrollRecord[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<IPayrollRecord | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  const activeId = searchParams.get("id");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setDebugInfo("No user logged in");
        setLoading(false);
        return;
      }
      
      try {
        // Get user's email from Firebase Auth
        const userEmail = user.email;
        
        console.log("=== PAYSLIP FETCH DEBUG ===");
        console.log("User UID:", user.uid);
        console.log("User Email:", userEmail);
        
        // Try multiple query strategies to find payslips
        let history: IPayrollRecord[] = [];
        
        // Strategy 1: Try by employeeUid
        try {
          const q1 = query(
            collection(db, "payrolls"), 
            where("employeeUid", "==", user.uid),
            where("status", "==", "paid")
          );
          const snap1 = await getDocs(q1);
          console.log("Query by employeeUid found:", snap1.docs.length, "records");
          
          if (snap1.docs.length > 0) {
            history = snap1.docs.map(d => ({ 
              id: d.id, 
              ...d.data() 
            })) as IPayrollRecord[];
          }
        } catch (err) {
          console.log("Query by employeeUid failed:", err);
        }
        
        // Strategy 2: If no results, try by email
        if (history.length === 0 && userEmail) {
          try {
            const q2 = query(
              collection(db, "payrolls"), 
              where("email", "==", userEmail),
              where("status", "==", "paid")
            );
            const snap2 = await getDocs(q2);
            console.log("Query by email found:", snap2.docs.length, "records");
            
            if (snap2.docs.length > 0) {
              history = snap2.docs.map(d => ({ 
                id: d.id, 
                ...d.data() 
              })) as IPayrollRecord[];
            }
          } catch (err) {
            console.log("Query by email failed:", err);
          }
        }
        
        // Strategy 3: If still no results, try by employeeEmail
        if (history.length === 0 && userEmail) {
          try {
            const q3 = query(
              collection(db, "payrolls"), 
              where("employeeEmail", "==", userEmail),
              where("status", "==", "paid")
            );
            const snap3 = await getDocs(q3);
            console.log("Query by employeeEmail found:", snap3.docs.length, "records");
            
            if (snap3.docs.length > 0) {
              history = snap3.docs.map(d => ({ 
                id: d.id, 
                ...d.data() 
              })) as IPayrollRecord[];
            }
          } catch (err) {
            console.log("Query by employeeEmail failed:", err);
          }
        }
        
        // Sort by createdAt if available
        history.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        console.log("Total payslips found:", history.length);
        console.log("Payslips:", history);
        
        setDebugInfo(`Found ${history.length} payslips for user ${userEmail}`);
        setAllPayslips(history);

        let currentPayroll: IPayrollRecord | null = null;
        
        if (activeId) {
          currentPayroll = history.find(p => p.id === activeId) || null;
        } else if (history.length > 0) {
          currentPayroll = history[0];
        }

        if (currentPayroll) {
          setSelectedPayroll(currentPayroll);
          
          // Fetch company details using the companyId from the payroll record
          const companyRef = doc(db, "companies", currentPayroll.companyId);
          const companySnap = await getDoc(companyRef);
          
          if (companySnap.exists()) {
            setCompanyData(companySnap.data());
          }
        }
      } catch (e) { 
        console.error("Fetch error:", e);
        setDebugInfo(`Error: ${e}`);
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [user, activeId]);

  if (loading) return <div className="p-10 text-center">Loading Payslips...</div>;
  
  if (allPayslips.length === 0) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="My Payslips" subTitle="Home" />
        <div className="card__wrapper text-center p-20">
           <i className="fa-light fa-file-invoice-dollar text-6xl mb-4 text-gray-200"></i>
           <p className="text-muted">No official payslips found yet. Records appear here once marked as paid.</p>
           
           
        </div>
      </div>
    );
  }

  return (
    <div className="app__slide-wrapper">
      <Breadcrumb breadTitle="My Payslips" subTitle="Home" />
      <div className="grid grid-cols-12 gap-6">
        
        {/* History Sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <div className="card__wrapper">
            <h5 className="mb-4 font-bold">Payment History</h5>
            <div className="space-y-2">
              {allPayslips.map(p => (
                <Link 
                  key={p.id} 
                  href={`?id=${p.id}`} 
                  className={`block p-4 border rounded-xl transition-all ${
                    (activeId === p.id) || (!activeId && allPayslips[0].id === p.id) 
                    ? 'bg-primary/5 border-primary' 
                    : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold block">{p.month} {p.year}</span>
                      <span className="text-[10px] text-green-600 font-bold uppercase">Official</span>
                    </div>
                    <span className="font-bold text-dark">${p.netPay}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed View */}
        <div className="col-span-12 lg:col-span-8">
          {selectedPayroll ? (
            <div className="card__wrapper">
              <div className="flex justify-between items-center mb-6">
                <h5 className="card__heading-title">Earnings Statement - {selectedPayroll.month}</h5>
                <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => window.print()}>
                  <i className="fa-light fa-print"></i> Print Payslip
                </button>
              </div>
              
              <div id="printable-area">
                <PayslipAndBillingAddress 
                  payroll={selectedPayroll} 
                  company={companyData} 
                />
                <EarningTable payroll={selectedPayroll} />
                <DeductionTable payroll={selectedPayroll} />
                
                <div className="mt-8 pt-4 border-t border-dashed text-center text-gray-400 text-xs">
                  <p>This is a digitally generated payslip authorized by {companyData?.companyName || 'the company'}.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card__wrapper text-center p-20">
              <p>Select a record from the history to view the full payslip.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollSlipMainArea;
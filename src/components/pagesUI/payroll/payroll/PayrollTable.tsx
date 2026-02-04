"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import useMaterialTableHook from "@/hooks/useMaterialTableHook";
import Link from "next/link";
import { IPaylist } from "@/interface/table.interface"; 
import EditSalaryModal from "./EditSalaryModal";
import DeleteModal from "@/components/common/DeleteModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import PayrollFilters from "./PayrollFilters";
import { db, auth } from "@/lib/firebase";
import { collection, doc, getDocs, query, where, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useAuthState } from "react-firebase-hooks/auth";

const PayrollTable: React.FC = () => {
  const [user, authLoading] = useAuthState(auth);
  const [payrollData, setPayrollData] = useState<IPaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<IPaylist | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const [startMonth, setStartMonth] = useState<number>(1);
  const [endMonth, setEndMonth] = useState<number>(12);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const fetchPayroll = async (cId: string) => {
    try {
      setLoading(true);
      const q = query(collection(db, "payrolls"), where("companyId", "==", cId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        salaryMonth: d.data().salaryMonth || (months.indexOf(d.data().month) + 1),
        salaryYear: Number(d.data().salaryYear || d.data().year)
      })) as IPaylist[];
      setPayrollData(data);
    } catch (err) {
      toast.error("Failed to load payroll database");
    } finally { setLoading(false); }
  };

  const handleStatusToggle = async (row: IPaylist) => {
    // 1. BLOCK: If already paid, don't allow changing back to unpaid
    if (row.status === "Paid") {
      toast.error("Confirmed payments cannot be reversed.");
      return;
    }

    // 2. CONFIRM: Show a modal before marking as Paid
    const confirmPay = window.confirm(
      `Confirm payment for ${row.employeeName}? \nOnce marked as Paid, a payslip will be generated and emailed. This action cannot be undone.`
    );

    if (!confirmPay) return;

    const newStatus = "Paid";
    const original = [...payrollData];
    
    setPayrollData(prev => prev.map(item => item.id === row.id ? { ...item, status: newStatus } : item));

    try {
      const res = await fetch(`/api/payroll?id=${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          emailStatus: "Pending",
          paidAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        toast.info("Generating and sending payslip...");
        const emailRes = await fetch(`/api/payroll/send-payslip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payrollId: row.id })
        });
        
        if (emailRes.ok) toast.success("Payment confirmed and Payslip sent!");
        else toast.warning("Status updated, but email notification failed.");
        
        if (companyId) fetchPayroll(companyId);
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Update failed");
      setPayrollData(original);
    }
  };

  const handleResetForNewMonth = async () => {
    const nextMonthIdx = (new Date().getMonth() + 1) % 12;
    const nextMonthName = months[nextMonthIdx];
    const nextYear = new Date().getFullYear();

    if (!confirm(`Generate payroll placeholders for ${nextMonthName} ${nextYear}?`)) return;

    try {
      toast.loading("Generating next month...");
      const uniqueEmployees = Array.from(new Set(payrollData.map(p => p.employeeUid)));
      
      for (const empUid of uniqueEmployees) {
        const base = payrollData.find(p => p.employeeUid === empUid);
        if (base) {
          await fetch(`/api/payroll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...base,
              id: undefined,
              status: "Unpaid",
              emailStatus: "Pending",
              month: nextMonthName,
              year: nextYear,
              createdAt: new Date()
            })
          });
        }
      }
      toast.dismiss();
      toast.success("New month generated");
      if (companyId) fetchPayroll(companyId);
    } catch (err) {
      toast.error("Generation failed");
    }
  };

  const filteredData = useMemo(() => {
    return payrollData.filter((item) => {
      if (Number(item.salaryYear) !== filterYear) return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      const m = Number(item.salaryMonth);
      return m >= startMonth && m <= endMonth;
    });
  }, [payrollData, filterYear, startMonth, endMonth, statusFilter]);

  const { searchQuery, paginatedRows, handleChangeRowsPerPage, handleSearchChange } = useMaterialTableHook<IPaylist>(filteredData, 10);

  useEffect(() => {
    if (user && !authLoading) {
      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists()) {
          const cId = snap.data().companyId;
          setCompanyId(cId);
          fetchPayroll(cId);
        }
      });
    }
  }, [user, authLoading]);

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">Payroll Records</h2>
        <button 
          onClick={handleResetForNewMonth}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          Generate Next Month
        </button>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800">
           <TableControls rowsPerPage={10} searchQuery={searchQuery} handleChangeRowsPerPage={handleChangeRowsPerPage} handleSearchChange={handleSearchChange} />
           <div className="mt-6">
             <PayrollFilters 
               startMonth={startMonth} setStartMonth={setStartMonth} 
               endMonth={endMonth} setEndMonth={setEndMonth} 
               filterYear={filterYear} setFilterYear={setFilterYear} 
               statusFilter={statusFilter} setStatusFilter={setStatusFilter} 
               onReset={() => { setStartMonth(1); setEndMonth(12); setStatusFilter("All"); }} 
             />
           </div>
        </div>

        <TableContainer>
          <Table>
            <TableHead className="bg-slate-50/50 dark:bg-slate-900/20">
              <TableRow>
                <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest !pl-8 dark:text-slate-400">Staff Member</TableCell>
                <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest dark:text-slate-400">Period</TableCell>
                <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest dark:text-slate-400">Amount</TableCell>
                <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest dark:text-slate-400">Status</TableCell>
                <TableCell align="right" className="!font-black !text-[11px] !uppercase !tracking-widest !pr-8 dark:text-slate-400">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all group">
                  <TableCell className="!pl-8">
                    {/* Fixed text colors for Dark Mode */}
                    <div className="font-bold text-slate-700 dark:text-slate-100">{row.employeeName}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{row.employeeId || "No ID"}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{row.month}</span>
                    <span className="block text-[10px] text-slate-400 font-black">{row.year}</span>
                  </TableCell>
                  <TableCell className="font-black text-blue-600 dark:text-blue-400">{Number(row.netPay).toLocaleString()} FCFA</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleStatusToggle(row)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                        row.status === 'Paid' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-not-allowed' 
                        : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
                      }`}
                    >
                      <i className={`fa-solid ${row.status === 'Paid' ? 'fa-check-circle' : 'fa-clock'} mr-1`}></i>
                      {row.status}
                    </button>
                  </TableCell>
                  <TableCell align="right" className="!pr-8">
                    {/* Always visible actions - Removed opacity-0 */}
                    <div className="flex gap-2 justify-end transition-opacity">
                      <Tooltip title="View/Download Payslip">
                        <Link href={`/payroll/payroll-payslip?id=${row.id}`} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:text-slate-300 transition-colors">
                          <i className="fa-solid fa-file-invoice text-xs"></i>
                        </Link>
                      </Tooltip>
                      <button onClick={() => { setEditData(row); setModalOpen(true); }} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:text-slate-300 transition-colors">
                        <i className="fa-solid fa-pen text-xs"></i>
                      </button>
                      <button onClick={() => { setDeleteId(row.id || ""); setModalDeleteOpen(true); }} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white dark:text-slate-300 transition-colors">
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {modalOpen && editData && <EditSalaryModal open={modalOpen} setOpen={setModalOpen} editData={editData} onSave={() => companyId && fetchPayroll(companyId)} />}
      <DeleteModal open={modalDeleteOpen} setOpen={setModalDeleteOpen} handleDeleteFunc={() => {}} deleteId={deleteId} />
    </div>
  );
};

export default PayrollTable;
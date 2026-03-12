"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip
} from "@mui/material";
import Link from "next/link";
import { IPaylist } from "@/interface/table.interface";
import EditSalaryModal from "./EditSalaryModal";
import { db, auth } from "@/lib/firebase";
import { collection, doc, getDocs, query, where, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useAuthState } from "react-firebase-hooks/auth";
import { ChevronDown, ChevronUp } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface MonthGroup {
  month: string;
  monthNum: number;
  year: number;
  rows: IPaylist[];
}

interface PayrollTableProps {
  onRegisterRefresh?: (fn: () => void) => void;
}

const PayrollTable: React.FC<PayrollTableProps> = ({ onRegisterRefresh }) => {
  const [user, authLoading] = useAuthState(auth);
  const [payrollData, setPayrollData] = useState<IPaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<IPaylist | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<IPaylist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const fetchPayroll = useCallback(async (cId: string) => {
    try {
      setLoading(true);
      const q = query(collection(db, "payrolls"), where("companyId", "==", cId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        salaryMonth: d.data().salaryMonth || (MONTHS.indexOf(d.data().month) + 1),
        salaryYear: Number(d.data().salaryYear || d.data().year)
      })) as IPaylist[];
      setPayrollData(data);
    } catch (err) {
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Register refresh callback with parent
  useEffect(() => {
    if (companyId && onRegisterRefresh) {
      onRegisterRefresh(() => fetchPayroll(companyId));
    }
  }, [companyId, onRegisterRefresh, fetchPayroll]);

  const handleStatusToggle = async (row: IPaylist) => {
    if (row.status === "Paid") {
      toast.error("Confirmed payments cannot be reversed.");
      return;
    }
    const confirmPay = window.confirm(
      `Confirm payment for ${row.employeeName}?\nOnce marked as Paid, a payslip will be generated and emailed. This action cannot be undone.`
    );
    if (!confirmPay) return;

    const original = [...payrollData];
    setPayrollData(prev =>
      prev.map(item => item.id === row.id ? { ...item, status: "Paid" } : item)
    );

    try {
      const res = await fetch(`/api/payroll?id=${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Paid",
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
        if (emailRes.ok) toast.success("Payment confirmed and payslip sent!");
        else toast.warning("Status updated but email failed.");
        if (companyId) fetchPayroll(companyId);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Update failed");
      setPayrollData(original);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const toastId = toast.loading("Deleting payroll record...");

    try {
      const res = await fetch(`/api/payroll?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Delete failed");

      // Non-blocking storage PDF deletion
      fetch(`/api/payroll/delete-payslip`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrollId: deleteTarget.id }),
      }).catch(() => {});

      setPayrollData(prev => prev.filter(p => p.id !== deleteTarget.id));
      toast.success("Payroll record deleted.", { id: toastId });
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete.", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetForNewMonth = async () => {
    const nextMonthIdx = (new Date().getMonth() + 1) % 12;
    const nextMonthName = MONTHS[nextMonthIdx];
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
              salaryMonth: nextMonthIdx + 1,
              year: nextYear,
              salaryYear: nextYear,
              createdAt: new Date()
            })
          });
        }
      }
      toast.dismiss();
      toast.success("New month generated");
      if (companyId) fetchPayroll(companyId);
    } catch {
      toast.error("Generation failed");
    }
  };

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const monthGroups = useMemo<MonthGroup[]>(() => {
    const filtered = payrollData.filter(item => {
      const monthNum = Number(item.salaryMonth);
      const yearNum = Number(item.salaryYear);
      if (!monthNum || !yearNum || isNaN(monthNum) || isNaN(yearNum)) return false;
      if (!item.month || item.month === "undefined" || item.month === "null") return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.employeeName?.toLowerCase().includes(q) ||
          item.employeeId?.toLowerCase().includes(q) ||
          item.month?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const groupMap: Record<string, MonthGroup> = {};
    for (const row of filtered) {
      const key = `${row.salaryYear}-${String(row.salaryMonth).padStart(2, "0")}`;
      if (!groupMap[key]) {
        groupMap[key] = {
          month: row.month || MONTHS[(row.salaryMonth || 1) - 1],
          monthNum: Number(row.salaryMonth),
          year: Number(row.salaryYear),
          rows: [],
        };
      }
      groupMap[key].rows.push(row);
    }

    return Object.entries(groupMap)
      .sort(([a], [b]) => {
        const [aYear, aMonth] = a.split("-").map(Number);
        const [bYear, bMonth] = b.split("-").map(Number);
        if (bYear !== aYear) return bYear - aYear;
        return bMonth - aMonth;
      })
      .map(([, group]) => group);
  }, [payrollData, statusFilter, searchQuery]);

  useEffect(() => {
    if (user && !authLoading) {
      getDoc(doc(db, "users", user.uid)).then(snap => {
        if (snap.exists()) {
          const cId = snap.data().companyId;
          setCompanyId(cId);
          fetchPayroll(cId);
        }
      });
    }
  }, [user, authLoading, fetchPayroll]);

  const totalPaid = payrollData.filter(r => r.status === "Paid").length;
  const totalUnpaid = payrollData.filter(r => r.status !== "Paid").length;

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Payroll Records</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            {monthGroups.length} period{monthGroups.length !== 1 ? "s" : ""} · {totalPaid} paid · {totalUnpaid} unpaid
          </p>
        </div>
        <button
          onClick={handleResetForNewMonth}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shrink-0"
        >
          Generate Next Month
        </button>
      </div>

      {/* Global filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search employee..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 w-56"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] text-sm dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
        </select>
        {(searchQuery || statusFilter !== "All") && (
          <button
            onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Reset
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading payroll...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && monthGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-2 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-bold text-slate-400">No payroll records found</p>
          <p className="text-xs text-slate-300 dark:text-slate-600">Try adjusting your filters or generate a new month</p>
        </div>
      )}

      {/* Month group tables */}
      {!loading && monthGroups.map((group) => {
        const key = `${group.year}-${String(group.monthNum).padStart(2, "0")}`;
        const isCollapsed = collapsed[key];
        const groupPaid = group.rows.filter(r => r.status === "Paid").length;
        const groupTotal = group.rows.reduce((sum, r) => sum + Number(r.netPay || 0), 0);
        const isCurrentMonth =
          group.monthNum === new Date().getMonth() + 1 &&
          group.year === new Date().getFullYear();

        return (
          <div
            key={key}
            className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            {/* Month header */}
            <button
              onClick={() => toggleCollapse(key)}
              className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all"
            >
              <div className="flex items-center gap-3">
                {isCurrentMonth && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    Current
                  </span>
                )}
                <h3 className="text-base font-black dark:text-white">
                  {group.month} {group.year}
                </h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {group.rows.length} employee{group.rows.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex gap-3">
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    {groupPaid}/{group.rows.length} paid
                  </span>
                  <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                    {groupTotal.toLocaleString()} FCFA
                  </span>
                </div>
                {isCollapsed
                  ? <ChevronDown size={16} className="text-slate-400" />
                  : <ChevronUp size={16} className="text-slate-400" />
                }
              </div>
            </button>

            {/* Table */}
            {!isCollapsed && (
              <TableContainer>
                <Table>
                  <TableHead className="bg-slate-50/50 dark:bg-slate-900/20">
                    <TableRow>
                      <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest !pl-8 dark:text-slate-400">Staff Member</TableCell>
                      <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest dark:text-slate-400">Period</TableCell>
                      <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest dark:text-slate-400">Amount</TableCell>
                      <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest dark:text-slate-400">Status</TableCell>
                      <TableCell className="!font-black !text-[11px] !uppercase !tracking-widest dark:text-slate-400">Paid At</TableCell>
                      <TableCell align="right" className="!font-black !text-[11px] !uppercase !tracking-widest !pr-8 dark:text-slate-400">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.rows.map(row => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all"
                      >
                        <TableCell className="!pl-8">
                          <div className="font-bold text-slate-700 dark:text-slate-100">{row.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{row.employeeId || "No ID"}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{row.month}</span>
                          <span className="block text-[10px] text-slate-400 font-black">{row.year}</span>
                        </TableCell>
                        <TableCell className="font-black text-blue-600 dark:text-blue-400">
                          {Number(row.netPay).toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleStatusToggle(row)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                              row.status === "Paid"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-not-allowed"
                                : "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20"
                            }`}
                          >
                            <i className={`fa-solid ${row.status === "Paid" ? "fa-check-circle" : "fa-clock"} mr-1`}></i>
                            {row.status}
                          </button>
                        </TableCell>
                        <TableCell>
                          {row.paidAt ? (
                            <div>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                {new Date(row.paidAt).toLocaleDateString("en-GB", {
                                  day: "numeric", month: "short", year: "numeric"
                                })}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-bold">
                                {new Date(row.paidAt).toLocaleTimeString("en-GB", {
                                  hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold italic">—</span>
                          )}
                        </TableCell>
                        <TableCell align="right" className="!pr-8">
                          <div className="flex gap-2 justify-end">
                            <Tooltip title="View Payslip">
                              <Link
                                href={`/payroll/payroll-payslip?id=${row.id}`}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:text-slate-300 transition-colors"
                              >
                                <i className="fa-solid fa-file-invoice text-xs"></i>
                              </Link>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <button
                                onClick={() => { setEditData(row); setModalOpen(true); }}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:text-slate-300 transition-colors"
                              >
                                <i className="fa-solid fa-pen text-xs"></i>
                              </button>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <button
                                onClick={() => setDeleteTarget(row)}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white dark:text-slate-300 transition-colors"
                              >
                                <i className="fa-solid fa-trash text-xs"></i>
                              </button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        );
      })}

      {/* Edit Modal */}
      {modalOpen && editData && (
        <EditSalaryModal
          open={modalOpen}
          setOpen={setModalOpen}
          editData={editData}
          onSave={() => companyId && fetchPayroll(companyId)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div className="relative bg-white dark:bg-[#1a222c] rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <i className="fa-solid fa-trash text-rose-600 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-black dark:text-white">Delete Payroll Record?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  This will permanently delete the payroll record and payslip PDF for{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {deleteTarget.employeeName}
                  </span>{" "}
                  ({deleteTarget.month} {deleteTarget.year}). This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold transition-all"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollTable;
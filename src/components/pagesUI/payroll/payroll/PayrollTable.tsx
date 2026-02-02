"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import useMaterialTableHook from "@/hooks/useMaterialTableHook";
import Link from "next/link";
import { IPaylist } from "@/interface/payroll.interface";
import { payListHeadCells } from "@/data/table-head-cell/table-head";
import EditSalaryModal from "./EditSalaryModal";
import DeleteModal from "@/components/common/DeleteModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { useAuthState } from "react-firebase-hooks/auth";
// IMPORT YOUR NOTIFICATION HELPER
import { createNotification } from "@/lib/notification";

const PayrollTable: React.FC = () => {
  const [user, authLoading] = useAuthState(auth);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<IPaylist | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [payrollData, setPayrollData] = useState<IPaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const getStatusClass = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "paid": return "bg-success";
      case "unpaid": return "bg-danger";
      default: return "bg-primary";
    }
  };

  const formatCurrency = (value: any): string => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString('fr-FR');
  };

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    if (date && typeof date === 'object' && date._seconds) {
      return new Date(date._seconds * 1000).toLocaleDateString();
    }
    return 'N/A';
  };

  useEffect(() => {
    const getUserCompany = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setCompanyId(userDoc.data().companyId);
      } catch (error) { console.error(error); }
    };
    if (user && !authLoading) getUserCompany();
  }, [user, authLoading]);

  const fetchPayroll = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const q = query(collection(db, "payrolls"), where("companyId", "==", companyId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as IPaylist[];
      setPayrollData(list);
    } catch (err: any) { toast.error("Failed to fetch data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (companyId) fetchPayroll(); }, [companyId]);

  const {
    order, orderBy, searchQuery, paginatedRows,
    handleRequestSort, handleChangeRowsPerPage, handleSearchChange,
  } = useMaterialTableHook<IPaylist>(payrollData, 10);

  // UPDATED FUNCTION: Now accepts the full row object to get employeeUid
  const handleMarkAsPaid = async (row: IPaylist) => {
    const payrollId = row.id;
    if (!payrollId) return;

    try {
      setLoading(true);
      
      // 1. Update status to paid in Database
      const updateResponse = await fetch(`/api/payroll?id=${payrollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "paid",
          emailStatus: "Sending" 
        }),
      });

      if (!updateResponse.ok) throw new Error("Failed to update payroll status");

      // 2. TRIGGER SYSTEM NOTIFICATION
      // This makes the red dot/bell icon update for the employee
      if (row.employeeUid) {
        await createNotification({
          userId: row.employeeUid,
          title: "💰 Payslip Issued",
          message: `Your payslip for ${row.month} ${row.year} has been processed. Net Pay: ${formatCurrency(row.netPay)} FCFA`,
          category: "hr",
          link: `/payroll/payroll-payslip?id=${payrollId}`
        });
      } else {
        console.warn("No employeeUid found for this record. System notification skipped.");
      }

      // 3. TRIGGER EMAIL SENDING
      const emailResponse = await fetch(`/api/payroll/send-payslip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrollId }),
      });

      if (!emailResponse.ok) {
        toast.warning("Marked as Paid and notified in-app, but email failed.");
      } else {
        toast.success("Success! Employee notified via app and email.");
      }

      await fetchPayroll();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/payroll?id=${deleteId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      toast.success("Deleted successfully");
      setModalDeleteOpen(false);
      await fetchPayroll();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <>
      <div className="col-span-12">
        <div className="card__wrapper">
          <div className="manaz-common-mat-list w-full table__wrapper table-responsive">
            <TableControls
              rowsPerPage={10}
              searchQuery={searchQuery}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              handleSearchChange={handleSearchChange}
            />
            <Box sx={{ width: "100%" }}>
              <Paper sx={{ width: "100%", mb: 2 }}>
                <TableContainer className="table mb-[20px] hover w-full">
                  <Table className="whitespace-nowrap">
                    <TableHead>
                      <TableRow className="table__title">
                        {payListHeadCells.map((headCell) => (
                          <TableCell key={headCell.id} sortDirection={orderBy === headCell.id ? order : false}>
                            <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : "asc"} onClick={() => handleRequestSort(headCell.id)}>
                              {headCell.label}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                        <TableCell>Action</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className="table__body">
                      {paginatedRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.employeeId}</TableCell>
                          <TableCell>{row.employeeName}</TableCell>
                          <TableCell>{row.email || row.employeeEmail}</TableCell>
                          <TableCell>{formatDate(row.joiningDate)}</TableCell>
                          <TableCell>{formatCurrency(row.salaryMonthly)} FCFA</TableCell>
                          <TableCell>
                            <span className={`bd-badge ${getStatusClass(row.status)}`}>
                              {row.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-[10px]">
                              <Link href={`/payroll/payroll-payslip?id=${row.id}`} className="table__icon download">
                                <i className="fa-regular fa-eye"></i>
                              </Link>
                              <button type="button" className="table__icon edit" onClick={() => { setEditData(row); setModalOpen(true); }}>
                                <i className="fa-sharp fa-light fa-pen"></i>
                              </button>
                              <button className="table__icon delete" onClick={() => { setDeleteId(row.id || ""); setModalDeleteOpen(true); }}>
                                <i className="fa-regular fa-trash"></i>
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {row.status === 'paid' ? (
                              <div className="text-center">
                                <span className="text-green-500 font-bold block">Paid</span>
                                <span className={`text-[10px] font-semibold ${row.emailStatus === 'Sent' ? 'text-green-600' : 'text-amber-500'}`}>
                                  {row.emailStatus || 'Pending Email'}
                                </span>
                              </div>
                            ) : (
                              <button 
                                type="button" 
                                className="btn btn-sm bg-green-500 text-white hover:bg-green-600" 
                                onClick={() => handleMarkAsPaid(row)} // Passed the whole row
                              >
                                Mark as Paid
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          </div>
        </div>
      </div>
      {modalOpen && editData && <EditSalaryModal open={modalOpen} setOpen={setModalOpen} editData={editData} onSave={fetchPayroll} />}
      {modalDeleteOpen && <DeleteModal open={modalDeleteOpen} setOpen={setModalDeleteOpen} handleDeleteFunc={handleDelete} deleteId={deleteId} />}
    </>
  );
};

export default PayrollTable;
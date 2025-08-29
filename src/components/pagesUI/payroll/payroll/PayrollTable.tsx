/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import Pagination from "@mui/material/Pagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import { visuallyHidden } from "@mui/utils";
import useMaterialTableHook from "@/hooks/useMaterialTableHook";
import Link from "next/link";
import Image from "next/image";
import { IPaylist } from "@/interface/payroll.interface";
import { payListHeadCells } from "@/data/table-head-cell/table-head";
import { useTableStatusHook } from "@/hooks/use-condition-class";
import EditSalaryModal from "./EditSalaryModal";
import DeleteModal from "@/components/common/DeleteModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  getDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { useAuthState } from "react-firebase-hooks/auth";

const PayrollTable: React.FC = () => {
  const [user, authLoading] = useAuthState(auth);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<IPaylist | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [payrollData, setPayrollData] = useState<IPaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Currency formatter helper function
  const formatCurrency = (value: any): string => {
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Date formatter helper function
  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    
    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && date._seconds) {
      return new Date(date._seconds * 1000).toLocaleDateString();
    }
    
    // Handle regular Date object
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    
    // Handle date string
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString();
    }
    
    return 'N/A';
  };

  // Get user's company ID
  useEffect(() => {
    const getUserCompany = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCompanyId(userData.companyId);
        } else {
          setFirebaseError("User data not found");
        }
      } catch (error: any) {
        console.error("Error fetching user company:", error);
        setFirebaseError("Failed to fetch user data");
      }
    };

    if (user && !authLoading) {
      getUserCompany();
    }
  }, [user, authLoading]);

  // Fetch payroll data
  useEffect(() => {
    const fetchPayroll = async () => {
      if (!companyId) return;
      
      try {
        setLoading(true);
        console.log("Fetching payroll for company:", companyId);
        
        // Query payrolls collection with companyId filter
        const q = query(
          collection(db, "payrolls"), 
          where("companyId", "==", companyId)
        );
        
        const snapshot = await getDocs(q);
        const list: IPaylist[] = snapshot.docs.map((docSnap): IPaylist => {
          const data = docSnap.data();
          return {
            // FIXED: Ensure id is always a string
            id: docSnap.id, // Firestore doc ID is always a string
            // Required fields with defaults
            employeeId: data.employeeId || data.employeeUid || '',
            employeeName: data.employeeName || 'Unknown Employee',
            employeeImg: data.employeeImg || '/default-avatar.png',
            designation: data.designation || 'N/A',
            joiningDate: data.joiningDate?.toDate?.() || data.joiningDate || new Date(),
            salaryMonthly: Number(data.salaryMonthly) || 0,
            status: data.status || 'active',
            // Optional fields
            employeeUid: data.employeeUid || data.employeeId,
            email: data.email || data.employeeEmail || '',
            employeeEmail: data.employeeEmail || data.email,
            companyId: data.companyId || companyId,
            dearnessAllowance: Number(data.dearnessAllowance) || 0,
            transportAllowance: Number(data.transportAllowance) || 0,
            mobileAllowance: Number(data.mobileAllowance) || 0,
            bonusAllowance: Number(data.bonusAllowance) || 0,
            providentFund: Number(data.providentFund) || 0,
            securityDeposit: Number(data.securityDeposit) || 0,
            personalLoan: Number(data.personalLoan) || 0,
            earlyLeaving: Number(data.earlyLeaving) || 0,
            totalEarnings: Number(data.totalEarnings) || 0,
            totalDeductions: Number(data.totalDeductions) || 0,
            netPay: Number(data.netPay) || 0,
            // Date fields
            createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
            employeeJoinDate: data.employeeJoinDate?.toDate?.() || data.employeeJoinDate,
            // Additional optional fields that might exist
            ...(data.others && { others: Number(data.others) }),
          };
        });
        
        console.log("Fetched payroll data:", list);
        setPayrollData(list);
        setFirebaseError(null);
      } catch (err: any) {
        console.error("Error fetching payroll:", err);
        setFirebaseError(err.message);
        toast.error("Failed to fetch payroll data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchPayroll();
    }
  }, [companyId]);

  // Hook for sorting, searching, pagination
  const {
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    searchQuery,
    paginatedRows,
    filteredRows,
    handleRequestSort,
    handleClick,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearchChange,
  } = useMaterialTableHook<IPaylist>(payrollData, 10);

  // Debug logs
  useEffect(() => {
    console.log("Initial Payroll Data:", payrollData);
    console.log("Search Query:", searchQuery);
    console.log("Filtered Rows:", filteredRows);
    console.log("Paginated Rows:", paginatedRows);
  }, [payrollData, searchQuery, filteredRows, paginatedRows]);

  // Refresh payroll data
  const refreshPayrollData = async () => {
    if (!companyId) return;
    
    try {
      const q = query(
        collection(db, "payrolls"), 
        where("companyId", "==", companyId)
      );
      const snapshot = await getDocs(q);
      const list: IPaylist[] = snapshot.docs.map((docSnap): IPaylist => {
        const data = docSnap.data();
        return {
          // FIXED: Ensure id is always a string
          id: docSnap.id, // Firestore doc ID is always a string
          // Required fields with defaults
          employeeId: data.employeeId || data.employeeUid || '',
          employeeName: data.employeeName || 'Unknown Employee',
          employeeImg: data.employeeImg || '/default-avatar.png',
          designation: data.designation || 'N/A',
          joiningDate: data.joiningDate?.toDate?.() || data.joiningDate || new Date(),
          salaryMonthly: Number(data.salaryMonthly) || 0,
          status: data.status || 'active',
          // Optional fields
          employeeUid: data.employeeUid || data.employeeId,
          email: data.email || data.employeeEmail || '',
          employeeEmail: data.employeeEmail || data.email,
          companyId: data.companyId || companyId,
          dearnessAllowance: Number(data.dearnessAllowance) || 0,
          transportAllowance: Number(data.transportAllowance) || 0,
          mobileAllowance: Number(data.mobileAllowance) || 0,
          bonusAllowance: Number(data.bonusAllowance) || 0,
          providentFund: Number(data.providentFund) || 0,
          securityDeposit: Number(data.securityDeposit) || 0,
          personalLoan: Number(data.personalLoan) || 0,
          earlyLeaving: Number(data.earlyLeaving) || 0,
          totalEarnings: Number(data.totalEarnings) || 0,
          totalDeductions: Number(data.totalDeductions) || 0,
          netPay: Number(data.netPay) || 0,
          // Date fields
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
          employeeJoinDate: data.employeeJoinDate?.toDate?.() || data.employeeJoinDate,
          // Additional optional fields that might exist
          ...(data.others && { others: Number(data.others) }),
        };
      });
      setPayrollData(list);
    } catch (err: any) {
      console.error("Error refreshing payroll data:", err);
      toast.error("Failed to refresh data");
    }
  };

  // Delete payroll record using API
  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/payroll?id=${deleteId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete payroll");
      }

      toast.success("Payroll record deleted successfully!");
      setModalDeleteOpen(false);
      await refreshPayrollData();
    } catch (err: any) {
      console.error("Error deleting payroll:", err);
      toast.error("Error deleting record: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit payroll record - updated to use API
  const handleEditSalary = async (updatedData: IPaylist) => {
    if (!updatedData.id) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/payroll?id=${updatedData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: updatedData.employeeName,
          salaryMonthly: Number(updatedData.salaryMonthly) || 0,
          dearnessAllowance: Number(updatedData.dearnessAllowance) || 0,
          transportAllowance: Number(updatedData.transportAllowance) || 0,
          mobileAllowance: Number(updatedData.mobileAllowance) || 0,
          bonusAllowance: Number(updatedData.bonusAllowance) || 0,
          others: Number((updatedData as any).others) || 0,
          providentFund: Number(updatedData.providentFund) || 0,
          securityDeposit: Number(updatedData.securityDeposit) || 0,
          personalLoan: Number(updatedData.personalLoan) || 0,
          earlyLeaving: Number(updatedData.earlyLeaving) || 0,
          // Calculate totals
          totalEarnings:
            (Number(updatedData.salaryMonthly) || 0) +
            (Number(updatedData.dearnessAllowance) || 0) +
            (Number(updatedData.transportAllowance) || 0) +
            (Number(updatedData.mobileAllowance) || 0) +
            (Number(updatedData.bonusAllowance) || 0) +
            (Number((updatedData as any).others) || 0),
          totalDeductions:
            (Number(updatedData.providentFund) || 0) +
            (Number(updatedData.securityDeposit) || 0) +
            (Number(updatedData.personalLoan) || 0) +
            (Number(updatedData.earlyLeaving) || 0),
          netPay:
            ((Number(updatedData.salaryMonthly) || 0) +
              (Number(updatedData.dearnessAllowance) || 0) +
              (Number(updatedData.transportAllowance) || 0) +
              (Number(updatedData.mobileAllowance) || 0) +
              (Number(updatedData.bonusAllowance) || 0) +
              (Number((updatedData as any).others) || 0)) -
            ((Number(updatedData.providentFund) || 0) +
              (Number(updatedData.securityDeposit) || 0) +
              (Number(updatedData.personalLoan) || 0) +
              (Number(updatedData.earlyLeaving) || 0)),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update payroll");
      }

      toast.success("Salary updated successfully!");
      setModalOpen(false);
      await refreshPayrollData();
    } catch (err: any) {
      console.error("Error updating salary:", err);
      toast.error("Error updating salary: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark payroll as paid
  const handleMarkAsPaid = async (payrollId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll?id=${payrollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to mark payroll as paid");
      }

      toast.success("Payroll marked as paid successfully!");
      await refreshPayrollData();
    } catch (err: any) {
      console.error("Error marking payroll as paid:", err);
      toast.error("Error marking payroll as paid: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading states
  if (authLoading) return <p className="p-4 text-center">Loading user data...</p>;
  if (!user) return <p className="p-4 text-center">Please sign in to view payroll data.</p>;
  if (loading) return <p className="p-4 text-center">Loading payroll data...</p>;
  if (firebaseError) return <p className="p-4 text-center text-red-600">Error: {firebaseError}</p>;

  return (
    <>
      <div className="col-span-12">
        <div className="card__wrapper">
          <div className="manaz-common-mat-list w-full table__wrapper table-responsive mat-list-without-checkbox">
            <TableControls
              rowsPerPage={rowsPerPage}
              searchQuery={searchQuery}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              handleSearchChange={handleSearchChange}
            />
            <Box sx={{ width: "100%" }} className="table-responsive">
              <Paper sx={{ width: "100%", mb: 2 }}>
                <TableContainer className="table mb-[20px] hover multiple_tables w-full">
                  <Table aria-labelledby="tableTitle" className="whitespace-nowrap">
                    <TableHead>
                      <TableRow className="table__title">
                        {payListHeadCells.map((headCell) => (
                          <TableCell
                            className="table__title"
                            key={headCell.id}
                            sortDirection={orderBy === headCell.id ? order : false}
                          >
                            <TableSortLabel
                              active={orderBy === headCell.id}
                              direction={orderBy === headCell.id ? order : "asc"}
                              onClick={() => handleRequestSort(headCell.id)}
                            >
                              {headCell.label}
                              {orderBy === headCell.id ? (
                                <Box component="span" sx={visuallyHidden}>
                                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                                </Box>
                              ) : null}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                        <TableCell>Action</TableCell>
                        <TableCell>Payment Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className="table__body">
                      {paginatedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={payListHeadCells.length + 2} align="center">
                            No payroll data available.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row, index) => {
                          const statusClass = useTableStatusHook(row?.status);
                          return (
                            <TableRow
                              key={row.id || index}
                              selected={selected.includes(index)}
                              onClick={() => handleClick(index)}
                            >
                              <TableCell>{row?.employeeId || row?.employeeUid}</TableCell>
                              <TableCell>
                                <span className="table-avatar flex items-center">
                                  <Link
                                    className="avatar-img me-[10px]"
                                    href={`/hrm/employee-profile/${row?.employeeId || row?.employeeUid}`}
                                  >
                                    {/* <Image
                                      className="img-48 border-circle"
                                      src={row?.employeeImg || "/default-avatar.png"}
                                      alt="User"
                                      width={48}
                                      height={48}
                                    /> */}
                                  </Link>
                                  <Link href={`/hrm/employee-profile/${row?.employeeId || row?.employeeUid}`}>
                                    {row?.employeeName}
                                  </Link>
                                </span>
                              </TableCell>
                              <TableCell>{row?.email || row?.employeeEmail}</TableCell>
                              <TableCell>{formatDate(row?.joiningDate || row?.employeeJoinDate || row?.createdAt)}</TableCell>
                              <TableCell>${formatCurrency(row?.salaryMonthly)}</TableCell>
                              <TableCell>
                                <span className={`bd-badge ${statusClass}`}>
                                  {row?.status || 'Active'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-[10px]">
                                  <Link
                                    href="/payroll/payroll-payslip"
                                    className="table__icon download"
                                  >
                                    <i className="fa-regular fa-eye"></i>
                                  </Link>
                                  <button
                                    type="button"
                                    className="table__icon edit"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // FIXED: Only set editData if row.id exists (it always will now)
                                      if (row.id) {
                                        setEditData(row);
                                        setModalOpen(true);
                                      }
                                    }}
                                  >
                                    <i className="fa-sharp fa-light fa-pen"></i>
                                  </button>
                                  <button
                                    className="removeBtn table__icon delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // FIXED: Only set deleteId if row.id exists
                                      if (row.id) {
                                        setDeleteId(row.id);
                                        setModalDeleteOpen(true);
                                      }
                                    }}
                                  >
                                    <i className="fa-regular fa-trash"></i>
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell>
                                {/* The "Mark as Paid" button */}
                                {row.status !== 'paid' && row.id && (
                                  <button
                                    type="button"
                                    className="btn btn-sm bg-green-500 hover:bg-green-600 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsPaid(row.id!); // We know id exists here
                                    }}
                                  >
                                    Mark as Paid
                                  </button>
                                )}
                                {/* Display "Paid" text for paid records */}
                                {row.status === 'paid' && (
                                  <span className="text-green-500 font-bold">Paid</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
            <Box className="table-search-box mt-[30px]" sx={{ p: 2 }}>
              <Box>
                {`Showing ${(page - 1) * rowsPerPage + 1} to ${Math.min(
                  page * rowsPerPage,
                  filteredRows.length
                )} of ${filteredRows.length} entries`}
              </Box>
              <Pagination
                count={Math.ceil(filteredRows.length / rowsPerPage)}
                page={page}
                onChange={(e, value) => handleChangePage(value)}
                variant="outlined"
                shape="rounded"
                className="manaz-pagination-button"
              />
            </Box>
          </div>
        </div>
      </div>

      {modalOpen && editData && (
        <EditSalaryModal
          open={modalOpen}
          setOpen={setModalOpen}
          editData={editData}
          onSave={handleEditSalary}
        />
      )}

      {modalDeleteOpen && (
        <DeleteModal
          open={modalDeleteOpen}
          setOpen={setModalDeleteOpen}
          handleDeleteFunc={handleDelete}
          deleteId={deleteId}
        />
      )}
    </>
  );
};

export default PayrollTable;
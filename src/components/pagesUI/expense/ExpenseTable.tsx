"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, Pagination, TableRow, TableSortLabel, Paper } from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import useMaterialTableHook from "@/hooks/useMaterialTableHook";
import Link from "next/link";
import Image from "next/image";
import { IExpese } from "@/interface/table.interface";
import { expenseHeadCells } from "@/data/table-head-cell/table-head";
// ✅ CHANGE: Import it as a regular function if possible, 
// or call the logic manually if it must be a hook.
import { useTableStatusHook } from "@/hooks/use-condition-class"; 
import UpdateExpenseModal from "./UpdateExpenseModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { toast } from "sonner";

const ExpenseTable = () => {
  const { user } = useAuthUserContext();
  const [expenses, setExpenses] = useState<IExpese[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<IExpese | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 1. Fetching Logic
  const fetchExpenses = useCallback(async () => {
    if (!user?.companyId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/expense?companyId=${user.companyId}`);
      const result = await response.json();
      if (result.success) setExpenses(result.expenses);
    } catch (error) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // 2. Table Hook
  const {
    order,
    orderBy,
    page,
    rowsPerPage,
    searchQuery,
    paginatedRows,
    filteredRows,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearchChange,
  } = useMaterialTableHook<IExpese>(expenses, 10);

  const handleDeleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/expense?id=${id}`, { method: "DELETE" });
      const result = await response.json();
      if (result.success) {
        toast.success("Deleted successfully");
        setExpenses((prev) => prev.filter((item) => item.id !== id));
        setModalDeleteOpen(false);
      }
    } catch (error) {
      toast.error("Error deleting expense");
    }
  };

  return (
    <>
      <div className="col-span-12">
        <div className="card__wrapper">
          <div className="manaz-common-mat-list w-full table__wrapper table-responsive">
            <TableControls
              rowsPerPage={rowsPerPage}
              searchQuery={searchQuery}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              handleSearchChange={handleSearchChange}
            />
            <Box sx={{ width: "100%" }}>
              <Paper sx={{ width: "100%", mb: 2 }}>
                <TableContainer className="table mb-[20px] hover w-full">
                  <Table aria-labelledby="tableTitle" className="whitespace-nowrap">
                    <TableHead>
                      <TableRow className="table__title">
                        {expenseHeadCells.map((headCell) => (
                          <TableCell
                            key={headCell.id}
                            className="table__title"
                            sortDirection={orderBy === headCell.id ? order : false}
                          >
                            <TableSortLabel
                              active={orderBy === headCell.id}
                              direction={orderBy === headCell.id ? order : "asc"}
                              // ✅ FIX: Cast to string to satisfy the IHeadCell interface
                              onClick={() => handleRequestSort(headCell.id as string)}
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
                        <TableCell className="table__title">Action</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody className="table__body">
                      {paginatedRows.map((row) => {
                        // ✅ FIX: Do NOT call useTableStatusHook here. 
                        // Instead, we manually handle the status class or use a logic helper.
                        const getStatusClass = (status: string) => {
                          switch (status) {
                            case "Paid": return "bg-success";
                            case "Unpaid": return "bg-warning";
                            case "Returned": return "bg-danger";
                            default: return "bg-secondary";
                          }
                        };

                        return (
                          <TableRow key={row.id} hover>
                            <TableCell>{row.invoiceNumber}</TableCell>
                            <TableCell>{row.itemName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Image
                                  className="img-36 border-circle"
                                  src={row.employeeImg || "/default-avatar.png"}
                                  alt="User"
                                  width={36}
                                  height={36}
                                />
                                <span>{row.purchasedBy}</span>
                              </div>
                            </TableCell>
                            <TableCell>{row.purchaseDate}</TableCell>
                            <TableCell className="font-semibold">
                              ${Number(row.amount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {/* Use the local helper instead of a hook */}
                              <span className={`bd-badge ${getStatusClass(row.status)}`}>
                                {row.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="table__icon edit"
                                  onClick={() => {
                                    setEditData(row);
                                    setModalOpen(true);
                                  }}
                                >
                                  <i className="fa-sharp fa-light fa-pen"></i>
                                </button>
                                <button
                                  type="button"
                                  className="table__icon delete"
                                  onClick={() => {
                                    setDeleteId(row.id);
                                    setModalDeleteOpen(true);
                                  }}
                                >
                                  <i className="fa-regular fa-trash"></i>
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
            {/* Pagination Logic... */}
          </div>
        </div>
      </div>

      {modalOpen && editData && (
        <UpdateExpenseModal
          open={modalOpen}
          setOpen={setModalOpen}
          editData={editData}
          onSuccess={fetchExpenses}
        />
      )}

      {modalDeleteOpen && deleteId && (
        <DeleteModal
          open={modalDeleteOpen}
          setOpen={setModalDeleteOpen}
          handleDeleteFunc={handleDeleteExpense}
          deleteId={deleteId}
        />
      )}
    </>
  );
};

export default ExpenseTable;
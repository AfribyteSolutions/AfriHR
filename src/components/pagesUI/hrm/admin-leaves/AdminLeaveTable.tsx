/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React, { useState, useEffect, useRef } from "react";
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
import CircularProgress from "@mui/material/CircularProgress";
import { visuallyHidden } from "@mui/utils";
import useMaterialTableHook from "@/hooks/useMaterialTableHook";
import { IAdminLeave } from "@/interface/table.interface";
import { adminLeaveHeadCells } from "@/data/table-head-cell/table-head";
import { useTableStatusHook } from "@/hooks/use-condition-class";
import Link from "next/link";
import Image from "next/image";
import AdminLeaveEditModal from "./AdminLeaveEditModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";
import { toast } from "sonner";

interface AdminLeaveTableProps {
  leaveData: any[];
  onRefresh?: () => void;
  highlightLeaveId?: string | null;
}

const AdminLeaveTable: React.FC<AdminLeaveTableProps> = ({ leaveData, onRefresh, highlightLeaveId }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<IAdminLeave | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const highlightRef = useRef<HTMLTableRowElement>(null);

  // Real-time balance synchronization state
  const [employeeBalances, setEmployeeBalances] = useState<Record<string, any>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

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
  } = useMaterialTableHook<IAdminLeave | any>(leaveData, 10);

  // Sync balances for all employees currently visible/loaded in the table
  useEffect(() => {
    const fetchLatestBalances = async () => {
      if (!leaveData || leaveData.length === 0) return;
      
      const uniqueEmployeeIds = Array.from(new Set(leaveData.map(l => l.employeeId))).filter(Boolean);
      
      try {
        setLoadingBalances(true);
        const balanceMap: Record<string, any> = {};
        
        // Fetch each employee's current profile data to get the true "50" days
        await Promise.all(uniqueEmployeeIds.map(async (id) => {
          const res = await fetch(`/api/user-data?uid=${id}`);
          const data = await res.json();
          if (data.success && data.user) {
            balanceMap[id] = {
              remaining: Number(data.user.remainingLeaveDays) || 0,
              total: Number(data.user.totalLeaveDays) || 0
            };
          }
        }));
        
        setEmployeeBalances(balanceMap);
      } catch (error) {
        console.error("Error syncing table balances:", error);
      } finally {
        setLoadingBalances(false);
      }
    };

    fetchLatestBalances();
  }, [leaveData]);

  // Scroll to highlighted leave
  useEffect(() => {
    if (highlightLeaveId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightLeaveId, paginatedRows]);

  const handleRejectLeave = async (row: any) => {
    const reason = window.prompt(`Enter rejection reason for ${row.employeeName}:`);
    if (reason === null) return; 
    if (reason.trim() === "") {
      toast.error("A reason is required to notify the employee.");
      return;
    }

    try {
      const res = await fetch(`/api/leaves?id=${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "rejected",
          rejectionReason: reason 
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Leave rejected and employee notified.");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Failed to process rejection.");
    }
  };

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
                        {adminLeaveHeadCells.map((headCell) => (
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
                        <TableCell className="table__title">Balance Status</TableCell>
                        <TableCell className="table__title">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className="table__body">
                      {paginatedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8">
                            <p className="text-gray-500">No leave requests found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row, index) => {
                          const statusClass = useTableStatusHook(row?.status);
                          const isHighlighted = highlightLeaveId && row?.id === highlightLeaveId;
                          
                          // Use synchronized balance from employeeBalances state
                          const syncData = employeeBalances[row.employeeId];
                          const remainingDays = syncData ? syncData.remaining : (Number(row?.remainingLeaveDays) || 0);
                          const totalDays = syncData ? syncData.total : (Number(row?.totalLeaveDays) || 0);
                          
                          const requestedDays = Number(row?.days) || 0;
                          const isExceeding = requestedDays > remainingDays;
                          const deficit = requestedDays - remainingDays;
                          
                          const taken = Math.max(0, totalDays - remainingDays);
                          const progressPercentage = totalDays > 0 ? (taken / totalDays) * 100 : 0;

                          return (
                            <TableRow
                              key={row?.id || index}
                              ref={isHighlighted ? highlightRef : null}
                              selected={selected.includes(index)}
                              onClick={() => handleClick(index)}
                              className={`${isHighlighted ? "bg-yellow-50" : ""} ${isExceeding && row?.status === 'pending' ? "bg-red-50/70" : ""}`}
                            >
                              <TableCell>
                                <span className="table-avatar flex justify-start items-center">
                                  <Link
                                    className="avatar-img me-[10px]"
                                    href={row?.employeeId ? `/hrm/employee-profile?uid=${row.employeeId}` : "#"}
                                  >
<Image
  className="img-48 border-circle"
  src={
    (row?.adminImg && row.adminImg.startsWith("http"))
      ? row.adminImg
      : (row?.profilePictureUrl && row.profilePictureUrl.startsWith("http"))
      ? row.profilePictureUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(row?.employeeName || "User")}&size=96&background=1e293b&color=fff`
  }
  alt={row?.employeeName || "Employee"}
  width={48}
  height={48}
  unoptimized
/>
                                  </Link>
                                  <Link href={row?.employeeId ? `/hrm/employee-profile?uid=${row.employeeId}` : "#"}>
                                    {row?.employeeName || "Unknown"}
                                  </Link>
                                </span>
                              </TableCell>

                              <TableCell>{row?.designation || "N/A"}</TableCell>
                              <TableCell>{row?.leaveType}</TableCell>
                              <TableCell>{row?.leaveDuration}</TableCell>
                              <TableCell>{row?.days}</TableCell>
                              <TableCell>
                                <div className="max-w-[150px] truncate" title={row?.reason}>
                                  {row?.reason}
                                </div>
                              </TableCell>

                              <TableCell>
                                <span className={`bd-badge ${statusClass}`}>
                                  {row?.status}
                                </span>
                              </TableCell>

                              {/* 📊 Synchronized Balance & Progress */}
                              <TableCell>
                                <div className="flex flex-col gap-1 min-w-[140px]">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-600">Left: {remainingDays}</span>
                                    {isExceeding && row?.status === 'pending' && (
                                      <span className="text-red-600">-{deficit} Short</span>
                                    )}
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`${isExceeding ? 'bg-red-500' : 'bg-blue-600'} h-full transition-all duration-700`} 
                                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell className="table__icon-box">
                                <div className="flex items-center justify-start gap-[10px]">
                                  {row?.status === "pending" && (
                                    <>
                                      <button
                                        type="button"
                                        className="table__icon"
                                        style={{ color: "#22c55e" }}
                                        title="Approve"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const res = await fetch(`/api/leaves?id=${row.id}`, {
                                              method: "PUT",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ status: "approved" }),
                                            });
                                            if (!res.ok) throw new Error();
                                            toast.success("Leave approved");
                                            if (onRefresh) onRefresh();
                                          } catch (error) {
                                            toast.error("Error approving leave");
                                          }
                                        }}
                                      >
                                        <i className="fa-solid fa-check"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="table__icon"
                                        style={{ color: "#ef4444" }}
                                        title="Reject"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRejectLeave(row);
                                        }}
                                      >
                                        <i className="fa-solid fa-xmark"></i>
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    className="table__icon edit"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditData(row);
                                      setModalOpen(true);
                                    }}
                                  >
                                    <i className="fa-sharp fa-light fa-pen"></i>
                                  </button>
                                  <button
                                    className="removeBtn table__icon delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
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
        <AdminLeaveEditModal
          open={modalOpen}
          setOpen={setModalOpen}
          editData={editData}
          onRefresh={onRefresh}
        />
      )}

      {modalDeleteOpen && (
        <DeleteModal
          open={modalDeleteOpen}
          setOpen={setModalDeleteOpen}
          handleDeleteFunc={async () => {
            try {
              const res = await fetch(`/api/leaves?id=${deleteId}`, { method: "DELETE" });
              if (!res.ok) throw new Error();
              toast.success("Leave deleted");
              setModalDeleteOpen(false);
              if (onRefresh) onRefresh();
            } catch (error) {
              toast.error("Failed to delete");
            }
          }}
          deleteId={deleteId}
        />
      )}
    </>
  );
};

export default AdminLeaveTable;
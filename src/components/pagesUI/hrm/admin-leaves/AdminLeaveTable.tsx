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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
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

  const {
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    searchQuery,
    paginatedRows,
    filteredRows,
    handleDelete: handleDeleteLocal,
    handleRequestSort,
    handleClick,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearchChange,
  } = useMaterialTableHook<IAdminLeave | any>(leaveData, 10);

  // Add debug logging
  useEffect(() => {
    console.log("📊 Leave data received in table:", leaveData);
    console.log("📊 Total leaves:", leaveData.length);
    console.log("🔍 Highlight leave ID:", highlightLeaveId);
  }, [leaveData, highlightLeaveId]);

  // Scroll to highlighted leave
  useEffect(() => {
    if (highlightLeaveId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightLeaveId, paginatedRows]);

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
                  <Table
                    aria-labelledby="tableTitle"
                    className="whitespace-nowrap"
                  >
                    <TableHead>
                      <TableRow className="table__title">
                        {adminLeaveHeadCells.map((headCell) => (
                          <TableCell
                            className="table__title"
                            key={headCell.id}
                            sortDirection={
                              orderBy === headCell.id ? order : false
                            }
                          >
                            <TableSortLabel
                              active={orderBy === headCell.id}
                              direction={
                                orderBy === headCell.id ? order : "asc"
                              }
                              onClick={() => handleRequestSort(headCell.id)}
                            >
                              {headCell.label}
                              {orderBy === headCell.id ? (
                                <Box component="span" sx={visuallyHidden}>
                                  {order === "desc"
                                    ? "sorted descending"
                                    : "sorted ascending"}
                                </Box>
                              ) : null}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className="table__body">
                      {paginatedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <p className="text-gray-500">No leave requests found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row, index) => {
                          const stausClass = useTableStatusHook(row?.status);
                          const isHighlighted = highlightLeaveId && row?.id === highlightLeaveId;
                          return (
                            <TableRow
                              key={row?.id || index}
                              ref={isHighlighted ? highlightRef : null}
                              selected={selected.includes(index)}
                              onClick={() => handleClick(index)}
                              className={isHighlighted ? "bg-yellow-50" : ""}
                            >
                              <TableCell className="sorting_1">
                                <span className="table-avatar flex justify-start items-center">
                                  <Link
                                    className="avatar-img me-[10px]"
                                    href={`/hrm/employee-profile/${row?.employeeId || index + 1}`}
                                  >
                                    <Image
                                      className="img-48 border-circle"
                                      src={row?.adminImg || row?.profilePictureUrl || "/assets/images/avatar/avatar.png"}
                                      alt="User Image"
                                      width={48}
                                      height={48}
                                    />
                                  </Link>
                                  <Link
                                    href={`/hrm/employee-profile/${row?.employeeId || index + 1}`}
                                  >
                                    {row?.employeeName || "Unknown Employee"}
                                  </Link>
                                </span>
                              </TableCell>

                            <TableCell className="table__loan-amount">
                              {row?.designation}
                            </TableCell>
                            <TableCell className="table__loan-amount">
                              {row?.leaveType}
                            </TableCell>

                            <TableCell className="table__loan-date">
                              {row?.leaveDuration}
                            </TableCell>
                            <TableCell className="table__loan-created">
                              {row?.days}
                            </TableCell>
                            <TableCell className="table__loan-created">
                              {row?.reason}
                            </TableCell>

                            <TableCell className="table__delivery">
                              <span className={`bd-badge ${stausClass}`}>
                                {row?.status}
                              </span>
                            </TableCell>
                            <TableCell className="table__icon-box">
                              <div className="flex items-center justify-start gap-[10px]">
                                {row?.status === "pending" && (
                                  <>
                                    <button
                                      type="button"
                                      className="table__icon"
                                      style={{ color: "#22c55e" }}
                                      title="Approve Leave"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const res = await fetch(`/api/leaves?id=${row.id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: "approved" }),
                                          });
                                          if (!res.ok) throw new Error("Failed to approve");
                                          toast.success("Leave approved successfully");
                                          if (onRefresh) onRefresh();
                                        } catch (error) {
                                          toast.error("Failed to approve leave");
                                        }
                                      }}
                                    >
                                      <i className="fa-solid fa-check"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="table__icon"
                                      style={{ color: "#ef4444" }}
                                      title="Reject Leave"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const res = await fetch(`/api/leaves?id=${row.id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: "rejected" }),
                                          });
                                          if (!res.ok) throw new Error("Failed to reject");
                                          toast.success("Leave rejected");
                                          if (onRefresh) onRefresh();
                                        } catch (error) {
                                          toast.error("Failed to reject leave");
                                        }
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

      {modalOpen && editData?.leaveType && (
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
              const res = await fetch(`/api/leaves?id=${deleteId}`, {
                method: "DELETE",
              });

              if (!res.ok) throw new Error("Delete failed");

              toast.success("Leave deleted successfully");
              setModalDeleteOpen(false);

              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              toast.error("Failed to delete leave");
              console.error("Delete error:", error);
            }
          }}
          deleteId={deleteId}
        />
      )}
    </>
  );
};

export default AdminLeaveTable;

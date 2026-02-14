"use client";
import React, { useState } from "react";
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
import TableControls from "@/components/elements/SharedInputs/TableControls";
import { toast } from "sonner";
import Image from "next/image";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  workHours: number;
  notes?: string;
  profilePictureUrl?: string;
}

interface AdminAttendanceTableProps {
  attendanceData: AttendanceRecord[];
  selectedDate: string;
  onRefresh: () => void;
  loading: boolean;
}

const headCells = [
  { id: "employeeName", label: "Employee" },
  { id: "checkIn", label: "Check In" },
  { id: "checkOut", label: "Check Out" },
  { id: "workHours", label: "Work Hours" },
  { id: "status", label: "Status" },
  { id: "notes", label: "Notes" },
  { id: "action", label: "Action" },
];

const AdminAttendanceTable: React.FC<AdminAttendanceTableProps> = ({
  attendanceData,
  selectedDate,
  onRefresh,
  loading,
}) => {
  const [deleting, setDeleting] = useState<string | null>(null);

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
  } = useMaterialTableHook<AttendanceRecord>(attendanceData, 10);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      present: { color: "bg-green-100 text-green-800", label: "Present" },
      absent: { color: "bg-red-100 text-red-800", label: "Absent" },
      late: { color: "bg-yellow-100 text-yellow-800", label: "Late" },
      half_day: { color: "bg-blue-100 text-blue-800", label: "Half Day" },
      leave: { color: "bg-purple-100 text-purple-800", label: "On Leave" },
      weekend: { color: "bg-gray-100 text-gray-800", label: "Weekend" },
      holiday: { color: "bg-indigo-100 text-indigo-800", label: "Holiday" },
    };

    const badge = badges[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) {
      return;
    }

    try {
      setDeleting(id);
      const res = await fetch(`/api/attendance?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete attendance");
      }

      toast.success("Attendance record deleted successfully");
      onRefresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete attendance record");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="col-span-12">
        <div className="card__wrapper">
          <div className="p-6 text-center">
            <p>Loading attendance...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="col-span-12">
        <div className="card__wrapper">
          <div className="manaz-common-mat-list mat-list-without-checkbox w-full table__wrapper">
            <TableControls
              rowsPerPage={rowsPerPage}
              searchQuery={searchQuery}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              handleSearchChange={handleSearchChange}
            />

            <Box
              className="table-search-box mb-[20px] multiple_tables dataTable no-footer table-responsive"
              sx={{ width: "100%" }}
            >
              <Paper sx={{ width: "100%", mb: 2 }}>
                <TableContainer className="table mb-[20px] hover multiple_tables w-full">
                  <Table
                    aria-labelledby="tableTitle"
                    className="whitespace-nowrap"
                  >
                    <TableHead>
                      <TableRow className="table__title">
                        {headCells.map((headCell) => (
                          <TableCell
                            className="table__title table_head_custom"
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
                      </TableRow>
                    </TableHead>
                    <TableBody className="table__body">
                      {paginatedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-gray-500">
                              No attendance records found for {new Date(selectedDate).toLocaleDateString()}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row, index) => (
                          <TableRow
                            key={row.id}
                            selected={selected.includes(index)}
                            onClick={() => handleClick(index)}
                          >
                            <TableCell className="sorting_1">
                              <span className="table-avatar flex justify-start items-center">
                                <Link
                                  className="me-2.5 avatar-img"
                                  href={`/hrm/employee-profile?uid=${row.employeeId}`}
                                >
                                  {row.profilePictureUrl ? (
                                    <Image
                                      className="border-circle"
                                      src={row.profilePictureUrl}
                                      alt={row.employeeName}
                                      width={40}
                                      height={40}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <span className="text-gray-600 font-medium">
                                        {row.employeeName?.charAt(0) || "?"}
                                      </span>
                                    </div>
                                  )}
                                </Link>
                                <Link
                                  href={`/hrm/employee-profile?uid=${row.employeeId}`}
                                  className="avatar-name"
                                >
                                  {row.employeeName}
                                </Link>
                              </span>
                            </TableCell>
                            <TableCell>{formatTime(row.checkIn)}</TableCell>
                            <TableCell>{formatTime(row.checkOut)}</TableCell>
                            <TableCell>
                              {row.workHours ? `${row.workHours.toFixed(1)}h` : "-"}
                            </TableCell>
                            <TableCell>{getStatusBadge(row.status)}</TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {row.notes || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(row.id);
                                }}
                                disabled={deleting === row.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                <i className="fa-regular fa-trash"></i>
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
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
    </>
  );
};

export default AdminAttendanceTable;

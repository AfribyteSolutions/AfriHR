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
import { useTableStatusHook } from "@/hooks/use-condition-class";
import Link from "next/link";
import Image from "next/image";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";
import EditReportModal from "./EditReportModal";
import { toast } from "sonner";

interface ReportsTableProps {
  reportsData: any[];
  onRefresh?: () => void;
  loading?: boolean;
}

interface HeadCell {
  id: string;
  label: string;
}

const headCells: readonly HeadCell[] = [
  { id: "employeeName", label: "Employee" },
  { id: "reportType", label: "Type" },
  { id: "title", label: "Title" },
  { id: "rating", label: "Rating" },
  { id: "createdByName", label: "Created By" },
  { id: "status", label: "Status" },
  { id: "date", label: "Date" },
];

const ReportsTable: React.FC<ReportsTableProps> = ({
  reportsData,
  onRefresh,
  loading = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

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
  } = useMaterialTableHook<any>(reportsData, 10);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "N/A";

    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      performance: "bg-primary",
      review: "bg-success",
      warning: "bg-warning",
      feedback: "bg-info",
      termination: "bg-danger",
    };
    return colors[type] || "bg-secondary";
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
                  <Table
                    aria-labelledby="tableTitle"
                    className="whitespace-nowrap"
                  >
                    <TableHead>
                      <TableRow className="table__title">
                        {headCells.map((headCell) => (
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
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <p className="text-gray-500">Loading reports...</p>
                          </TableCell>
                        </TableRow>
                      ) : paginatedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <p className="text-gray-500">No reports found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row, index) => {
                          const statusClass = useTableStatusHook(row?.status);

                          return (
                            <TableRow
                              key={row?.id || index}
                              selected={selected.includes(index)}
                              onClick={() => handleClick(index)}
                            >
                              <TableCell className="sorting_1">
                                <span className="table-avatar flex justify-start items-center">
                                  <Link
                                    className="avatar-img me-[10px]"
                                    href={row?.employeeId ? `/hrm/employee-profile?uid=${row.employeeId}` : "#"}
                                  >
                                    <Image
                                      className="img-48 border-circle"
                                      src="/assets/images/avatar/avatar.png"
                                      alt="Employee Image"
                                      width={48}
                                      height={48}
                                    />
                                  </Link>
                                  <Link
                                    href={row?.employeeId ? `/hrm/employee-profile?uid=${row.employeeId}` : "#"}
                                  >
                                    {row?.employeeName || "Unknown"}
                                  </Link>
                                </span>
                              </TableCell>

                              <TableCell>
                                <span
                                  className={`bd-badge ${getReportTypeColor(
                                    row?.reportType
                                  )}`}
                                >
                                  {row?.reportType || "N/A"}
                                </span>
                              </TableCell>

                              <TableCell className="table__loan-amount">
                                {row?.title || "N/A"}
                              </TableCell>

                              <TableCell className="table__loan-amount">
                                {row?.rating ? `${row.rating}/5` : "N/A"}
                              </TableCell>

                              <TableCell className="table__loan-created">
                                {row?.createdByName || "N/A"}
                              </TableCell>

                              <TableCell className="table__delivery">
                                <span className={`bd-badge ${statusClass}`}>
                                  {row?.status || "N/A"}
                                </span>
                              </TableCell>

                              <TableCell className="table__loan-date">
                                {formatDate(row?.date)}
                              </TableCell>

                              <TableCell className="table__icon-box">
                                <div className="flex items-center justify-start gap-[10px]">
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
        <EditReportModal
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
              const res = await fetch(`/api/reports?id=${deleteId}`, {
                method: "DELETE",
              });

              if (!res.ok) throw new Error("Delete failed");

              toast.success("Report deleted successfully");
              setModalDeleteOpen(false);

              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              toast.error("Failed to delete report");
              console.error("Delete error:", error);
            }
          }}
          deleteId={deleteId}
        />
      )}
    </>
  );
};

export default ReportsTable;

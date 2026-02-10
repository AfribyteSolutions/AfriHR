"use client";
import React, { useState } from "react";
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
import { IFeedback } from "./FeedbackMainArea";
import UpdateFeedbackModal from "./UpdateFeedbackModal";
import DeleteModal from "@/components/common/DeleteModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import { toast } from "sonner";

interface IFeedbackTableProps {
  feedbackData: IFeedback[];
  onRefresh?: () => void;
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof IFeedback;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: "toEmployeeName", numeric: false, disablePadding: true, label: "Employee" },
  { id: "fromManagerName", numeric: false, disablePadding: false, label: "From Manager" },
  { id: "feedbackType", numeric: false, disablePadding: false, label: "Type" },
  { id: "subject", numeric: false, disablePadding: false, label: "Subject" },
  { id: "rating", numeric: true, disablePadding: false, label: "Rating" },
  { id: "status", numeric: false, disablePadding: false, label: "Status" },
  { id: "createdAt", numeric: false, disablePadding: false, label: "Date" },
];

const FeedbackTable: React.FC<IFeedbackTableProps> = ({ feedbackData, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<IFeedback | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const {
    order,
    orderBy,
    rowsPerPage,
    searchQuery,
    handleRequestSort,
    handleChangeRowsPerPage,
    handleSearchChange,
    paginatedRows,
    isSelected,
  } = useMaterialTableHook(feedbackData as any);

  const handleEdit = (feedback: IFeedback) => {
    setEditData(feedback);
    setModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setModalDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/feedback?id=${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Feedback deleted successfully");
      setModalDeleteOpen(false);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error("Failed to delete feedback");
      console.error("Delete error:", error);
    }
  };

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

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      sent: "bg-primary",
      acknowledged: "bg-success",
      archived: "bg-secondary",
    };
    return statusClasses[status] || "bg-primary";
  };

  const getRatingStars = (rating: number | null | undefined) => {
    if (!rating) return "N/A";
    return "⭐".repeat(rating);
  };

  return (
    <>
      <div className="table__wrapper">
        <div className="table__inner">
          <TableControls
            rowsPerPage={rowsPerPage}
            searchQuery={searchQuery}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            handleSearchChange={handleSearchChange}
          />
          <Box sx={{ width: "100%" }}>
            <Paper sx={{ width: "100%", mb: 2 }}>
              <TableContainer>
                <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
                  <TableHead>
                    <TableRow>
                      {headCells.map((headCell) => (
                        <TableCell
                          key={headCell.id}
                          align={headCell.numeric ? "right" : "left"}
                          padding={headCell.disablePadding ? "none" : "normal"}
                          sortDirection={orderBy === headCell.id ? order : false}
                        >
                          <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : "asc"}
                            onClick={() => handleRequestSort(headCell.id)}
                          >
                            {headCell.label}
                          </TableSortLabel>
                        </TableCell>
                      ))}
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(paginatedRows as unknown as IFeedback[]).map((row) => {
                      const isItemSelected = isSelected(row.id);

                      return (
                        <TableRow
                          hover
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={row.id}
                          selected={isItemSelected}
                        >
                          <TableCell component="th" scope="row" padding="none">
                            <div className="table__user-info">
                              <div className="table__user-name">
                                <span>{row.toEmployeeName}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{row.fromManagerName}</TableCell>
                          <TableCell>
                            <span className="capitalize">{row.feedbackType}</span>
                          </TableCell>
                          <TableCell>{row.subject}</TableCell>
                          <TableCell align="right">{getRatingStars(row.rating)}</TableCell>
                          <TableCell>
                            <span className={`bd-badge ${getStatusBadge(row.status)}`}>
                              {row.status}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(row.createdAt)}</TableCell>
                          <TableCell align="right">
                            <div className="flex items-center justify-end gap-[10px]">
                              <button
                                onClick={() => handleEdit(row)}
                                className="table__icon edit"
                              >
                                <i className="fa-regular fa-pen-to-square"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(row.id)}
                                className="table__icon delete"
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
        </div>
      </div>
      {modalOpen && editData && (
        <UpdateFeedbackModal
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
          handleDeleteFunc={handleDelete}
          deleteId={deleteId}
        />
      )}
    </>
  );
};

export default FeedbackTable;

/* eslint-disable react-hooks/rules-of-hooks */
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
import { ITraining } from "@/interface/table.interface";
import { trainingHeadCells } from "@/data/table-head-cell/table-head";
import { useTableStatusHook } from "@/hooks/use-condition-class";
import Link from "next/link";
import Image from "next/image";
import { Checkbox } from "@mui/material";
import EditTraingModal from "./EditTraingModal";
import TrainingDetailsModal from "./TrainingDetailsModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";
import { toast } from "sonner";

interface TrainingTableProps {
  trainingData: any[];
  onRefresh?: () => void;
  loading?: boolean;
}

const TrainingTable: React.FC<TrainingTableProps> = ({
  trainingData,
  onRefresh,
  loading = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editData, setEditData] = useState<ITraining | null>(null);
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
    handleDelete: handleDeleteLocal,
    handleRequestSort,
    handleSelectAllClick,
    handleClick,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearchChange,
  } = useMaterialTableHook<ITraining | any>(trainingData, 10);

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
            <Box sx={{ width: "100%" }} className="table-responsive">
              <Paper sx={{ width: "100%", mb: 2 }}>
                <TableContainer className="table mb-[20px] hover multiple_tables w-full">
                  <Table
                    aria-labelledby="tableTitle"
                    className="whitespace-nowrap"
                  >
                    <TableHead>
                      <TableRow className="table__title">
                        <TableCell padding="checkbox">
                          <Checkbox
                            className="custom-checkbox checkbox-small"
                            color="primary"
                            indeterminate={
                              selected.length > 0 &&
                              selected.length < filteredRows.length
                            }
                            checked={
                              filteredRows.length > 0 &&
                              selected.length === filteredRows.length
                            }
                            onChange={(e) =>
                              handleSelectAllClick(
                                e.target.checked,
                                filteredRows
                              )
                            }
                            size="small"
                          />
                        </TableCell>
                        {trainingHeadCells.map((headCell) => (
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
                          <TableCell colSpan={10} className="text-center py-8">
                            <p className="text-gray-500">Loading trainings...</p>
                          </TableCell>
                        </TableRow>
                      ) : paginatedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8">
                            <p className="text-gray-500">No trainings found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row, index) => {
                          const stausClass = useTableStatusHook(row?.status);
                          const startDate = row?.startDate
                            ? new Date(row.startDate).toLocaleDateString()
                            : "N/A";
                          const endDate = row?.endDate
                            ? new Date(row.endDate).toLocaleDateString()
                            : "N/A";
                          const enrolledCount = row?.enrolledEmployees?.length || 0;

                          return (
                            <TableRow
                              key={row?.id || index}
                              selected={selected.includes(index)}
                              onClick={() => handleClick(index)}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  className="custom-checkbox checkbox-small"
                                  checked={selected.includes(index)}
                                  size="small"
                                  onChange={() => handleClick(index)}
                                />
                              </TableCell>

                              <TableCell></TableCell>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="table__loan-amount">
                                {row?.title || "N/A"}
                              </TableCell>

                              <TableCell className="sorting_1">
                                <span className="table-avatar flex justify-start items-center">
                                  <Link
                                    className="avatar-img-small me-[10px]"
                                    href={row?.trainerId ? `/hrm/employee-profile?uid=${row.trainerId}` : "#"}
                                  >
                                    <Image
                                      className="img-36 border-circle"
                                      src="/assets/images/avatar/avatar.png"
                                      alt="Trainer Image"
                                      width={36}
                                      height={36}
                                    />
                                  </Link>
                                  <Link
                                    href={row?.trainerId ? `/hrm/employee-profile?uid=${row.trainerId}` : "#"}
                                  >
                                    {row?.trainerName || "N/A"}
                                  </Link>
                                </span>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm">
                                  {enrolledCount} participant{enrolledCount !== 1 ? "s" : ""}
                                </span>
                              </TableCell>

                              <TableCell className="table__loan-created">
                                {`${startDate} - ${endDate}`}
                              </TableCell>
                              <TableCell className="table__loan-created">
                                {row?.duration || "N/A"}
                              </TableCell>
                              <TableCell className="table__loan-created">
                                ${row?.cost || 0}
                              </TableCell>

                              <TableCell className="table__delivery">
                                <span className={`bd-badge ${stausClass}`}>
                                  {row?.status || "N/A"}
                                </span>
                              </TableCell>
                              <TableCell className="table__icon-box">
                                <div className="flex items-center justify-start gap-[10px]">
                                  <button
                                    type="button"
                                    className="table__icon download"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditData(row);
                                      setDetailsModalOpen(true);
                                    }}
                                  >
                                    <i className="fa-regular fa-eye"></i>
                                  </button>
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

      {modalOpen && editData?.id && (
        <EditTraingModal
          open={modalOpen}
          setOpen={setModalOpen}
          editData={editData}
          onRefresh={onRefresh}
        />
      )}
      {detailsModalOpen && editData?.id && (
        <TrainingDetailsModal
          open={detailsModalOpen}
          setOpen={setDetailsModalOpen}
          editData={editData}
        />
      )}

      {modalDeleteOpen && (
        <DeleteModal
          open={modalDeleteOpen}
          setOpen={setModalDeleteOpen}
          handleDeleteFunc={async () => {
            try {
              const res = await fetch(`/api/training?id=${deleteId}`, {
                method: "DELETE",
              });

              if (!res.ok) throw new Error("Delete failed");

              toast.success("Training deleted successfully");
              setModalDeleteOpen(false);

              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              toast.error("Failed to delete training");
              console.error("Delete error:", error);
            }
          }}
          deleteId={deleteId}
        />
      )}
    </>
  );
};

export default TrainingTable;

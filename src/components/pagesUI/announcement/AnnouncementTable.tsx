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
import { announcementHeadCells } from "@/data/table-head-cell/table-head";
import AddNewAnnouncementModal from "./AddNewAnnouncementModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { deleteAnnouncement } from "@/lib/firebase/announcements";
import { useUserRole } from "@/hooks/useUserRole"; // Added role hook
import { toast } from "sonner";
import { format } from "date-fns";
import { Announcement } from "@/types/announcement";

type Order = 'asc' | 'desc';

const AnnouncementTable = () => {
  const { announcements, loading, error } = useAnnouncements();
  const { userRole, isLoading: roleLoading } = useUserRole(); // Initialize roles
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<Announcement | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Table state
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Announcement>('createdAt');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Permissions logic
  const isAuthorized = userRole === "manager" || userRole === "admin" || userRole === "super-admin";

  // Sorting
  const handleRequestSort = (property: keyof Announcement) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Search filtering
  const filteredRows = announcements.filter((row) =>
    row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting logic
  const sortedRows = [...filteredRows].sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    if (aValue instanceof Date && bValue instanceof Date) {
      return order === 'asc' 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const paginatedRows = sortedRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value: number) => {
    setRowsPerPage(value);
    setPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement deleted successfully!");
      setModalDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement.");
    }
  };

  const getTargetBadge = (target: string) => {
    const badges = {
      all: 'bg-blue-100 text-blue-800',
      managers: 'bg-purple-100 text-purple-800',
      employees: 'bg-green-100 text-green-800',
      specific: 'bg-yellow-100 text-yellow-800',
    };
    return badges[target as keyof typeof badges] || badges.all;
  };

  if (error) {
    return (
      <div className="col-span-12">
        <div className="card__wrapper">
          <div className="p-8 text-center text-red-500">Error loading announcements</div>
        </div>
      </div>
    );
  }

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

            {(loading || roleLoading) ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No announcements found.</div>
            ) : (
              <>
                <Box sx={{ width: "100%" }} className="table-responsive">
                  <Paper sx={{ width: "100%", mb: 2 }}>
                    <TableContainer className="table mb-[20px] hover multiple_tables w-full">
                      <Table aria-labelledby="tableTitle" className="whitespace-nowrap">
                        <TableHead>
                          <TableRow className="table__title">
                            {announcementHeadCells.map((headCell) => (
                              <TableCell
                                className="table__title"
                                key={headCell.id}
                                sortDirection={orderBy === headCell.id ? order : false}
                              >
                                <TableSortLabel
                                  active={orderBy === headCell.id}
                                  direction={orderBy === headCell.id ? order : "asc"}
                                  onClick={() => handleRequestSort(headCell.id as keyof Announcement)}
                                >
                                  {headCell.label}
                                </TableSortLabel>
                              </TableCell>
                            ))}
                            <TableCell>Target</TableCell>
                            {/* NEW: Hide Action header if employee */}
                            {isAuthorized && <TableCell>Action</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody className="table__body">
                          {paginatedRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.title}</TableCell>
                              <TableCell>{format(row.startDate, 'MMM dd, yyyy')}</TableCell>
                              <TableCell>{format(row.endDate, 'MMM dd, yyyy')}</TableCell>
                              <TableCell>
                                <div className="max-w-md truncate">{row.description}</div>
                              </TableCell>
                              <TableCell>
                                <span className={`text-xs px-2 py-1 rounded-full ${getTargetBadge(row.target)}`}>
                                  {row.target === 'specific' 
                                    ? `${row.targetUserIds?.length || 0} user(s)` 
                                    : row.target}
                                </span>
                              </TableCell>
                              {/* NEW: Hide Action buttons if employee */}
                              {isAuthorized && (
                                <TableCell className="table__icon-box">
                                  <div className="flex items-center justify-start gap-[10px]">
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
                                      className="removeBtn table__icon delete"
                                      onClick={() => {
                                        setDeleteId(row.id);
                                        setModalDeleteOpen(true);
                                      }}
                                    >
                                      <i className="fa-regular fa-trash"></i>
                                    </button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>
                {/* Pagination (Same as before) */}
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* NEW: Added check to ensure editData isn't null before rendering modal */}
      {modalOpen && editData && (
        <AddNewAnnouncementModal
          open={modalOpen}
          setOpen={setModalOpen}
          editData={editData}
        />
      )}

      {modalDeleteOpen && deleteId && (
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

export default AnnouncementTable;
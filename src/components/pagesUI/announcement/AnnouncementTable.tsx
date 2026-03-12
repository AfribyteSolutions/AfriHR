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
import { announcementHeadCells } from "@/data/table-head-cell/table-head";
import AddNewAnnouncementModal from "./AddNewAnnouncementModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { deleteAnnouncement } from "@/lib/firebase/announcements";
import { useAuthUserContext } from "@/context/UserAuthContext"; // Use this instead of useUserRole
import { toast } from "sonner";
import { format } from "date-fns";
import { Announcement } from "@/types/announcement";

type Order = 'asc' | 'desc';

const AnnouncementTable = () => {
  // Use your central context for both user data and loading state
  const { user, loading: authLoading } = useAuthUserContext();
  const { announcements, loading: announcementsLoading, error } = useAnnouncements();
  
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

  // Permissions logic - using 'user.role' from your main context
  const isAuthorized = user?.role === "manager" || user?.role === "admin";

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
      <div className="col-span-12 p-8 text-center text-red-500 bg-white rounded-xl">
        Error loading announcements: {error}
      </div>
    );
  }

  // Check BOTH loading states
  const isLoading = authLoading || announcementsLoading;

  return (
    <>
      <div className="col-span-12">
        <div className="card__wrapper p-0 overflow-hidden">
          <div className="manaz-common-mat-list w-full table__wrapper table-responsive mat-list-without-checkbox">
            <div className="p-4 border-b border-slate-100">
                <TableControls
                rowsPerPage={rowsPerPage}
                searchQuery={searchQuery}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                handleSearchChange={handleSearchChange}
                />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm font-medium">Fetching announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-20 text-center text-gray-400">
                <i className="fa-light fa-bullhorn text-4xl mb-3 block"></i>
                <p>No announcements found for your company.</p>
              </div>
            ) : (
              <>
                <Box sx={{ width: "100%" }} className="table-responsive">
                  <Paper sx={{ width: "100%", mb: 2, boxShadow: 'none' }}>
                    <TableContainer className="table hover multiple_tables w-full">
                      <Table aria-labelledby="tableTitle" className="whitespace-nowrap">
                        <TableHead>
                          <TableRow className="table__title bg-slate-50">
                            {announcementHeadCells.map((headCell) => (
                              <TableCell
                                className="table__title font-bold text-slate-700"
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
                            <TableCell className="font-bold text-slate-700">Target</TableCell>
                            {isAuthorized && <TableCell className="font-bold text-slate-700">Action</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody className="table__body">
                          {paginatedRows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <TableCell className="font-medium text-slate-900">{row.title}</TableCell>
                              <TableCell className="text-slate-600">{format(row.startDate, 'MMM dd, yyyy')}</TableCell>
                              <TableCell className="text-slate-600">{format(row.endDate, 'MMM dd, yyyy')}</TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate text-slate-500">{row.description}</div>
                              </TableCell>
                              <TableCell>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${getTargetBadge(row.target)}`}>
                                  {row.target === 'specific' 
                                    ? `${row.targetUserIds?.length || 0} user(s)` 
                                    : row.target}
                                </span>
                              </TableCell>
                              {isAuthorized && (
                                <TableCell className="table__icon-box">
                                  <div className="flex items-center justify-start gap-[10px]">
                                    <button
                                      type="button"
                                      className="table__icon edit hover:bg-blue-100 hover:text-blue-700"
                                      onClick={() => {
                                        setEditData(row);
                                        setModalOpen(true);
                                      }}
                                    >
                                      <i className="fa-sharp fa-light fa-pen"></i>
                                    </button>
                                    <button
                                      className="removeBtn table__icon delete hover:bg-red-100 hover:text-red-700"
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
                
                <Box className="table-search-box mt-[30px] p-4 flex justify-between items-center border-t border-slate-100" sx={{ p: 2 }}>
                  <Box className="text-sm text-slate-500">
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
                    color="primary"
                  />
                </Box>
              </>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
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
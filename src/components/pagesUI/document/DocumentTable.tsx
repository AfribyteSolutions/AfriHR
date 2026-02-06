"use client";
import React, { useState, useEffect } from "react";
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
import { IDocument } from "@/interface/table.interface";
import { documentHeadCells } from "@/data/table-head-cell/table-head";
import Link from "next/link";
import UpdateDocumentModal from "./UpdateDocumentModal";
import DeleteModal from "@/components/common/DeleteModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { toast } from "sonner";

const DocumentTable = () => {
  const { user: userData } = useAuthUserContext();
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<IDocument | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch Documents
  useEffect(() => {
    const fetchDocs = async () => {
      if (!userData?.companyId) return;
      // If employee, only get their docs; if manager, get all company docs
      const url = userData.role === 'employee' 
        ? `/api/documents?companyId=${userData.companyId}&userId=${userData.uid}`
        : `/api/documents?companyId=${userData.companyId}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setDocuments(data);
    };
    fetchDocs();
  }, [userData]);

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
  } = useMaterialTableHook<IDocument | any>(documents, 10);

  const handleDeleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Document deleted successfully");
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        setModalDeleteOpen(false);
      }
    } catch (error) {
      toast.error("Failed to delete document");
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
                        {documentHeadCells.map((headCell) => (
                          <TableCell
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
                      </TableRow>
                    </TableHead>

                    <TableBody className="table__body">
                      {paginatedRows.map((row, index) => (
                        <TableRow key={row.id || index} selected={selected.includes(index)}>
                          <TableCell>{row?.fileName}</TableCell>
                          <TableCell>
                            <Link className="table__icon download" href={row?.fileUrl || "#"} target="_blank">
                              <i className="fa-sharp fa-regular fa-folder-arrow-down"></i>
                            </Link>
                          </TableCell>
                          <TableCell>{row?.role}</TableCell>
                          <TableCell>{row?.description}</TableCell>
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
                      ))}
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
        <UpdateDocumentModal open={modalOpen} setOpen={setModalOpen} editData={editData} />
      )}

      {modalDeleteOpen && (
        <DeleteModal
          open={modalDeleteOpen}
          setOpen={setModalDeleteOpen}
          handleDeleteFunc={handleDeleteDocument}
          deleteId={deleteId}
        />
      )}
    </>
  );
};

export default DocumentTable;
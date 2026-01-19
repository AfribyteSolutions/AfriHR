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
import { IPDocument } from "@/interface/table.interface";
import { projectDocumentsData } from "@/data/projects/documents-data";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";

interface DocumentsTableProps {
  project?: any;
}

const headCells = [
  {
    id: "File Name",
    numeric: false,
    disablePadding: false,
    label: "fileName",
  },
  {
    id: "type",
    numeric: false,
    disablePadding: false,
    label: "Type",
  },
  {
    id: "Size",
    numeric: false,
    disablePadding: false,
    label: "size",
  },
  {
    id: "Upload Date",
    numeric: false,
    disablePadding: false,
    label: "uploadDate",
  },
];

const DocumentsTable = ({ project }: DocumentsTableProps) => {
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  // Use project documents or empty array
  const documentsData = project?.attachedFiles || [];

  const {
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    searchQuery,
    paginatedRows,
    filteredRows,
    handleDelete,
    handleRequestSort,
    handleClick,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearchChange,
  } = useMaterialTableHook<IPDocument | any>(documentsData, 5);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !project) return;

    setUploading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/projects/${project.id}/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        alert("Documents uploaded successfully!");
        // Refresh project data if needed
        window.location.reload(); // Simple refresh for now
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      alert("Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="manaz-common-mat-list w-full table__wrapper table-responsive">
        {/* Upload Section */}
        <div className="mb-4">
          <h6 className="mb-2">Upload Documents</h6>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="form-control"
            accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png"
          />
          {uploading && (
            <p className="text-sm text-blue-500 mt-1">Uploading...</p>
          )}
        </div>

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
                    {headCells.map((headCell) => (
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
                  {paginatedRows.map((row, index) => (
                    <TableRow
                      key={index}
                      selected={selected.includes(index)}
                      onClick={() => handleClick(index)}
                    >
                      <TableCell className="table__designation">
                        {row?.fileName}
                      </TableCell>
                      <TableCell className="table__department">
                        {row?.type}
                      </TableCell>
                      <TableCell className="table__department">
                        {row?.size}
                      </TableCell>
                      <TableCell className="table__department">
                        {row?.uploadData}
                      </TableCell>
                      <TableCell className="table__icon-box">
                        <div className="flex items-center justify-start gap-[10px]">
                          <button
                            type="button"
                            className="table__icon edit"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <i className="fa-sharp fa-light fa-pen"></i>
                          </button>
                          <button
                            className="removeBtn table__icon delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(index);
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
              filteredRows.length,
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

export default DocumentsTable;

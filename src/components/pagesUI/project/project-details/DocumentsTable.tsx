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
// ✅ IMPORT AUTH HERE (Adjust path to match your project structure)
import { auth } from "@/lib/firebase"; 
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";

interface DocumentsTableProps {
  project?: any;
}

const headCells = [
  { id: "fileName", label: "File Name" },
  { id: "type", label: "Type" },
  { id: "size", label: "Size" },
  { id: "uploadDate", label: "Upload Date" },
];

const DocumentsTable = ({ project }: DocumentsTableProps) => {
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !project) return;

    setUploading(true);
    try {
      // ✅ Now 'auth' is defined
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to upload documents.");
        return;
      }

      const idToken = await user.getIdToken();
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
        window.location.reload(); 
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
        <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-card-dark">
          <h6 className="mb-2 font-semibold">Upload Project Documents</h6>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png"
          />
          {uploading && (
            <div className="flex items-center gap-2 mt-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <p className="text-sm text-primary">Uploading files...</p>
            </div>
          )}
        </div>

        <TableControls
          rowsPerPage={rowsPerPage}
          searchQuery={searchQuery}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          handleSearchChange={handleSearchChange}
        />
        
        <Box sx={{ width: "100%" }}>
          <Paper sx={{ width: "100%", mb: 2 }}>
            <TableContainer className="table mb-[20px] hover w-full overflow-x-auto">
              <Table aria-labelledby="tableTitle" className="whitespace-nowrap">
                <TableHead>
                  <TableRow className="table__title">
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        sortDirection={orderBy === headCell.id ? order : false}
                      >
                        <TableSortLabel
                          active={orderBy === headCell.id}
                          direction={orderBy === headCell.id ? order : "asc"}
                          onClick={() => handleRequestSort(headCell.id as string)}
                        >
                          {headCell.label}
                          {orderBy === headCell.id && (
                            <Box component="span" sx={visuallyHidden}>
                              {order === "desc" ? "sorted descending" : "sorted ascending"}
                            </Box>
                          )}
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
                      hover
                    >
                      <TableCell>{row?.fileName}</TableCell>
                      <TableCell>{row?.type}</TableCell>
                      <TableCell>{row?.size}</TableCell>
                      <TableCell>{row?.uploadDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="table__icon delete"
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

        <Box className="flex justify-between items-center mt-4">
           <p className="text-sm text-body">
            Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredRows.length)} of {filteredRows.length}
           </p>
           <Pagination
            count={Math.ceil(filteredRows.length / rowsPerPage)}
            page={page}
            onChange={(_, value) => handleChangePage(value)}
            variant="outlined"
            shape="rounded"
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
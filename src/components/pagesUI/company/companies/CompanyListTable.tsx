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
import { ICompany, ILead } from "@/interface/table.interface";
import { companyListHeadCells } from "@/data/table-head-cell/table-head";
import { useTableStatusHook } from "@/hooks/use-condition-class";
import Link from "next/link";
import Image from "next/image";
import { Checkbox } from "@mui/material";
import { useRouter } from "next/navigation";
import AddCompanyModal from "./AddCompanyModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";
import { toast } from "sonner";

interface CompanyListTableProps {
  companies: any[];
  onRefresh: () => void;
}

const CompanyListTable: React.FC<CompanyListTableProps> = ({ companies, onRefresh }) => {
  const routes = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editData, setEditData] = useState<ILead | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCompanyDetails = (id: string) => {
    routes.push(`/company/company-details/${id}`);
  };

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
    handleSelectAllClick,
    handleClick,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearchChange,
  } = useMaterialTableHook<any>(companies, 10);

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) {
      return;
    }

    try {
      setDeleting(id);
      const res = await fetch(`/api/companies?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete company");
      }

      toast.success("Company deleted successfully");
      onRefresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete company");
    } finally {
      setDeleting(null);
    }
  };

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
                        {companyListHeadCells.map((headCell) => (
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
                          <TableCell colSpan={9} className="text-center py-8">
                            <p className="text-gray-500">No companies found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row, index) => {
                          return (
                            <TableRow
                              key={row.id}
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
                              <TableCell className="sorting_1">
                                <span className="table-avatar flex justify-start items-center">
                                  <Link
                                    className="avatar-img-small me-[10px]"
                                    href={`/company/company-details/${row.id}`}
                                  >
                                    {row?.branding?.logoUrl ? (
                                      <Image
                                        src={row.branding.logoUrl}
                                        className="img-36"
                                        alt={row.name}
                                        width={36}
                                        height={36}
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-gray-600 font-medium text-sm">
                                          {row.name?.charAt(0) || "?"}
                                        </span>
                                      </div>
                                    )}
                                  </Link>
                                  <Link
                                    href={`/company/company-details/${row.id}`}
                                  >
                                    {row?.name}
                                  </Link>
                                </span>
                              </TableCell>

                              <TableCell className="table__loan-amount">
                                {row?.country || row?.address || "-"}
                              </TableCell>

                              <TableCell className="table__loan-created">
                                {row?.subdomain}
                              </TableCell>
                              <TableCell className="table__loan-created">
                                -
                              </TableCell>
                              <TableCell className="table__loan-created">
                                -
                              </TableCell>
                              <TableCell>
                                {row?.industry || "-"}
                              </TableCell>
                              <TableCell>
                                <span className="tag-badge">{row?.companySize || 0} employees</span>
                              </TableCell>
                              <TableCell className="table__loan-created">
                                <div className="company__contact">
                                  <Link href="#">
                                  <i className="fa-light fa-phone"></i>
                                </Link>
                                <Link href="#">
                                  <i className="fa-sharp fa-light fa-envelope"></i>
                                </Link>
                                <Link href="#">
                                  <i className="fa-sharp fa-light fa-mailbox"></i>
                                </Link>
                                <Link href="#">
                                  <i className="fa-brands fa-whatsapp"></i>
                                </Link>
                                <Link href="#">
                                  <i className="fa-brands fa-x-twitter"></i>
                                </Link>
                              </div>
                            </TableCell>

                            <TableCell className="table__icon-box">
                              <div className="flex items-center justify-start gap-[10px]">
                                <button
                                  type="button"
                                  className="table__icon download"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompanyDetails(row?.id);
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
                                    // ✅ Convert number to string for DeleteModal
                                    setDeleteId(index.toString());
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

      {modalOpen && <AddCompanyModal open={modalOpen} setOpen={setModalOpen} />}

      {modalDeleteOpen && (
        <DeleteModal
          open={modalDeleteOpen}
          setOpen={setModalDeleteOpen}
          handleDeleteFunc={handleDeleteCompany} // ✅ Use the wrapper function
          deleteId={deleteId}
          collectionName="companies" // ✅ Optional: specify collection name
        />
      )}
    </>
  );
};

export default CompanyListTable;
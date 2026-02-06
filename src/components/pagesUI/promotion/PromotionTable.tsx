"use client";
import React, { useState, useEffect } from "react";
import { 
  Box, Table, TableBody, TableCell, TableContainer, 
  TableHead, Pagination, TableRow, TableSortLabel, Paper 
} from "@mui/material";
import useMaterialTableHook from "@/hooks/useMaterialTableHook";
import Image from "next/image";
import { IPromotion } from "@/interface/table.interface";
import { promotionHeadCells } from "@/data/table-head-cell/table-head";
import UpdatePromotionModal from "./UpdatePromotionModal";
import TableControls from "@/components/elements/SharedInputs/TableControls";
import DeleteModal from "@/components/common/DeleteModal";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { toast } from "sonner";

const PromotionTable = () => {
  const { user: userData } = useAuthUserContext();
  const [dbData, setDbData] = useState<IPromotion[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<IPromotion | null>(null);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");

  const fetchPromotions = async () => {
    if (!userData?.companyId) return;
    try {
      const res = await fetch(`/api/promotions?companyId=${userData.companyId}`);
      const data = await res.json();
      setDbData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchPromotions(); }, [userData?.companyId]);

  const {
    order, orderBy, page, rowsPerPage, searchQuery, paginatedRows, filteredRows,
    handleRequestSort, handleChangePage, handleChangeRowsPerPage, handleSearchChange,
  } = useMaterialTableHook<IPromotion>(dbData, 10);

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/promotions?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted successfully");
        setDbData(prev => prev.filter(item => item.id !== deleteId));
        setModalDeleteOpen(false);
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  // Helper function to format the date and time
  const formatDateTime = (dateString: any) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="col-span-12">
      <div className="card__wrapper">
        <TableControls
          rowsPerPage={rowsPerPage}
          searchQuery={searchQuery}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          handleSearchChange={handleSearchChange}
        />
        <TableContainer component={Paper}>
          <Table className="whitespace-nowrap">
            <TableHead>
              <TableRow className="table__title">
                {promotionHeadCells.map((headCell) => (
                  <TableCell key={headCell.id}>
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : "asc"}
                      onClick={() => handleRequestSort(headCell.id as Extract<keyof IPromotion, string>)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody className="table__body">
              {paginatedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image src={row.employeeImg || "/assets/img/default-user.png"} alt="User" width={32} height={32} className="rounded-full" />
                      {row.promotedEmployee}
                    </div>
                  </TableCell>
                  <TableCell>{row.designation}</TableCell>
                  <TableCell>{row.promotionTitle}</TableCell>
                  {/* Updated Date Cell */}
                  <TableCell>
                    {formatDateTime(row.promotionDate)}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{row.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button className="table__icon edit" onClick={() => { setEditData(row); setModalOpen(true); }}><i className="fa-light fa-pen"></i></button>
                      <button className="table__icon delete" onClick={() => { setDeleteId(row.id || ""); setModalDeleteOpen(true); }}><i className="fa-light fa-trash"></i></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {modalOpen && editData && (
        <UpdatePromotionModal open={modalOpen} setOpen={setModalOpen} editData={editData} />
      )}

      {modalDeleteOpen && (
        <DeleteModal
          open={modalDeleteOpen}
          setOpen={setModalDeleteOpen}
          handleDeleteFunc={confirmDelete}
          deleteId={deleteId}
        />
      )}
    </div>
  );
};

export default PromotionTable;
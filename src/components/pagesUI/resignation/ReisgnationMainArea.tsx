"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import AddNewResignationModal from "./AddNewResignationModal";
import ResignationTable from "./ResignationTable";
import { useAuthUserContext } from "@/context/UserAuthContext";

const ReisgnationMainArea = () => {
  const { user: authUser, loading: loadingAuthUser } = useAuthUserContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [resignationData, setResignationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResignations = async () => {
      if (loadingAuthUser) return;
      if (!authUser?.companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/resignation?companyId=${authUser.companyId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.resignations)) {
          setResignationData(data.resignations);
        }
      } catch (err) {
        console.error("Error fetching resignations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResignations();
  }, [authUser, loadingAuthUser]);

  const refreshResignations = async () => {
    if (!authUser?.companyId) return;

    try {
      const res = await fetch(`/api/resignation?companyId=${authUser.companyId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.resignations)) {
        setResignationData(data.resignations);
      }
    } catch (err) {
      console.error("Error refreshing resignations:", err);
    }
  };

  if (loadingAuthUser || loading) {
    return (
      <div className="app__slide-wrapper">
        <div className="p-6 text-center">
          <p>Loading resignations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app__slide-wrapper">
        <div className="breadcrumb__wrapper mb-[25px]">
          <nav>
            <ol className="breadcrumb flex items-center mb-0">
              <li className="breadcrumb-item">
                <Link href="/">Home</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Resignation
              </li>
            </ol>
          </nav>
          <div className="breadcrumb__btn">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              Add Resignation
            </button>
          </div>
        </div>
        {/* table */}
        <ResignationTable resignationData={resignationData} onRefresh={refreshResignations} />
        {modalOpen && (
          <AddNewResignationModal
            open={modalOpen}
            setOpen={setModalOpen}
            onRefresh={refreshResignations}
          />
        )}
      </div>
    </>
  );
};

export default ReisgnationMainArea;

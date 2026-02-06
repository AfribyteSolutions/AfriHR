"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import TerminationTable from "./TerminationTable";
import AddNewTerminationModal from "./AddNewTerminationModal";
import { useAuthUserContext } from "@/context/UserAuthContext";

const TerminationMainArea = () => {
  const { user: authUser, loading: loadingAuthUser } = useAuthUserContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [terminationData, setTerminationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerminations = async () => {
      if (loadingAuthUser) return;
      if (!authUser?.companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/termination?companyId=${authUser.companyId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.terminations)) {
          setTerminationData(data.terminations);
        }
      } catch (err) {
        console.error("Error fetching terminations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTerminations();
  }, [authUser, loadingAuthUser]);

  const refreshTerminations = async () => {
    if (!authUser?.companyId) return;

    try {
      const res = await fetch(`/api/termination?companyId=${authUser.companyId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.terminations)) {
        setTerminationData(data.terminations);
      }
    } catch (err) {
      console.error("Error refreshing terminations:", err);
    }
  };

  if (loadingAuthUser || loading) {
    return (
      <div className="app__slide-wrapper">
        <div className="p-6 text-center">
          <p>Loading terminations...</p>
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
                Termination
              </li>
            </ol>
          </nav>
          <div className="breadcrumb__btn">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              Add Termination
            </button>
          </div>
        </div>
        {/* table */}
        <TerminationTable terminationData={terminationData} onRefresh={refreshTerminations} />
        {modalOpen && (
          <AddNewTerminationModal
            open={modalOpen}
            setOpen={setModalOpen}
            onRefresh={refreshTerminations}
          />
        )}
      </div>
    </>
  );
};

export default TerminationMainArea;

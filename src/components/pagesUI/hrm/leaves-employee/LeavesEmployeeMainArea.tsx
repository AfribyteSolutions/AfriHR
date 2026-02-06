"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import LeavesSummary from "./LeavesSummary";
import LeavesTable from "./LeavesTable";
import AddLeavesModal from "./AddLeavesModal";
import { useAuthUserContext } from "@/context/UserAuthContext";

const LeavesEmployeeMainArea = () => {
  const { user: authUser, loading: loadingAuthUser } = useAuthUserContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      if (loadingAuthUser) return;
      if (!authUser?.uid || !authUser?.companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `/api/leaves?companyId=${authUser.companyId}&employeeId=${authUser.uid}`
        );
        const data = await res.json();

        if (data.success && Array.isArray(data.leaves)) {
          setLeaveData(data.leaves);
        }
      } catch (err) {
        console.error("Error fetching leaves:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [authUser, loadingAuthUser]);

  const refreshLeaves = async () => {
    if (!authUser?.uid || !authUser?.companyId) return;

    try {
      const res = await fetch(
        `/api/leaves?companyId=${authUser.companyId}&employeeId=${authUser.uid}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.leaves)) {
        setLeaveData(data.leaves);
      }
    } catch (err) {
      console.error("Error refreshing leaves:", err);
    }
  };

  if (loadingAuthUser || loading) {
    return (
      <div className="app__slide-wrapper">
        <div className="p-6 text-center">
          <p>Loading leaves...</p>
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
                Employee Leave
              </li>
            </ol>
          </nav>
          <div className="breadcrumb__btn">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              Add Leave
            </button>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
          <LeavesSummary leaveData={leaveData} />
          <LeavesTable leaveData={leaveData} onRefresh={refreshLeaves} />
        </div>
        {modalOpen && (
          <AddLeavesModal
            open={modalOpen}
            setOpen={setModalOpen}
            onRefresh={refreshLeaves}
          />
        )}
      </div>
    </>
  );
};

export default LeavesEmployeeMainArea;

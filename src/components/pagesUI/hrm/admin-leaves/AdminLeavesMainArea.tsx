"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AdminLeaveSummary from "./AdminLeaveSummary";
import AdminLeaveTable from "./AdminLeaveTable";
import LeaveCalendar from "./LeaveCalendar";
import AddAdminLeaveModal from "./AddAdminLeaveModal";
import { useAuthUserContext } from "@/context/UserAuthContext";

const AdminLeavesMainArea = () => {
  const { user: authUser, loading: loadingAuthUser } = useAuthUserContext();
  const searchParams = useSearchParams();
  const highlightLeaveId = searchParams.get('id');
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const enrichLeavesWithEmployeeData = async (leaves: any[]) => {
    try {
      const employeesRes = await fetch(`/api/company-employees?companyId=${authUser?.companyId}`);
      const employeesData = await employeesRes.json();

      if (employeesData.success && Array.isArray(employeesData.employees)) {
        // Create a map of employee data for quick lookup
        const employeeMap = new Map();
        employeesData.employees.forEach((emp: any) => {
          employeeMap.set(emp.uid || emp.id, emp);
        });

        // Merge employee data with leave data
        return leaves.map((leave: any) => {
          const employee = employeeMap.get(leave.employeeId);
          return {
            ...leave,
            fullName: employee?.fullName || leave.employeeName,
            email: employee?.email,
            profilePictureUrl: employee?.profilePictureUrl,
          };
        });
      }
      return leaves;
    } catch (err) {
      console.error("Error enriching leave data:", err);
      return leaves;
    }
  };

  useEffect(() => {
    const fetchLeaves = async () => {
      if (loadingAuthUser) return;
      if (!authUser?.companyId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/leaves?companyId=${authUser.companyId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.leaves)) {
          const enrichedLeaves = await enrichLeavesWithEmployeeData(data.leaves);
          setLeaveData(enrichedLeaves);
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
    if (!authUser?.companyId) return;

    try {
      const res = await fetch(`/api/leaves?companyId=${authUser.companyId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.leaves)) {
        const enrichedLeaves = await enrichLeavesWithEmployeeData(data.leaves);
        setLeaveData(enrichedLeaves);
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
                Leave Admin
              </li>
            </ol>
          </nav>
          <div className="breadcrumb__btn flex items-center gap-3">
            <div className="btn-group">
              <button
                type="button"
                className={`btn ${viewMode === "table" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setViewMode("table")}
              >
                <i className="fa-solid fa-table me-2"></i>
                Table
              </button>
              <button
                type="button"
                className={`btn ${viewMode === "calendar" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setViewMode("calendar")}
              >
                <i className="fa-solid fa-calendar me-2"></i>
                Calendar
              </button>
            </div>
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
          <AdminLeaveSummary leaveData={leaveData} />
          {viewMode === "table" ? (
            <AdminLeaveTable
              leaveData={leaveData}
              onRefresh={refreshLeaves}
              highlightLeaveId={highlightLeaveId}
            />
          ) : (
            <div className="col-span-12">
              <LeaveCalendar leaveData={leaveData} />
            </div>
          )}
        </div>
        {modalOpen && (
          <AddAdminLeaveModal
            open={modalOpen}
            setOpen={setModalOpen}
            onRefresh={refreshLeaves}
          />
        )}
      </div>
    </>
  );
};

export default AdminLeavesMainArea;

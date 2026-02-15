"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import React, { useState, useEffect } from "react";
import AttendanceSummary from "./AttendanceSummary";
import AdminAttendanceTable from "./AdminAttendanceTable";
import MarkAttendanceModal from "./MarkAttendanceModal";
import AttendanceTypeIcons from "./AttendanceTypeIcons";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { toast } from "sonner";

const AttendanceMainArea = () => {
  const { user: authUser } = useAuthUserContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAttendance = async (date?: string) => {
    if (!authUser?.companyId) return;

    try {
      setLoading(true);
      const targetDate = date || selectedDate;

      // Role-based filtering: admins/managers see all employees, regular employees see only their own
      const isManagerOrAdmin = authUser.role === "manager" || authUser.role === "admin";
      const queryParams = new URLSearchParams({
        companyId: authUser.companyId,
        date: targetDate,
      });

      // If regular employee, filter by their employeeId
      if (!isManagerOrAdmin) {
        queryParams.append("employeeId", authUser.uid);
      }

      const res = await fetch(`/api/attendance?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAttendanceData(data.attendance || []);
      } else {
        toast.error("Failed to fetch attendance");
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [authUser?.companyId, selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const isManagerOrAdmin = authUser?.role === "manager" || authUser?.role === "admin";

  return (
    <>
      <div className="app__slide-wrapper">
        <Breadcrumb
          breadTitle={isManagerOrAdmin ? "Attendance - All Employees" : "My Attendance"}
          subTitle="Home"
        />

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="font-medium">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="form-control"
              style={{ width: '200px' }}
            />
          </div>
          {isManagerOrAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              Mark Attendance
            </button>
          )}
        </div>

        {!isManagerOrAdmin && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <i className="fa-solid fa-info-circle mr-2"></i>
              You are viewing your personal attendance records. Contact your manager for any updates or corrections.
            </p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
          <AttendanceSummary
            attendanceData={attendanceData}
            selectedDate={selectedDate}
            isManagerOrAdmin={isManagerOrAdmin}
          />
          <AttendanceTypeIcons />
          <AdminAttendanceTable
            attendanceData={attendanceData}
            selectedDate={selectedDate}
            onRefresh={() => fetchAttendance(selectedDate)}
            loading={loading}
            isManagerOrAdmin={isManagerOrAdmin}
          />
        </div>

        {modalOpen && isManagerOrAdmin && (
          <MarkAttendanceModal
            open={modalOpen}
            setOpen={setModalOpen}
            selectedDate={selectedDate}
            onRefresh={() => fetchAttendance(selectedDate)}
          />
        )}
      </div>
    </>
  );
};

export default AttendanceMainArea;

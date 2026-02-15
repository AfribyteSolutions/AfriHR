"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import React, { useState, useEffect } from "react";
import AttendanceSummary from "./AttendanceSummary";
import AdminAttendanceTable from "./AdminAttendanceTable";
import MarkAttendanceModal from "./MarkAttendanceModal";
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
      const res = await fetch(
        `/api/attendance?companyId=${authUser.companyId}&date=${targetDate}`
      );
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

  return (
    <>
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Attendance" subTitle="Home" />

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
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            Mark Attendance
          </button>
        </div>

        <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
          <AttendanceSummary
            attendanceData={attendanceData}
            selectedDate={selectedDate}
          />
          <AdminAttendanceTable
            attendanceData={attendanceData}
            selectedDate={selectedDate}
            onRefresh={() => fetchAttendance(selectedDate)}
            loading={loading}
          />
        </div>

        {modalOpen && (
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

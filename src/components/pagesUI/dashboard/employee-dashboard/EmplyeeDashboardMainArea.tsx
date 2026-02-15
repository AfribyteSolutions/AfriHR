"use client";
import React, { useState, useEffect, useCallback } from "react";
import AlartHeader from "./AlartHeader";
import DashboardCardItem from "./DashboardCardItem";
import MarkAttendance from "./MarkAttendance";
import WelcomeThumb from "./WelcomeThumb";
import MeetingScheduleTwo from "./MeetingScheduleTwo";
import AttendanceLeaves from "./AttendanceLeaves";
import LeavesTable from "@/components/pagesUI/hrm/leaves-employee/LeavesTable";
import { Company } from "@/types/company";
import { useAuthUserContext } from "@/context/UserAuthContext";

interface Props {
  company: Company;
}

const EmplyeeDashboardMainArea: React.FC<Props> = ({ company }) => {
  const { user: userData } = useAuthUserContext();
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    tickets: 0,
    resolvedTickets: 0,
    projects: 0,
    leaves: 0
  });
  const [loading, setLoading] = useState(true);

  // ✅ Unified fetcher ensures Summary and Table stay in sync
  const fetchDashboardData = useCallback(async () => {
    if (!userData?.uid) return;

    try {
      setLoading(true);
      // 1. Fetch Leaves for this specific employee
      const leaveRes = await fetch(`/api/leaves?uid=${userData.uid}`);
      const leaveResult = await leaveRes.json();
      if (leaveResult.success) {
        setLeaveData(leaveResult.data || []);
      }

      // 2. Fetch General Stats
      const statsRes = await fetch(`/api/employee-stats?uid=${userData.uid}`);
      const statsResult = await statsRes.json();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [userData?.uid]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="app__slide-wrapper">
      <AlartHeader />
      
      <div className="grid grid-cols-12 gap-6 mt-4">
        {/* Left Side Actions */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-6">
          <WelcomeThumb />
          <MarkAttendance />
          <MeetingScheduleTwo />
        </div>

        {/* Right Side Content */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="grid grid-cols-12 gap-6">
            
            <DashboardCardItem stats={stats} />

            <div className="col-span-12">
              {/* ✅ Summary calculates from leaveData prop */}
              <AttendanceLeaves leaveData={leaveData} />
            </div>

            <div className="col-span-12">
              <div className="card__wrapper">
                <div className="p-[20px] border-b border-gray-100">
                   <h5 className="text-[18px] font-bold mb-0">My Leave History</h5>
                </div>
                
                {loading ? (
                   <div className="p-10 text-center text-gray-400">Loading records...</div>
                ) : (
                  /* ✅ Table receives data and the refresh trigger */
                  <LeavesTable 
                    leaveData={leaveData} 
                    onRefresh={fetchDashboardData} 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmplyeeDashboardMainArea;
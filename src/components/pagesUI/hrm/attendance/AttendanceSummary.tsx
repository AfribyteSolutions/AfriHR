import SummarySingleCard from "@/components/common/SummarySingleCard";
import React from "react";

interface AttendanceRecord {
  id: string;
  status: string;
}

interface AttendanceSummaryProps {
  attendanceData: AttendanceRecord[];
  selectedDate: string;
  isManagerOrAdmin: boolean;
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({
  attendanceData,
  selectedDate,
  isManagerOrAdmin,
}) => {
  const totalRecords = attendanceData.length;
  const presentCount = attendanceData.filter((a) => a.status === "present").length;
  const absentCount = attendanceData.filter((a) => a.status === "absent").length;
  const lateCount = attendanceData.filter((a) => a.status === "late").length;
  const halfDayCount = attendanceData.filter((a) => a.status === "half_day").length;
  const onLeaveCount = attendanceData.filter((a) => a.status === "leave").length;

  return (
    <>
      <div className="col-span-12 sm:col-span-6 xxl:col-span-3">
        <SummarySingleCard
          iconClass="fa-sharp fa-regular fa-users"
          title={isManagerOrAdmin ? "Total Records" : "My Records"}
          value={totalRecords}
          description={new Date(selectedDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          percentageChange=""
          isIncrease={true}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xxl:col-span-3">
        <SummarySingleCard
          iconClass="fa-light fa-badge-check"
          title="Present"
          value={presentCount}
          description={`${lateCount} Late`}
          percentageChange=""
          isIncrease={true}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xxl:col-span-3">
        <SummarySingleCard
          iconClass="fa-sharp fa-regular fa-user-clock"
          title="Half Day"
          value={halfDayCount}
          description={`${absentCount} Absent`}
          percentageChange=""
          isIncrease={false}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xxl:col-span-3">
        <SummarySingleCard
          iconClass="fa-sharp fa-regular fa-house-person-leave"
          title="On Leave"
          value={onLeaveCount}
          description={isManagerOrAdmin ? "Employees" : "Days"}
          percentageChange=""
          isIncrease={true}
        />
      </div>
    </>
  );
};

export default AttendanceSummary;

import React from "react";
import SummarySingleCard from "@/components/common/SummarySingleCard";

interface LeavesSummaryProps {
  leaveData: any[];
}

const LeavesSummary: React.FC<LeavesSummaryProps> = ({ leaveData = [] }) => {
  const totalLeaves = leaveData.length;
  const approvedLeaves = leaveData.filter((leave) => leave.status === "approved").length;
  const rejectedLeaves = leaveData.filter((leave) => leave.status === "rejected").length;
  const pendingLeaves = leaveData.filter((leave) => leave.status === "pending").length;

  const summaryData = [
    {
      iconClass: "fa-light fa-ban",
      title: "Total Leave",
      value: totalLeaves.toString(),
      description: "",
      percentageChange: "",
      isIncrease: true,
    },
    {
      iconClass: "fa-light fa-badge-check",
      title: "Approve",
      value: approvedLeaves.toString(),
      description: "",
      percentageChange: "",
      isIncrease: false,
    },
    {
      iconClass: "fa-sharp fa-regular fa-user",
      title: "Rejected",
      value: rejectedLeaves.toString(),
      description: "",
      percentageChange: "",
      isIncrease: false,
    },
    {
      iconClass: "fa-sharp fa-regular fa-house-person-leave",
      title: "Pending",
      value: pendingLeaves.toString(),
      description: "",
      percentageChange: "",
      isIncrease: true,
    },
  ];

  return (
    <>
      {summaryData.map((item, index) => (
        <div className="col-span-12 sm:col-span-6 xxl:col-span-3" key={index}>
          <SummarySingleCard {...item} />
        </div>
      ))}
    </>
  );
};

export default LeavesSummary;

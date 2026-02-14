import SummarySingleCard from "@/components/common/SummarySingleCard";
import React from "react";

interface ReportsSummaryProps {
  reports: any[];
}

const ReportsSummary: React.FC<ReportsSummaryProps> = ({ reports }) => {
  // Calculate statistics from real data
  const totalReports = reports.length;

  const performanceReports = reports.filter(
    (r) => r.reportType === "performance"
  ).length;

  const reviewReports = reports.filter(
    (r) => r.reportType === "review"
  ).length;

  const warningReports = reports.filter(
    (r) => r.reportType === "warning"
  ).length;

  const feedbackReports = reports.filter(
    (r) => r.reportType === "feedback"
  ).length;

  const reportsData = [
    {
      iconClass: "fa-sharp fa-light fa-file-lines",
      title: "Total Reports",
      value: totalReports.toString(),
    },
    {
      iconClass: "fa-sharp fa-light fa-chart-line",
      title: "Performance",
      value: performanceReports.toString(),
    },
    {
      iconClass: "fa-light fa-star",
      title: "Reviews",
      value: reviewReports.toString(),
    },
    {
      iconClass: "fa-sharp fa-light fa-triangle-exclamation",
      title: "Warnings",
      value: warningReports.toString(),
    },
  ];

  return (
    <>
      {reportsData.map((item, index) => (
        <div className="col-span-12 sm:col-span-6 xxl:col-span-3" key={index}>
          <SummarySingleCard {...item} />
        </div>
      ))}
    </>
  );
};

export default ReportsSummary;

"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ReportsTable from "./ReportsTable";
import ReportsSummary from "./ReportsSummary";
import AddReportModal from "./AddReportModal";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { toast } from "sonner";

const ReportsMainArea = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuthUserContext();

  const fetchReports = async () => {
    if (!authUser?.companyId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/reports?companyId=${authUser.companyId}`);
      const data = await res.json();

      if (data.success) {
        setReportsData(data.reports || []);
      } else {
        toast.error("Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [authUser?.companyId]);

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
                Employee Reports
              </li>
            </ol>
          </nav>
          <div className="breadcrumb__btn">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              Create Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-x-5 maxXs:gap-x-0">
          <ReportsSummary reports={reportsData} />
          <ReportsTable
            reportsData={reportsData}
            onRefresh={fetchReports}
            loading={loading}
          />
        </div>

        {modalOpen && (
          <AddReportModal
            open={modalOpen}
            setOpen={setModalOpen}
            onRefresh={fetchReports}
          />
        )}
      </div>
    </>
  );
};

export default ReportsMainArea;

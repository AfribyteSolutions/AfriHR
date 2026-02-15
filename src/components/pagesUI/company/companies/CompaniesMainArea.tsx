"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import CompaniesSummary from "./CompaniesSummary";
import CompanyListTable from "./CompanyListTable";
import AddCompanyModal from "./AddCompanyModal";
import { useAuthUserContext } from "@/context/UserAuthContext";

const CompaniesMainArea = () => {
  const { user: authUser, loading: loadingAuthUser } = useAuthUserContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (loadingAuthUser) return;
      if (!authUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Build query params - include companyId if user has one
        const params = new URLSearchParams({
          superAdminId: authUser.uid,
        });

        if (authUser.companyId) {
          params.append("companyId", authUser.companyId);
        }

        const res = await fetch(`/api/companies?${params.toString()}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.companies)) {
          setCompanies(data.companies);
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [authUser, loadingAuthUser]);

  const refreshCompanies = async () => {
    if (!authUser?.uid) return;

    try {
      // Build query params - include companyId if user has one
      const params = new URLSearchParams({
        superAdminId: authUser.uid,
      });

      if (authUser.companyId) {
        params.append("companyId", authUser.companyId);
      }

      const res = await fetch(`/api/companies?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.companies)) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.error("Error refreshing companies:", err);
    }
  };

  if (loadingAuthUser || loading) {
    return (
      <div className="app__slide-wrapper">
        <div className="p-6 text-center">
          <p>Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app__slide-wrapper">
        <div className="breadcrumb__area">
          <div className="breadcrumb__wrapper mb-[25px]">
            <nav>
              <ol className="breadcrumb mb-0 flex">
                <li className="breadcrumb-item">
                  <Link href="/">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Company
                </li>
              </ol>
            </nav>
            <div className="breadcrumb__btn">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalOpen(true)}
              >
                Add Company
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
          <CompaniesSummary companies={companies} />
          <CompanyListTable companies={companies} onRefresh={refreshCompanies} />
        </div>
      </div>

      {modalOpen && (
        <AddCompanyModal
          open={modalOpen}
          setOpen={setModalOpen}
          onRefresh={refreshCompanies}
        />
      )}
    </>
  );
};

export default CompaniesMainArea;

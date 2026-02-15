"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import React, { useState, useEffect } from "react";
import CompanySideContentSection from "./CompanySideContentSection";
import CompanyInfo from "./CompanyInfo";
import CompanyAddDealsModal from "./CompanyAddDealsModal";
import CompanySendMailModal from "./CompanySendMailModal";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { getSubdomain } from "@/lib/getSubdomain";

const CompanyDetailsMainArea = () => {
  const { user: authUser, loading: authLoading } = useAuthUserContext();
  const [openModal, setOpenModal] = useState(false);
  const [openSendEMailModal, setSendEMailModal] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleToggle = () => setOpenModal(!openModal);
  const handleSendEmailToggle = () => setSendEMailModal(!openSendEMailModal);

  useEffect(() => {
    const fetchCompany = async () => {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      try {
        setLoading(true);

        // Get subdomain from current URL
        const subdomain = getSubdomain(window.location.hostname);

        let url = '/api/company?';

        // Prioritize subdomain, fallback to user's companyId
        if (subdomain) {
          url += `subdomain=${subdomain}`;
          console.log("🔍 Fetching company by subdomain:", subdomain);
        } else if (authUser?.companyId) {
          url += `id=${authUser.companyId}`;
          console.log("🔍 Fetching company by companyId:", authUser.companyId);
        } else {
          console.error("❌ No subdomain or companyId available");
          setLoading(false);
          return;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data) {
          console.log("✅ Company data loaded:", data);
          setCompany(data);
        } else {
          console.error("❌ Failed to fetch company:", data);
        }
      } catch (err) {
        console.error("❌ Error fetching company:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [authUser, authLoading]);

  if (loading) {
    return (
      <div className="app__slide-wrapper">
        <div className="p-6 text-center">
          <p>Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="app__slide-wrapper">
        <div className="p-6 text-center">
          <p className="text-gray-500">Company not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* -- App side area start -- */}
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Company Details" subTitle="Home" />
        <div className="grid grid-cols-12">
          <div className="col-span-12">
            <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
              <div className="col-span-12 xl:col-span-3">
                <CompanyInfo
                  company={company}
                  handleToggle={handleToggle}
                  handleSendEmailToggle={handleSendEmailToggle}
                />
              </div>
              <div className="col-span-12 xl:col-span-9">
                <CompanySideContentSection company={company} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* -- App side area end -- */}
      {/* Render the modal */}
      {openModal && (
        <CompanyAddDealsModal open={openModal} setOpen={setOpenModal} />
      )}
      {openSendEMailModal && (
        <CompanySendMailModal
          open={openSendEMailModal}
          setOpen={setSendEMailModal}
        />
      )}
    </>
  );
};

export default CompanyDetailsMainArea;
